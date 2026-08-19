'use client';

import React, { useState, useMemo } from 'react';
import { 
  PackageCheck, 
  CheckCircle2, 
  Search, 
  Layers, 
  Package
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';
import { updateMasterProductStock } from '@/lib/dataStore';

interface StockAllocationProps {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  onUpdateItemState: (
    itemId: string, 
    updates: { is_in_stock?: boolean; is_delivered?: boolean }
  ) => Promise<void>;
  onAutoAllocateStock?: (
    productName: string, 
    receivedQty: number
  ) => Promise<{ clientName: string; phone: string; fulfilledQty: number; link: string }[]>;
}

export default function StockAllocation({
  demands,
  masterProducts,
  onUpdateItemState,
  onAutoAllocateStock,
}: StockAllocationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [processingProduct, setProcessingProduct] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 1. Calculate Active Missing Products Aggregation
  const missingProductsList = useMemo(() => {
    const map: Record<string, {
      productName: string;
      category: string;
      totalMissingQty: number;
      availableStock: number;
      clients: { clientName: string; phone: string; quantity: number; demandCreatedAt: string }[];
    }> = {};

    for (const dem of demands) {
      if (!dem.items || !dem.client) continue;
      for (const item of dem.items) {
        if (!item.is_in_stock && !item.is_delivered) {
          const pName = item.product_name.trim();
          if (!map[pName]) {
            const masterProd = masterProducts.find(
              mp => mp.name.trim().toLowerCase() === pName.toLowerCase()
            );
            map[pName] = {
              productName: pName,
              category: masterProd?.category || 'كتاب مدرسي',
              totalMissingQty: 0,
              availableStock: masterProd?.available_stock || 0,
              clients: [],
            };
          }
          map[pName].totalMissingQty += item.quantity;
          map[pName].clients.push({
            clientName: dem.client.name,
            phone: dem.client.phone,
            quantity: item.quantity,
            demandCreatedAt: dem.created_at || new Date().toISOString(),
          });
        }
      }
    }

    const list = Object.values(map).map(item => ({
      ...item,
      clients: item.clients.sort((a, b) => new Date(a.demandCreatedAt).getTime() - new Date(b.demandCreatedAt).getTime())
    }));

    return list.sort((a, b) => b.totalMissingQty - a.totalMissingQty);
  }, [demands, masterProducts]);

  // Filter missing products by search query
  const filteredMissingProducts = useMemo(() => {
    if (!searchQuery.trim()) return missingProductsList;
    const q = searchQuery.trim().toLowerCase();
    return missingProductsList.filter(
      p => p.productName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [missingProductsList, searchQuery]);

  // Total summary metrics
  const totalMissingItemsCount = missingProductsList.length;
  const totalMissingPiecesCount = missingProductsList.reduce((acc, p) => acc + p.totalMissingQty, 0);

  // Handle Auto-Allocation for a specific row
  const handleConfirmReady = async (productName: string, defaultMissingQty: number) => {
    const qtyToAllocate = receivedQtyMap[productName] !== undefined 
      ? receivedQtyMap[productName] 
      : defaultMissingQty;

    if (qtyToAllocate <= 0) {
      alert('يرجى إدخال كمية مستلمة صحيحة أكبر من الصفر');
      return;
    }

    setProcessingProduct(productName);

    try {
      if (onAutoAllocateStock) {
        await onAutoAllocateStock(productName, qtyToAllocate);
      } else {
        // Fallback manually if onAutoAllocateStock is not provided
        let remaining = qtyToAllocate;
        const targetProd = missingProductsList.find(p => p.productName === productName);

        if (targetProd) {
          for (const cli of targetProd.clients) {
            if (remaining <= 0) break;
            for (const dem of demands) {
              if (remaining <= 0) break;
              if (dem.client?.phone === cli.phone && dem.items) {
                for (const it of dem.items) {
                  if (it.product_name.trim().toLowerCase() === productName.toLowerCase() && !it.is_in_stock && !it.is_delivered) {
                    const needed = it.quantity;
                    if (remaining >= needed) {
                      await onUpdateItemState(it.id, { is_in_stock: true });
                      remaining -= needed;
                    }
                  }
                }
              }
            }
          }
          if (remaining > 0) {
            await updateMasterProductStock(productName, remaining);
          }
        }
      }

      setReceivedQtyMap(prev => {
        const next = { ...prev };
        delete next[productName];
        return next;
      });

      // Show lightweight 2.5s Toast notification
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2500);

    } catch (err) {
      console.error('Error allocating stock:', err);
      alert('حدث خطأ أثناء تخصيص السلعة، يرجى إعادة المحاولة.');
    } finally {
      setProcessingProduct(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">استقبال وتوزيع السلع المستلمة (Stock Allocation)</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                قائمة حية ومباشرة بالكتب والسلع الناقصة لتأكيد استلام الموردين والتوزيع التلقائي
              </p>
            </div>
          </div>
        </div>

        {/* Live Metrics Summary Bar */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">العناوين المعلقة الناقصة</span>
              <span className="text-lg font-black text-slate-900">{totalMissingItemsCount} عنوان</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-900 font-bold flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي القطع المطلوبة</span>
              <span className="text-lg font-black text-sky-900">{totalMissingPiecesCount} قطعة</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEW: Active Missing Products List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        
        {/* Search Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base">قائمة السلع والكتب الناقصة المطلوب استلامها</h3>
            <p className="text-xs text-slate-500">أدخل الكمية المستلمة واضغط "جاهز" لتوزيعها فوراً على الطلبات المعلقة</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو السلسلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors min-h-[40px]"
            />
          </div>
        </div>

        {/* Missing Products List / Table */}
        {filteredMissingProducts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-base">ممتاز! لا توجد كتب أو مستلزمات ناقصة حالياً</h4>
              <p className="text-xs text-slate-500 mt-1">جميع طلبات الزبناء في هذه الدفعة إما متوفرة بالكامل أو تم تسليمها.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMissingProducts.map((item) => {
              const isProcessing = processingProduct === item.productName;
              const currentInputVal = receivedQtyMap[item.productName] !== undefined 
                ? receivedQtyMap[item.productName] 
                : item.totalMissingQty;

              return (
                <div 
                  key={item.productName}
                  className="border border-slate-200 bg-white hover:border-slate-300 rounded-2xl transition-all duration-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left: Product Meta & Badge */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      {item.availableStock > 0 && (
                        <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-black px-2 py-0.5 rounded-md">
                          متوفر بالرفوف: {item.availableStock}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-base sm:text-lg leading-snug">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                      <span>الكمية المطلوبة للزبناء: <strong className="text-slate-900 font-extrabold">{item.totalMissingQty} قطعة</strong></span>
                      <span>•</span>
                      <span>ينتظره <strong className="text-slate-900 font-extrabold">{item.clients.length} زبناء</strong></span>
                    </p>
                  </div>

                  {/* Right: Interactive Inline Controls (Input + Ready Button) */}
                  <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 justify-between md:justify-end">
                    
                    {/* Inline Received Qty Input */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="text-xs font-bold text-slate-700 shrink-0 hidden sm:inline">الكمية المستلمة:</label>
                      <input
                        type="number"
                        min="1"
                        value={currentInputVal}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 0);
                          setReceivedQtyMap({
                            ...receivedQtyMap,
                            [item.productName]: val,
                          });
                        }}
                        className="w-20 bg-slate-50 border border-slate-300 focus:bg-white rounded-xl py-2 px-2 text-center text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
                        title="الكمية المستلمة من المورد"
                      />
                    </div>

                    {/* Inline Ready Action Button */}
                    <button
                      onClick={() => handleConfirmReady(item.productName, item.totalMissingQty)}
                      disabled={isProcessing}
                      className="flex-1 md:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                      <span>{isProcessing ? 'جاري التوزيع...' : 'جاهز / تأكيد واستلام'}</span>
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 3. Sleek Floating Toast Notification (Top-Center 2.5s Auto-dismiss) */}
      {showToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white backdrop-blur shadow-2xl border border-slate-700/80 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-extrabold text-xs sm:text-sm tracking-wide">
            تمت إضافة وتوزيع السلعة بنجاح
          </span>
        </div>
      )}

    </div>
  );
}
