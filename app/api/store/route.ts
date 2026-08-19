import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ClientDemand, MasterProduct, PurchaseBatch } from '@/lib/types';

export async function GET() {
  try {
    // 1. Get or create active purchase batch
    let batchRows = await query<PurchaseBatch>(
      `SELECT * FROM public.purchase_batches WHERE is_archived = false ORDER BY created_at DESC LIMIT 1;`
    );

    if (batchRows.length === 0) {
      batchRows = await query<PurchaseBatch>(
        `INSERT INTO public.purchase_batches (batch_name, is_archived) 
         VALUES ('دفعة الدخول المدرسي الرئيسي', false) 
         RETURNING *;`
      );
    }
    const activeBatch = batchRows[0];

    // 2. Fetch master products
    const masterProducts = await query<MasterProduct>(
      `SELECT * FROM public.master_products ORDER BY name ASC;`
    );

    // 3. Fetch client demands with client and items
    const demandsRows = await query<any>(
      `SELECT 
        d.id, d.client_id, d.batch_id, d.status, d.created_at,
        c.name AS client_name, c.phone AS client_phone, c.created_at AS client_created_at
       FROM public.client_demands d
       JOIN public.clients c ON d.client_id = c.id
       WHERE d.batch_id = $1
       ORDER BY d.created_at DESC;`,
      [activeBatch.id]
    );

    const demandIds = demandsRows.map(d => d.id);
    let itemsRows: any[] = [];
    if (demandIds.length > 0) {
      itemsRows = await query<any>(
        `SELECT * FROM public.demand_items WHERE demand_id = ANY($1) ORDER BY created_at ASC;`,
        [demandIds]
      );
    }

    const demands: ClientDemand[] = demandsRows.map(d => ({
      id: d.id,
      client_id: d.client_id,
      batch_id: d.batch_id,
      status: d.status,
      created_at: d.created_at,
      client: {
        id: d.client_id,
        name: d.client_name,
        phone: d.client_phone,
        created_at: d.client_created_at,
      },
      items: itemsRows.filter(i => i.demand_id === d.id),
    }));

    return NextResponse.json({
      success: true,
      activeBatch,
      masterProducts,
      demands,
    });
  } catch (error: any) {
    console.error('Error fetching database store data:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch database data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // --- CREATE DEMAND ---
    if (action === 'create_demand') {
      const { clientName, clientPhone, items } = body;
      const cleanPhone = clientPhone.trim();
      const cleanName = clientName.trim();

      // 1. Get active batch
      let batchRows = await query<PurchaseBatch>(
        `SELECT * FROM public.purchase_batches WHERE is_archived = false ORDER BY created_at DESC LIMIT 1;`
      );
      if (batchRows.length === 0) {
        batchRows = await query<PurchaseBatch>(
          `INSERT INTO public.purchase_batches (batch_name, is_archived) VALUES ('دفعة الدخول المدرسي الرئيسي', false) RETURNING *;`
        );
      }
      const batchId = batchRows[0].id;

      // 2. Find or insert client into public.clients
      let clientRows = await query(
        `SELECT * FROM public.clients WHERE phone = $1 LIMIT 1;`,
        [cleanPhone]
      );

      let clientId = '';
      if (clientRows.length > 0) {
        clientId = clientRows[0].id;
        if (clientRows[0].name !== cleanName) {
          await query(`UPDATE public.clients SET name = $1 WHERE id = $2;`, [cleanName, clientId]);
        }
      } else {
        const newClientRows = await query(
          `INSERT INTO public.clients (name, phone) VALUES ($1, $2) RETURNING *;`,
          [cleanName, cleanPhone]
        );
        clientId = newClientRows[0].id;
      }

      // 3. Create client demand in public.client_demands
      const demandRows = await query(
        `INSERT INTO public.client_demands (client_id, batch_id, status) VALUES ($1, $2, 'pending') RETURNING *;`,
        [clientId, batchId]
      );
      const demandId = demandRows[0].id;

      // 4. Insert demand items in public.demand_items & auto-upsert master products
      for (const it of items) {
        const prodName = it.product_name.trim();
        const qty = Math.max(1, Math.floor(it.quantity || 1));

        await query(
          `INSERT INTO public.master_products (name, category) VALUES ($1, 'كتاب مدرسي') ON CONFLICT (name) DO NOTHING;`,
          [prodName]
        );

        await query(
          `INSERT INTO public.demand_items (demand_id, product_name, quantity, is_in_stock, is_delivered)
           VALUES ($1, $2, $3, false, false);`,
          [demandId, prodName, qty]
        );
      }

      return NextResponse.json({ success: true, demandId });
    }

    // --- UPDATE DEMAND ---
    if (action === 'update_demand') {
      const { demandId, clientName, clientPhone, items } = body;
      const cleanPhone = clientPhone.trim();
      const cleanName = clientName.trim();

      const demandRows = await query(`SELECT * FROM public.client_demands WHERE id = $1;`, [demandId]);
      if (demandRows.length === 0) {
        return NextResponse.json({ success: false, message: 'Demand not found' }, { status: 404 });
      }

      const clientId = demandRows[0].client_id;
      await query(`UPDATE public.clients SET name = $1, phone = $2 WHERE id = $3;`, [cleanName, cleanPhone, clientId]);

      const keepIds = items.map((i: any) => i.id).filter(Boolean);
      if (keepIds.length > 0) {
        await query(
          `DELETE FROM public.demand_items WHERE demand_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]));`,
          [demandId, keepIds]
        );
      } else {
        await query(`DELETE FROM public.demand_items WHERE demand_id = $1;`, [demandId]);
      }

      for (const it of items) {
        const prodName = it.product_name.trim();
        const qty = Math.max(1, Math.floor(it.quantity || 1));
        const inStock = Boolean(it.is_in_stock);
        const delivered = Boolean(it.is_delivered);

        await query(
          `INSERT INTO public.master_products (name, category) VALUES ($1, 'كتاب مدرسي') ON CONFLICT (name) DO NOTHING;`,
          [prodName]
        );

        if (it.id) {
          await query(
            `UPDATE public.demand_items 
             SET product_name = $1, quantity = $2, is_in_stock = $3, is_delivered = $4 
             WHERE id = $5;`,
            [prodName, qty, inStock, delivered, it.id]
          );
        } else {
          await query(
            `INSERT INTO public.demand_items (demand_id, product_name, quantity, is_in_stock, is_delivered)
             VALUES ($1, $2, $3, $4, $5);`,
            [demandId, prodName, qty, inStock, delivered]
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    // --- UPDATE ITEM STATE (Stock Allocation / Delivery) ---
    if (action === 'update_item_state') {
      const { itemId, updates } = body;
      const { is_in_stock, is_delivered } = updates;

      if (is_in_stock !== undefined && is_delivered !== undefined) {
        await query(
          `UPDATE public.demand_items SET is_in_stock = $1, is_delivered = $2 WHERE id = $3;`,
          [Boolean(is_in_stock), Boolean(is_delivered), itemId]
        );
      } else if (is_in_stock !== undefined) {
        await query(
          `UPDATE public.demand_items SET is_in_stock = $1 WHERE id = $2;`,
          [Boolean(is_in_stock), itemId]
        );
      } else if (is_delivered !== undefined) {
        await query(
          `UPDATE public.demand_items SET is_delivered = $1, is_in_stock = CASE WHEN $1 = true THEN true ELSE is_in_stock END WHERE id = $2;`,
          [Boolean(is_delivered), itemId]
        );
      }

      return NextResponse.json({ success: true });
    }

    // --- AUTO ALLOCATE STOCK (FIFO Multi-Client) ---
    if (action === 'auto_allocate_stock') {
      const { productName, receivedQty } = body;
      const cleanName = productName.trim();
      let remainingQty = Math.max(1, parseInt(receivedQty) || 1);

      // Get active batch ID
      const batchRows = await query<PurchaseBatch>(
        `SELECT id FROM public.purchase_batches WHERE is_archived = false ORDER BY created_at DESC LIMIT 1;`
      );
      const batchId = batchRows[0]?.id;

      // Select matching pending demand_items in active batch ordered by client_demands.created_at ASC
      const pendingItems = await query<any>(
        `SELECT 
          di.id AS item_id,
          di.demand_id,
          di.product_name,
          di.quantity,
          di.is_in_stock,
          di.is_delivered,
          cd.created_at AS demand_created_at,
          c.name AS client_name,
          c.phone AS client_phone
         FROM public.demand_items di
         JOIN public.client_demands cd ON di.demand_id = cd.id
         JOIN public.clients c ON cd.client_id = c.id
         WHERE LOWER(TRIM(di.product_name)) = LOWER($1)
           AND di.is_in_stock = false
           AND di.is_delivered = false
           ${batchId ? `AND cd.batch_id = '${batchId}'` : ''}
         ORDER BY cd.created_at ASC;`,
        [cleanName]
      );

      const allocatedClientsMap: Record<string, { clientName: string; phone: string; totalFulfilled: number }> = {};

      for (const item of pendingItems) {
        if (remainingQty <= 0) break;

        const needed = item.quantity;
        if (remainingQty >= needed) {
          await query(
            `UPDATE public.demand_items SET is_in_stock = true WHERE id = $1;`,
            [item.item_id]
          );
          remainingQty -= needed;

          const key = item.client_phone;
          if (!allocatedClientsMap[key]) {
            allocatedClientsMap[key] = {
              clientName: item.client_name,
              phone: item.client_phone,
              totalFulfilled: 0,
            };
          }
          allocatedClientsMap[key].totalFulfilled += needed;
        } else {
          const fulfilledPortion = remainingQty;
          const remainingMissingPortion = needed - fulfilledPortion;

          await query(
            `UPDATE public.demand_items SET quantity = $1, is_in_stock = false WHERE id = $2;`,
            [remainingMissingPortion, item.item_id]
          );

          await query(
            `INSERT INTO public.demand_items (demand_id, product_name, quantity, is_in_stock, is_delivered)
             VALUES ($1, $2, $3, true, false);`,
            [item.demand_id, item.product_name, fulfilledPortion]
          );

          remainingQty = 0;

          const key = item.client_phone;
          if (!allocatedClientsMap[key]) {
            allocatedClientsMap[key] = {
              clientName: item.client_name,
              phone: item.client_phone,
              totalFulfilled: 0,
            };
          }
          allocatedClientsMap[key].totalFulfilled += fulfilledPortion;
        }
      }

      if (remainingQty > 0) {
        await query(
          `INSERT INTO public.master_products (name, category, available_stock)
           VALUES ($1, 'كتاب مدرسي', $2)
           ON CONFLICT (name) DO UPDATE 
           SET available_stock = GREATEST(0, COALESCE(master_products.available_stock, 0) + EXCLUDED.available_stock);`,
          [cleanName, remainingQty]
        );
      }

      const allocatedClients = Object.values(allocatedClientsMap).map(c => {
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

      return NextResponse.json({ success: true, allocatedClients, surplusQty: remainingQty });
    }

    // --- DELETE DEMAND ---
    if (action === 'delete_demand') {
      const { demandId } = body;
      await query(`DELETE FROM public.client_demands WHERE id = $1;`, [demandId]);
      return NextResponse.json({ success: true });
    }

    // --- UPDATE MASTER PRODUCT STOCK ---
    if (action === 'update_stock') {
      const { productName, deltaQty } = body;
      const cleanName = productName.trim();
      const delta = parseInt(deltaQty) || 0;

      await query(
        `UPDATE public.master_products 
         SET available_stock = GREATEST(0, COALESCE(available_stock, 0) + $1) 
         WHERE name = $2;`,
        [delta, cleanName]
      );
      return NextResponse.json({ success: true });
    }

    // --- ADD MASTER PRODUCT ---
    if (action === 'add_master_product') {
      const { name, category } = body;
      const cleanName = name.trim();
      const cat = category || 'كتاب مدرسي';

      const rows = await query(
        `INSERT INTO public.master_products (name, category, available_stock)
         VALUES ($1, $2, 0)
         ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
         RETURNING *;`,
        [cleanName, cat]
      );

      return NextResponse.json({ success: true, product: rows[0] });
    }

    // --- ARCHIVE BATCH ---
    if (action === 'archive_batch') {
      const { newBatchName } = body;
      
      const activeRows = await query(`SELECT id FROM public.purchase_batches WHERE is_archived = false;`);
      if (activeRows.length > 0) {
        await query(`UPDATE public.purchase_batches SET is_archived = true, archived_at = NOW() WHERE is_archived = false;`);
      }

      const created = await query(
        `INSERT INTO public.purchase_batches (batch_name, is_archived) VALUES ($1, false) RETURNING *;`,
        [newBatchName]
      );

      return NextResponse.json({ success: true, batch: created[0] });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing database store action:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Database action failed' },
      { status: 500 }
    );
  }
}
