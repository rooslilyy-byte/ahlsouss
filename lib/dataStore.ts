import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Client, 
  MasterProduct, 
  PurchaseBatch, 
  ClientDemand, 
  DemandItem,
  SupplierAggregatedItem 
} from './types';

// Helper to determine if we are running in browser context to fetch API route
const isBrowser = typeof window !== 'undefined';

async function fetchStoreApi(action: string, payload: Record<string, any> = {}) {
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Database request failed');
  }
  return data;
}

// --- MASTER PRODUCTS ---
export async function getMasterProducts(): Promise<MasterProduct[]> {
  if (isBrowser) {
    const res = await fetch('/api/store', { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.masterProducts) {
      return data.masterProducts;
    }
  }

  if (isSupabaseConfigured) {
    const { data } = await supabase.from('master_products').select('*').order('name');
    if (data) return data;
  }

  return [];
}

export async function addMasterProduct(name: string, category: string = 'كتاب مدرسي'): Promise<MasterProduct> {
  const trimmedName = name.trim();
  if (isBrowser) {
    const data = await fetchStoreApi('add_master_product', { name: trimmedName, category });
    return data.product;
  }

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('master_products')
      .upsert({ name: trimmedName, category }, { onConflict: 'name' })
      .select()
      .single();
    if (data) return data;
  }

  return { id: 'mp-' + Date.now(), name: trimmedName, category };
}

export async function updateMasterProductStock(productName: string, deltaQty: number): Promise<void> {
  const trimmed = productName.trim();
  if (isBrowser) {
    await fetchStoreApi('update_stock', { productName: trimmed, deltaQty });
    return;
  }

  if (isSupabaseConfigured) {
    const { data } = await supabase.from('master_products').select('id, available_stock').eq('name', trimmed).maybeSingle();
    if (data) {
      const current = data.available_stock || 0;
      await supabase.from('master_products').update({ available_stock: Math.max(0, current + deltaQty) }).eq('id', data.id);
    }
  }
}

// --- BATCHES ---
export async function getActiveBatch(): Promise<PurchaseBatch> {
  if (isBrowser) {
    const res = await fetch('/api/store', { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.activeBatch) {
      return data.activeBatch;
    }
  }

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('purchase_batches')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) return data;
  }

  return { id: 'batch-001', batch_name: 'دفعة الدخول المدرسي الرئيسي', is_archived: false };
}

export async function archiveActiveBatch(newBatchName: string): Promise<PurchaseBatch> {
  if (isBrowser) {
    const data = await fetchStoreApi('archive_batch', { newBatchName });
    return data.batch;
  }

  if (isSupabaseConfigured) {
    const active = await getActiveBatch();
    const now = new Date().toISOString();
    await supabase.from('purchase_batches').update({ is_archived: true, archived_at: now }).eq('id', active.id);
    const { data } = await supabase.from('purchase_batches').insert({ batch_name: newBatchName, is_archived: false }).select().single();
    if (data) return data;
  }

  return { id: 'batch-' + Date.now(), batch_name: newBatchName, is_archived: false };
}

