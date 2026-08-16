import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Client, 
  MasterProduct, 
  PurchaseBatch, 
  ClientDemand, 
  DemandItem,
  SupplierAggregatedItem 
} from './types';

// Initial Mock Data for instant demo and offline mode
const MOCK_BATCH: PurchaseBatch = {
  id: 'batch-001',
  batch_name: 'دفعة الدخول المدرسي 2026',
  is_archived: false,
  created_at: new Date().toISOString(),
};

const INITIAL_MASTER_PRODUCTS: MasterProduct[] = [
  { id: 'mp-1', name: 'الجديد في الرياضيات - 6 ابتدائي', category: 'كتب الابتدائية', available_stock: 5 },
  { id: 'mp-2', name: 'المفيد في اللغة العربية - 5 ابتدائي', category: 'كتب الابتدائية', available_stock: 0 },
  { id: 'mp-3', name: 'Mon livre de français - 4ème AEP', category: 'كتب الابتدائية', available_stock: 3 },
  { id: 'mp-4', name: 'في رحاب التربية الإسلامية - 3 إعدادي', category: 'كتب الإعدادية', available_stock: 0 },
  { id: 'mp-5', name: 'النجاح في علوم الحياة والأرض - 2 بكالوريا', category: 'كتب التأهيلية', available_stock: 2 },
  { id: 'mp-6', name: 'دفتر مقلم 100 ورقة (24x32)', category: 'أدوات ومستلزمات', available_stock: 12 },
  { id: 'mp-7', name: 'دفتر كبير 200 ورقة (A4)', category: 'أدوات ومستلزمات', available_stock: 0 },
  { id: 'mp-8', name: 'علبة أقلام ملونة Maped (24 قلم)', category: 'أدوات ومستلزمات', available_stock: 4 },
  { id: 'mp-9', name: 'محفظة مدرسية مقاومة للماء', category: 'أدوات ومستلزمات', available_stock: 0 },
  { id: 'mp-10', name: 'مقلمة هندسية Maped الأصلية', category: 'أدوات ومستلزمات', available_stock: 6 },
];

const INITIAL_DEMANDS: ClientDemand[] = [
  {
    id: 'dem-1',
    client_id: 'cli-1',
    batch_id: 'batch-001',
    status: 'partial',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    client: { id: 'cli-1', name: 'الحسن أيت الطالب', phone: '0661234567' },
    items: [
      { id: 'item-1', demand_id: 'dem-1', product_name: 'الجديد في الرياضيات - 6 ابتدائي', quantity: 1, is_in_stock: true, is_delivered: true },
      { id: 'item-2', demand_id: 'dem-1', product_name: 'Mon livre de français - 4ème AEP', quantity: 1, is_in_stock: true, is_delivered: false },
      { id: 'item-3', demand_id: 'dem-1', product_name: 'دفتر مقلم 100 ورقة (24x32)', quantity: 4, is_in_stock: false, is_delivered: false },
    ],
  },
  {
    id: 'dem-2',
    client_id: 'cli-2',
    batch_id: 'batch-001',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    client: { id: 'cli-2', name: 'فاطمة الزهراء السوسي', phone: '0678901234' },
    items: [
      { id: 'item-4', demand_id: 'dem-2', product_name: 'المفيد في اللغة العربية - 5 ابتدائي', quantity: 1, is_in_stock: false, is_delivered: false },
      { id: 'item-5', demand_id: 'dem-2', product_name: 'دفتر مقلم 100 ورقة (24x32)', quantity: 2, is_in_stock: false, is_delivered: false },
      { id: 'item-6', demand_id: 'dem-2', product_name: 'علبة أقلام ملونة Maped (24 قلم)', quantity: 1, is_in_stock: false, is_delivered: false },
    ],
  },
  {
    id: 'dem-3',
    client_id: 'cli-3',
    batch_id: 'batch-001',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    client: { id: 'cli-3', name: 'عبد الله العربي', phone: '0655443322' },
    items: [
      { id: 'item-7', demand_id: 'dem-3', product_name: 'في رحاب التربية الإسلامية - 3 إعدادي', quantity: 1, is_in_stock: true, is_delivered: true },
      { id: 'item-8', demand_id: 'dem-3', product_name: 'دفتر كبير 200 ورقة (A4)', quantity: 2, is_in_stock: true, is_delivered: true },
    ],
  },
];

