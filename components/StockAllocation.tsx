'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PackageCheck, 
  CheckCircle2, 
  Search, 
  Layers, 
  Package,
  X
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
  const [processingProduct, setProcessingProduct] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Modal State
  const [modalProduct, setModalProduct] = useState<{ productName: string; totalMissingQty: number } | null>(null);
  const [modalQty, setModalQty] = useState<string>('');
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (modalProduct) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [modalProduct]);

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

  // Handle Modal Open
  const handleOpenModal = (productName: string, totalMissingQty: number) => {
    setModalProduct({ productName, totalMissingQty });
    setModalQty('');
  };

  // Handle Allocation Submit from Modal
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProduct) return;

    const parsedQty = parseInt(modalQty.trim(), 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert('يرجى إدخال كمية مستلمة صحيحة أكبر من الصفر');
      return;
    }

    const productName = modalProduct.productName;
    setProcessingProduct(productName);
    setIsProcessingModal(true);

    try {
      if (onAutoAllocateStock) {
        await onAutoAllocateStock(productName, parsedQty);
      } else {
        // Fallback manually if onAutoAllocateStock is not provided
        let remaining = parsedQty;
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
                    await onUpdateItemState(it.id, { is_in_stock: true });
                    remaining -= needed;
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

      setModalProduct(null);
      setModalQty('');

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
      setIsProcessingModal(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">توزيع واستقبال السلع</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">العناوين المعلقة:</span>
              <strong className="text-slate-900">{totalMissingItemsCount}</strong>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">القطع المطلوبة:</span>
              <strong className="text-slate-900">{totalMissingPiecesCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEW: Active Missing Products List Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3">
        
        {/* Search Filter Header */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700">قائمة الخصاصات المطلوب توفيرها</span>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 h-9 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-medium transition-colors"
            />
          </div>
        </div>

        {/* Missing Products List / Table */}
        {filteredMissingProducts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">جميع كتب هذه الدفعة متوفرة بالكامل</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredMissingProducts.map((item) => {
              const isProcessing = processingProduct === item.productName;
              const distinctClientsCount = new Set(item.clients.map(c => c.phone)).size;

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
                      <span>ينتظره <strong className="text-slate-900 font-extrabold">{distinctClientsCount} زبناء</strong></span>
                    </p>
                  </div>

                  {/* Right: Clean Action Button (Triggers Quantity Modal) */}
                  <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 justify-end">
                    <button
                      onClick={() => handleOpenModal(item.productName, item.totalMissingQty)}
                      disabled={isProcessing}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                      <span>{isProcessing ? 'جاري التوزيع...' : 'جاهز'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 3. Confirmation Input Modal */}
      {modalProduct && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalProduct(null);
              setModalQty('');
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 text-right relative animate-in zoom-in-95 duration-200" dir="rtl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight truncate">
                    تأكيد استلام السلعة: {modalProduct.productName}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    الكمية المطلوبة للزبناء: <span className="text-blue-700 font-black">{modalProduct.totalMissingQty} قطعة</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalProduct(null);
                  setModalQty('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  كم عدد القطع المستلمة؟
                </label>
                <input
                  ref={modalInputRef}
                  type="number"
                  min="1"
                  autoFocus
                  value={modalQty}
                  onChange={(e) => setModalQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="أدخل عدد القطع المستلمة..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl py-3 px-4 text-base font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all text-center placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isProcessingModal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>{isProcessingModal ? 'جاري التوزيع...' : 'تأكيد'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalProduct(null);
                    setModalQty('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 px-4 rounded-xl transition-colors min-h-[44px]"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 4. Sleek Floating Toast Notification */}
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
