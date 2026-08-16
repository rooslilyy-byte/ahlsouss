-- ====================================================================
-- SEED DATA: مكتبة وراقة اهل سوس - بيانات تجريبية واقعية
-- ====================================================================

-- 1. Ensure Active Batch Exists
INSERT INTO public.purchase_batches (id, batch_name, is_archived)
VALUES ('00000000-0000-0000-0000-000000000001', 'دفعة الدخول المدرسي الرئيسي 2026', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Master Products
INSERT INTO public.master_products (name, category, available_stock)
VALUES 
    ('الجديد في الرياضيات - 6 ابتدائي', 'كتب الابتدائية', 5),
    ('المفيد في اللغة العربية - 5 ابتدائي', 'كتب الابتدائية', 4),
    ('Mon livre de français - 4ème AEP', 'كتب الابتدائية', 3),
    ('في رحاب التربية الإسلامية - 3 إعدادي', 'كتب الإعدادية', 0),
    ('النجاح في علوم الحياة والأرض - 2 بكالوريا', 'كتب التأهيلية', 2),
    ('دفتر مقلم 100 ورقة (24x32)', 'أدوات ومستلزمات', 12),
    ('دفتر كبير 200 ورقة (A4)', 'أدوات ومستلزمات', 0),
    ('علبة أقلام ملونة Maped (24 قلم)', 'أدوات ومستلزمات', 5),
    ('محفظة مدرسية مقاومة للماء', 'أدوات ومستلزمات', 0)
ON CONFLICT (name) DO UPDATE 
SET available_stock = EXCLUDED.available_stock,
    category = EXCLUDED.category;

-- 3. Clients
INSERT INTO public.clients (id, name, phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'الحسن أيت الطالب', '0661234567'),
    ('22222222-2222-2222-2222-222222222222', 'فاطمة الزهراء السوسي', '0678901234'),
    ('33333333-3333-3333-3333-333333333333', 'يوسف الإدريسي', '0612987654')
ON CONFLICT (id) DO NOTHING;

-- 4. Demands & Demand Items
-- Demand 1: Partial readiness (الحسن أيت الطالب)
INSERT INTO public.client_demands (id, client_id, batch_id, status)
VALUES ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'partial')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demand_items (id, demand_id, product_name, quantity, is_in_stock, is_delivered)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'الجديد في الرياضيات - 6 ابتدائي', 1, true, true),
    ('b1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'Mon livre de français - 4ème AEP', 1, true, false),
    ('b1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'دفتر مقلم 100 ورقة (24x32)', 4, false, false)
ON CONFLICT (id) DO NOTHING;

-- Demand 2: Pending state (فاطمة الزهراء السوسي)
INSERT INTO public.client_demands (id, client_id, batch_id, status)
VALUES ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demand_items (id, demand_id, product_name, quantity, is_in_stock, is_delivered)
VALUES 
    ('b2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'المفيد في اللغة العربية - 5 ابتدائي', 1, false, false),
    ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'دفتر كبير 200 ورقة (A4)', 2, false, false)
ON CONFLICT (id) DO NOTHING;

-- Demand 3: Completed demand (يوسف الإدريسي)
INSERT INTO public.client_demands (id, client_id, batch_id, status)
VALUES ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demand_items (id, demand_id, product_name, quantity, is_in_stock, is_delivered)
VALUES 
    ('b3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'في رحاب التربية الإسلامية - 3 إعدادي', 1, true, true),
    ('b3333333-3333-3333-3333-333333333332', 'a3333333-3333-3333-3333-333333333333', 'علبة أقلام ملونة Maped (24 قلم)', 1, true, true)
ON CONFLICT (id) DO NOTHING;