// Local state container for mock operations
let mockBatches: PurchaseBatch[] = [MOCK_BATCH];
let mockMasterProducts: MasterProduct[] = [...INITIAL_MASTER_PRODUCTS];
let mockDemands: ClientDemand[] = [...INITIAL_DEMANDS];
let mockClients: Client[] = [
  { id: 'cli-1', name: 'الحسن أيت الطالب', phone: '0661234567' },
  { id: 'cli-2', name: 'فاطمة الزهراء السوسي', phone: '0678901234' },
  { id: 'cli-3', name: 'عبد الله العربي', phone: '0655443322' },
];

// --- MASTER PRODUCTS ---
export async function getMasterProducts(): Promise<MasterProduct[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('master_products').select('*').order('name');
    if (!error && data) return data;
  }
  return [...mockMasterProducts].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

export async function addMasterProduct(name: string, category: string = 'كتاب مدرسي'): Promise<MasterProduct> {
  const trimmedName = name.trim();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('master_products')
      .upsert({ name: trimmedName, category }, { onConflict: 'name' })
      .select()
      .single();
    if (!error && data) return data;
  }

  const existing = mockMasterProducts.find(p => p.name === trimmedName);
  if (existing) return existing;

  const newProd: MasterProduct = {
    id: 'mp-' + Date.now(),
    name: trimmedName,
    category,
    created_at: new Date().toISOString(),
  };
  mockMasterProducts.push(newProd);
  return newProd;
}

export async function updateMasterProductStock(productName: string, deltaQty: number): Promise<void> {
  const trimmed = productName.trim();
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('master_products').select('id, available_stock').eq('name', trimmed).maybeSingle();
    if (data) {
      const current = data.available_stock || 0;
      await supabase.from('master_products').update({ available_stock: Math.max(0, current + deltaQty) }).eq('id', data.id);
    }
  }

  const found = mockMasterProducts.find(p => p.name === trimmed);
  if (found) {
    found.available_stock = Math.max(0, (found.available_stock || 0) + deltaQty);
  }
}

// --- BATCHES ---
export async function getActiveBatch(): Promise<PurchaseBatch> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('purchase_batches')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!error && data) return data;
  }
  const active = mockBatches.find(b => !b.is_archived);
  if (active) return active;

  const newBatch: PurchaseBatch = {
    id: 'batch-' + Date.now(),
    batch_name: 'دفعة جديدة - ' + new Date().toLocaleDateString('ar-MA'),
    is_archived: false,
    created_at: new Date().toISOString(),
  };
  mockBatches.push(newBatch);
  return newBatch;
}

export async function archiveActiveBatch(newBatchName: string): Promise<PurchaseBatch> {
  const active = await getActiveBatch();
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    await supabase
      .from('purchase_batches')
      .update({ is_archived: true, archived_at: now })
      .eq('id', active.id);

    const { data } = await supabase
      .from('purchase_batches')
      .insert({ batch_name: newBatchName, is_archived: false })
      .select()
      .single();
    if (data) return data;
  }

  // Mock implementation
  const target = mockBatches.find(b => b.id === active.id);
  if (target) {
    target.is_archived = true;
    target.archived_at = now;
  }

  const createdNew: PurchaseBatch = {
    id: 'batch-' + Date.now(),
    batch_name: newBatchName,
    is_archived: false,
    created_at: now,
  };
  mockBatches.push(createdNew);
  return createdNew;
}

