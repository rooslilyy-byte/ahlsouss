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

export interface FullStoreData {
  activeBatch: PurchaseBatch;
  masterProducts: MasterProduct[];
  demands: ClientDemand[];
}

let storeCache: { data: FullStoreData | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

let pendingStorePromise: Promise<FullStoreData> | null = null;

export function invalidateStoreCache(): void {
  storeCache.data = null;
  storeCache.timestamp = 0;
}

export async function getFullStoreData(forceRefresh = false): Promise<FullStoreData> {
  const now = Date.now();
  // Return cached data if fresh (less than 3000ms old) and not forced
  if (!forceRefresh && storeCache.data && (now - storeCache.timestamp < 3000)) {
    return storeCache.data;
  }

  // If a request is already in-flight, re-use its promise to prevent duplicate requests
  if (pendingStorePromise) {
    return pendingStorePromise;
  }

  pendingStorePromise = (async () => {
    try {
      if (isBrowser) {
        const res = await fetch('/api/store', { method: 'GET', cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          const fullData: FullStoreData = {
            activeBatch: data.activeBatch || { id: 'batch-001', batch_name: 'دفعة الدخول المدرسي الرئيسي', is_archived: false },
            masterProducts: data.masterProducts || [],
            demands: data.demands || [],
          };
          storeCache = { data: fullData, timestamp: Date.now() };
          return fullData;
        }
      }

      // Supabase Direct Fallback
      let batch: PurchaseBatch = { id: 'batch-001', batch_name: 'دفعة الدخول المدرسي الرئيسي', is_archived: false };
      let masterProducts: MasterProduct[] = [];
      let demands: ClientDemand[] = [];

      if (isSupabaseConfigured) {
        const { data: bData } = await supabase
          .from('purchase_batches')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (bData) batch = bData;

        const { data: mpData } = await supabase
          .from('master_products')
          .select('*')
          .order('name');
        if (mpData) masterProducts = mpData;

        const { data: dData } = await supabase
          .from('client_demands')
          .select(`
            *,
            client:clients(*),
            items:demand_items(*)
          `)
          .order('created_at', { ascending: false });
        if (dData) demands = dData as ClientDemand[];
      }

      const fullData: FullStoreData = { activeBatch: batch, masterProducts, demands };
      storeCache = { data: fullData, timestamp: Date.now() };
      return fullData;
    } finally {
      pendingStorePromise = null;
    }
  })();

  return pendingStorePromise;
}

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
  invalidateStoreCache();
  return data;
}

// --- MASTER PRODUCTS ---
export async function getMasterProducts(forceRefresh = false): Promise<MasterProduct[]> {
  const data = await getFullStoreData(forceRefresh);
  return data.masterProducts;
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
    invalidateStoreCache();
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
    invalidateStoreCache();
  }
}

// --- BATCHES ---
export async function getActiveBatch(forceRefresh = false): Promise<PurchaseBatch> {
  const data = await getFullStoreData(forceRefresh);
  return data.activeBatch;
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
    invalidateStoreCache();
    if (data) return data;
  }

  return { id: 'batch-' + Date.now(), batch_name: newBatchName, is_archived: false };
}

// --- CLIENT DEMANDS ---
export async function getClientDemands(batchId?: string, forceRefresh = false): Promise<ClientDemand[]> {
  const data = await getFullStoreData(forceRefresh);
  if (batchId) {
    return data.demands.filter(d => d.batch_id === batchId);
  }
  return data.demands;
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
    invalidateStoreCache();
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
    invalidateStoreCache();
  }
}

export async function autoAllocateStock(
  productName: string,
  receivedQty: number
): Promise<{ clientName: string; phone: string; fulfilledQty: number; link: string }[]> {
  const cleanName = productName.trim();
  const qty = Math.max(1, Math.floor(receivedQty));

  if (isBrowser) {
    const data = await fetchStoreApi('auto_allocate_stock', { productName: cleanName, receivedQty: qty });
    return data.allocatedClients || [];
  }

  if (isSupabaseConfigured) {
    const activeBatch = await getActiveBatch();
    const { data: demands } = await supabase
      .from('client_demands')
      .select('id, created_at, client:clients(*), items:demand_items(*)')
      .eq('batch_id', activeBatch.id)
      .order('created_at', { ascending: true });

    let remaining = qty;
    const allocatedMap: Record<string, { clientName: string; phone: string; totalFulfilled: number }> = {};

    if (demands) {
      for (const dem of demands) {
        if (remaining <= 0) break;
        if (!dem.items || !dem.client) continue;
        const cli: any = Array.isArray(dem.client) ? dem.client[0] : dem.client;
        if (!cli || !cli.phone) continue;

        for (const item of dem.items) {
          if (remaining <= 0) break;
          if (
            item.product_name.trim().toLowerCase() === cleanName.toLowerCase() &&
            !item.is_in_stock &&
            !item.is_delivered
          ) {
            const needed = item.quantity;
            if (remaining >= needed) {
              await supabase.from('demand_items').update({ is_in_stock: true }).eq('id', item.id);
              remaining -= needed;

              const key = cli.phone;
              if (!allocatedMap[key]) {
                allocatedMap[key] = { clientName: cli.name, phone: cli.phone, totalFulfilled: 0 };
              }
              allocatedMap[key].totalFulfilled += needed;
            } else {
              const fulfilled = remaining;
              const missingLeft = needed - fulfilled;

              await supabase.from('demand_items').update({ quantity: missingLeft, is_in_stock: false }).eq('id', item.id);
              await supabase.from('demand_items').insert({ demand_id: dem.id, product_name: cleanName, quantity: fulfilled, is_in_stock: true, is_delivered: false });

              remaining = 0;

              const key = cli.phone;
              if (!allocatedMap[key]) {
                allocatedMap[key] = { clientName: cli.name, phone: cli.phone, totalFulfilled: 0 };
              }
              allocatedMap[key].totalFulfilled += fulfilled;
            }
          }
        }
      }
    }

    if (remaining > 0) {
      await updateMasterProductStock(cleanName, remaining);
    }

    invalidateStoreCache();

    return Object.values(allocatedMap).map(c => {
      let rawPhone = c.phone.replace(/\D/g, '');
      if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);
      const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${c.clientName}،\n\nنخبركم من مكتبة وراقة اهل سوس أن كتاب / مستلزم: "${cleanName}" (عدد: ${c.totalFulfilled}) الذي طلبتموه قد وصل للمحل وهو جاهز للتسليم!\n\nالمكان: مكتبة وراقة اهل سوس\nالهاتف: 0675502660`;
      return {
        clientName: c.clientName,
        phone: c.phone,
        fulfilledQty: c.totalFulfilled,
        link: `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`,
      };
    });
  }

  return [];
}

export async function deleteClientDemand(demandId: string): Promise<void> {
  if (isBrowser) {
    await fetchStoreApi('delete_demand', { demandId });
    return;
  }

  if (isSupabaseConfigured) {
    await supabase.from('client_demands').delete().eq('id', demandId);
    invalidateStoreCache();
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
    invalidateStoreCache();
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