// --- CLIENT DEMANDS ---
export async function getClientDemands(batchId?: string): Promise<ClientDemand[]> {
  if (isBrowser) {
    const res = await fetch('/api/store', { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.demands) {
      let result: ClientDemand[] = data.demands;
      if (batchId) {
        result = result.filter(d => d.batch_id === batchId);
      }
      return result;
    }
  }

  if (isSupabaseConfigured) {
    let query = supabase
      .from('client_demands')
      .select(`
        *,
        client:clients(*),
        items:demand_items(*)
      `)
      .order('created_at', { ascending: false });

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    const { data } = await query;
    if (data) return data as ClientDemand[];
  }

  return [];
}

export async function createClientDemand(
  clientName: string,
  clientPhone: string,
  items: { product_name: string; quantity: number }[]
): Promise<ClientDemand | any> {
  if (isBrowser) {
    await fetchStoreApi('create_demand', { clientName, clientPhone, items });
    return;
  }

  if (isSupabaseConfigured) {
    const activeBatch = await getActiveBatch();
    const cleanPhone = clientPhone.trim();
    const cleanName = clientName.trim();

    for (const item of items) {
      await addMasterProduct(item.product_name);
    }

    let { data: existingClient } = await supabase.from('clients').select('*').eq('phone', cleanPhone).maybeSingle();
    if (!existingClient) {
      const { data: newCli } = await supabase.from('clients').insert({ name: cleanName, phone: cleanPhone }).select().single();
      existingClient = newCli;
    }

    if (existingClient) {
      const { data: demand } = await supabase.from('client_demands').insert({ client_id: existingClient.id, batch_id: activeBatch.id, status: 'pending' }).select().single();
      if (demand) {
        const demandItems = items.map(it => ({
          demand_id: demand.id,
          product_name: it.product_name,
          quantity: Math.max(1, Math.floor(it.quantity || 1)),
          is_in_stock: false,
          is_delivered: false,
        }));
        await supabase.from('demand_items').insert(demandItems);
      }
    }
  }
}

export async function updateDemandItemState(
  itemId: string,
  updates: { is_in_stock?: boolean; is_delivered?: boolean }
): Promise<void> {
  if (isBrowser) {
    await fetchStoreApi('update_item_state', { itemId, updates });
    return;
  }

  if (isSupabaseConfigured) {
    await supabase.from('demand_items').update(updates).eq('id', itemId);
  }
}

export async function deleteClientDemand(demandId: string): Promise<void> {
  if (isBrowser) {
    await fetchStoreApi('delete_demand', { demandId });
    return;
  }

  if (isSupabaseConfigured) {
    await supabase.from('client_demands').delete().eq('id', demandId);
  }
}

export async function updateClientDemand(
  demandId: string,
  clientName: string,
  clientPhone: string,
  items: {
    id?: string;
    product_name: string;
    quantity: number;
    is_in_stock?: boolean;
    is_delivered?: boolean;
  }[]
): Promise<ClientDemand | any> {
  if (isBrowser) {
    await fetchStoreApi('update_demand', { demandId, clientName, clientPhone, items });
    return;
  }

  if (isSupabaseConfigured) {
    const cleanPhone = clientPhone.trim();
    const cleanName = clientName.trim();

    for (const item of items) {
      if (item.product_name?.trim()) {
        await addMasterProduct(item.product_name);
      }
    }

    const { data: currentDemand } = await supabase.from('client_demands').select('*, items:demand_items(*)').eq('id', demandId).single();
    if (currentDemand) {
      await supabase.from('clients').update({ name: cleanName, phone: cleanPhone }).eq('id', currentDemand.client_id);
      const keepItemIds = items.map(i => i.id).filter(Boolean) as string[];
      if (keepItemIds.length > 0) {
        await supabase.from('demand_items').delete().eq('demand_id', demandId).not('id', 'in', `(${keepItemIds.join(',')})`);
      } else {
        await supabase.from('demand_items').delete().eq('demand_id', demandId);
      }

      for (const item of items) {
        const validQty = Math.max(1, Math.floor(item.quantity || 1));
        if (item.id) {
          await supabase.from('demand_items').update({ product_name: item.product_name.trim(), quantity: validQty, is_in_stock: item.is_in_stock ?? false, is_delivered: item.is_delivered ?? false }).eq('id', item.id);
        } else {
          await supabase.from('demand_items').insert({ demand_id: demandId, product_name: item.product_name.trim(), quantity: validQty, is_in_stock: item.is_in_stock ?? false, is_delivered: item.is_delivered ?? false });
        }
      }
    }
  }
}

// --- AGGREGATED REPORT FOR SUPPLIERS (A4 PRINT) ---
export async function getSupplierAggregatedReport(batchId?: string): Promise<SupplierAggregatedItem[]> {
  const demands = await getClientDemands(batchId);
  const itemMap: Record<string, {
    productName: string;
    totalQuantity: number;
    clients: {
      clientName: string;
      phone: string;
      quantity: number;
      demandId: string;
    }[];
  }> = {};

  for (const dem of demands) {
    if (!dem.items || !dem.client) continue;

    for (const item of dem.items) {
      if (item.is_delivered || item.is_in_stock) continue;

      const pName = item.product_name.trim();
      if (!itemMap[pName]) {
        itemMap[pName] = {
          productName: pName,
          totalQuantity: 0,
          clients: [],
        };
      }

      itemMap[pName].totalQuantity += item.quantity;
      itemMap[pName].clients.push({
        clientName: dem.client.name,
        phone: dem.client.phone,
        quantity: item.quantity,
        demandId: dem.id,
      });
    }
  }

  const result: SupplierAggregatedItem[] = Object.values(itemMap);
  return result.sort((a, b) => b.totalQuantity - a.totalQuantity);
}