// --- CLIENT DEMANDS ---
export async function getClientDemands(batchId?: string): Promise<ClientDemand[]> {
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

    const { data, error } = await query;
    if (!error && data) return data as ClientDemand[];
  }

  let result = [...mockDemands];
  if (batchId) {
    result = result.filter(d => d.batch_id === batchId);
  }
  return result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export async function createClientDemand(
  clientName: string,
  clientPhone: string,
  items: { product_name: string; quantity: number }[]
): Promise<ClientDemand> {
  const activeBatch = await getActiveBatch();
  const cleanPhone = clientPhone.trim();
  const cleanName = clientName.trim();

  // 1. Auto insert into master products
  for (const item of items) {
    await addMasterProduct(item.product_name);
  }

  if (isSupabaseConfigured) {
    // Find or create client
    let { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (!existingClient) {
      const { data: newCli } = await supabase
        .from('clients')
        .insert({ name: cleanName, phone: cleanPhone })
        .select()
        .single();
      existingClient = newCli;
    }

    if (existingClient) {
      const { data: demand } = await supabase
        .from('client_demands')
        .insert({ client_id: existingClient.id, batch_id: activeBatch.id, status: 'pending' })
        .select()
        .single();

      if (demand) {
        const demandItems = items.map(it => ({
          demand_id: demand.id,
          product_name: it.product_name,
          quantity: it.quantity,
          is_in_stock: false,
          is_delivered: false,
        }));

        await supabase.from('demand_items').insert(demandItems);

        // Fetch full record
        const { data: fullDemand } = await supabase
          .from('client_demands')
          .select(`*, client:clients(*), items:demand_items(*)`)
          .eq('id', demand.id)
          .single();

        if (fullDemand) return fullDemand as ClientDemand;
      }
    }
  }

  // Mock implementation
  let client = mockClients.find(c => c.phone === cleanPhone);
  if (!client) {
    client = { id: 'cli-' + Date.now(), name: cleanName, phone: cleanPhone, created_at: new Date().toISOString() };
    mockClients.push(client);
  }

  const demandId = 'dem-' + Date.now();
  const demandItems: DemandItem[] = items.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    demand_id: demandId,
    product_name: it.product_name,
    quantity: it.quantity,
    is_in_stock: false,
    is_delivered: false,
    created_at: new Date().toISOString(),
  }));

  const newDemand: ClientDemand = {
    id: demandId,
    client_id: client.id,
    batch_id: activeBatch.id,
    status: 'pending',
    created_at: new Date().toISOString(),
    client,
    items: demandItems,
    batch: activeBatch,
  };

  mockDemands.unshift(newDemand);
  return newDemand;
}

export async function updateDemandItemState(
  itemId: string,
  updates: { is_in_stock?: boolean; is_delivered?: boolean }
): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.from('demand_items').update(updates).eq('id', itemId);
    return;
  }

  for (const demand of mockDemands) {
    if (demand.items) {
      const item = demand.items.find(i => i.id === itemId);
      if (item) {
        if (updates.is_in_stock !== undefined) item.is_in_stock = updates.is_in_stock;
        if (updates.is_delivered !== undefined) {
          item.is_delivered = updates.is_delivered;
          if (updates.is_delivered) item.is_in_stock = true; // Auto in-stock if delivered
        }
        recalculateDemandStatus(demand);
        break;
      }
    }
  }
}

