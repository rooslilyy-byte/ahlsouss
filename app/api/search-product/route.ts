import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const rows = await query<any>(
      `SELECT 
        di.id AS item_id,
        di.product_name,
        di.quantity,
        di.is_in_stock,
        di.is_delivered,
        di.created_at AS item_created_at,
        cd.id AS demand_id,
        cd.status AS demand_status,
        cd.created_at AS demand_created_at,
        c.id AS client_id,
        c.name AS client_name,
        c.phone AS client_phone
       FROM public.demand_items di
       JOIN public.client_demands cd ON di.demand_id = cd.id
       JOIN public.clients c ON cd.client_id = c.id
       WHERE di.product_name ILIKE $1 OR c.name ILIKE $1 OR c.phone ILIKE $1
       ORDER BY cd.created_at DESC
       LIMIT 100;`,
      [`%${q}%`]
    );

    return NextResponse.json({ results: rows });
  } catch (error: any) {
    console.error('Error in search-product API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث عن المنتج', details: error.message },
      { status: 500 }
    );
  }
}