export async function deleteClientDemand(demandId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.from('client_demands').delete().eq('id', demandId);
    return;
  }
  mockDemands = mockDemands.filter(d => d.id !== demandId);
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
): Promise<ClientDemand> {
  const cleanPhone = clientPhone.trim();
  const cleanName = clientName.trim();

  // Auto-upsert into master products
  for (const item of items) {
    if (item.product_name?.trim()) {
      await addMasterProduct(item.product_name);
    }
  }

  if (isSupabaseConfigured) {
    const { data: currentDemand } = await supabase
      .from('client_demands')
      .select('*, items:demand_items(*)')
      .eq('id', demandId)
      .single();

    if (currentDemand) {
      await supabase
        .from('clients')
        .update({ name: cleanName, phone: cleanPhone })
        .eq('id', currentDemand.client_id);

      const keepItemIds = items.map(i => i.id).filter(Boolean) as string[];
      if (keepItemIds.length > 0) {
        await supabase
          .from('demand_items')
          .delete()
          .eq('demand_id', demandId)
          .not('id', 'in', `(${keepItemIds.join(',')})`);
      } else {
        await supabase.from('demand_items').delete().eq('demand_id', demandId);
      }

      for (const item of items) {
        if (item.id) {
          await supabase
            .from('demand_items')
            .update({
              product_name: item.product_name.trim(),
              quantity: item.quantity,
              is_in_stock: item.is_in_stock ?? false,
              is_delivered: item.is_delivered ?? false,
            })
            .eq('id', item.id);
        } else {
          await supabase.from('demand_items').insert({
            demand_id: demandId,
            product_name: item.product_name.trim(),
            quantity: item.quantity,
            is_in_stock: item.is_in_stock ?? false,
            is_delivered: item.is_delivered ?? false,
          });
        }
      }

      const { data: updatedItems } = await supabase
        .from('demand_items')
        .select('*')
        .eq('demand_id', demandId);

      let newStatus: 'pending' | 'partial' | 'completed' = 'pending';
      if (updatedItems && updatedItems.length > 0) {
        const delivered = updatedItems.filter(i => i.is_delivered).length;
        if (delivered === updatedItems.length) newStatus = 'completed';
        else if (delivered > 0) newStatus = 'partial';
      }

      await supabase
        .from('client_demands')
        .update({ status: newStatus })
        .eq('id', demandId);

      const { data: fullDemand } = await supabase
        .from('client_demands')
        .select(`*, client:clients(*), items:demand_items(*)`)
        .eq('id', demandId)
        .single();

      if (fullDemand) return fullDemand as ClientDemand;
    }
  }

  // Mock implementation
  const demand = mockDemands.find(d => d.id === demandId);
  if (!demand) throw new Error('الطلب غير موجود');

  if (demand.client) {
    demand.client.name = cleanName;
    demand.client.phone = cleanPhone;
  }

  const updatedMockItems: DemandItem[] = items.map((it, idx) => {
    if (it.id) {
      const existingItem = demand.items?.find(i => i.id === it.id);
      return {
        id: it.id,
        demand_id: demandId,
        product_name: it.product_name.trim(),
        quantity: it.quantity,
        is_in_stock: it.is_in_stock ?? existingItem?.is_in_stock ?? false,
        is_delivered: it.is_delivered ?? existingItem?.is_delivered ?? false,
        created_at: existingItem?.created_at || new Date().toISOString(),
      };
    } else {
      return {
        id: `item-${Date.now()}-${idx}`,
        demand_id: demandId,
        product_name: it.product_name.trim(),
        quantity: it.quantity,
        is_in_stock: it.is_in_stock ?? false,
        is_delivered: it.is_delivered ?? false,
        created_at: new Date().toISOString(),
      };
    }
  });

  demand.items = updatedMockItems;
  recalculateDemandStatus(demand);
  return demand;
}

function recalculateDemandStatus(demand: ClientDemand) {
  if (!demand.items || demand.items.length === 0) {
    demand.status = 'pending';
    return;
  }
  const delivered = demand.items.filter(i => i.is_delivered).length;
  if (delivered === demand.items.length) {
    demand.status = 'completed';
  } else if (delivered > 0) {
    demand.status = 'partial';
  } else {
    demand.status = 'pending';
  }
}

export async function getSupplierAggregatedReport(batchId?: string): Promise<SupplierAggregatedItem[]> {
  const demands = await getClientDemands(batchId);
  const map: Record<string, SupplierAggregatedItem> = {};

  for (const dem of demands) {
    if (!dem.items || !dem.client) continue;
    for (const item of dem.items) {
      // Exclude already delivered items
      if (item.is_delivered) continue;

      if (!map[item.product_name]) {
        map[item.product_name] = {
          productName: item.product_name,
          totalQuantity: 0,
          clients: [],
        };
      }

      map[item.product_name].totalQuantity += item.quantity;
      map[item.product_name].clients.push({
        clientName: dem.client.name,
        phone: dem.client.phone,
        quantity: item.quantity,
        demandId: dem.id,
      });
    }
  }

  return Object.values(map).sort((a, b) => b.totalQuantity - a.totalQuantity);
}
