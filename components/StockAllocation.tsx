'use client';

import React, { useState, useMemo } from 'react';
import { 
  PackageCheck, 
  CheckSquare, 
  Square, 
  MessageSquare, 
  Clock, 
  BellRing
} from 'lucide-react';
import { ClientDemand, MasterProduct, StockAllocationItem } from '@/lib/types';
import { updateMasterProductStock } from '@/lib/dataStore';

interface StockAllocationProps {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  onUpdateItemState: (
    itemId: string, 
    updates: { is_in_stock?: boolean; is_delivered?: boolean }
  ) => Promise<void>;
}

export default function StockAllocation({
  demands,
  masterProducts,
  onUpdateItemState,
}: StockAllocationProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [receivedQty, setReceivedQty] = useState<number>(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allocatedClientLinks, setAllocatedClientLinks] = useState<{ clientName: string; phone: string; link: string }[]>([]);

  const matchedMasterProd = useMemo(() => {
    if (!selectedProduct) return null;
    return masterProducts.find(p => p.name.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
  }, [selectedProduct, masterProducts]);

  const waitingItems = useMemo<StockAllocationItem[]>(() => {
    if (!selectedProduct) return [];
    
    const list: StockAllocationItem[] = [];
    
    for (const dem of demands) {
      if (!dem.items || !dem.client) continue;
      for (const item of dem.items) {
        if (
          item.product_name.toLowerCase() === selectedProduct.toLowerCase() &&
          !item.is_delivered
        ) {
          list.push({
            itemId: item.id,
            demandId: dem.id,
            clientName: dem.client.name,
            clientPhone: dem.client.phone,
            productName: item.product_name,
            requiredQty: item.quantity,
            demandCreatedAt: dem.created_at || new Date().toISOString(),
            isAlreadyInStock: item.is_in_stock,
            isDelivered: item.is_delivered,
          });
        }
      }
    }

    return list.sort((a, b) => new Date(a.demandCreatedAt).getTime() - new Date(b.demandCreatedAt).getTime());
  }, [demands, selectedProduct]);

  const totalRequired = useMemo(() => {
    return waitingItems.reduce((acc, curr) => acc + curr.requiredQty, 0);
  }, [waitingItems]);

  const currentSelectedQty = useMemo(() => {
    return waitingItems
      .filter(i => selectedItemIds.includes(i.itemId))
      .reduce((acc, curr) => acc + curr.requiredQty, 0);
  }, [waitingItems, selectedItemIds]);

  const handleToggleSelect = (item: StockAllocationItem) => {
    if (selectedItemIds.includes(item.itemId)) {
      setSelectedItemIds(selectedItemIds.filter(id => id !== item.itemId));
    } else {
      if (currentSelectedQty + item.requiredQty <= receivedQty) {
        setSelectedItemIds([...selectedItemIds, item.itemId]);
      } else {
        alert(`لا يمكنك تحديد هذا الطلب لأن الكمية ستتجاوز العدد المستلم (${receivedQty} قطعة)`);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === waitingItems.length) {
      setSelectedItemIds([]);
    } else {
      let count = 0;
      const ids: string[] = [];
      for (const item of waitingItems) {
        if (count + item.requiredQty <= receivedQty) {
          ids.push(item.itemId);
          count += item.requiredQty;
        } else {
          break;
        }
      }
      setSelectedItemIds(ids);
    }
  };

  const handleApplyAllocation = async () => {
    if (selectedItemIds.length === 0) return;
    setIsProcessing(true);

    try {
      const updatedClients: { clientName: string; phone: string; link: string }[] = [];

      for (const itemId of selectedItemIds) {
        const itemInfo = waitingItems.find(w => w.itemId === itemId);
        if (itemInfo) {
          await onUpdateItemState(itemId, { is_in_stock: true });

          let rawPhone = itemInfo.clientPhone.replace(/\D/g, '');
          if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);

          const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${itemInfo.clientName}،\n\nنخبركم من مكتبة وراقة اهل سوس أن كتاب / مستلزم: "${itemInfo.productName}" (عدد: ${itemInfo.requiredQty}) الذي طلبتموه قد وصل للمحل وهو جاهز للتسليم!\n\nالمكان: مكتبة وراقة اهل سوس\nالهاتف: 0675502660`;
          
          updatedClients.push({
            clientName: itemInfo.clientName,
            phone: itemInfo.clientPhone,
            link: `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`,
          });
        }
      }

      // Calculate leftover unallocated items and add to shop shelf inventory (available_stock)
      const leftoverQty = Math.max(0, receivedQty - currentSelectedQty);
      if (leftoverQty > 0 && selectedProduct.trim()) {
        await updateMasterProductStock(selectedProduct, leftoverQty);
      }

      setAllocatedClientLinks(updatedClients);
      setSelectedItemIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Product Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">استقبال وتوزيع السلع المستلمة (Stock Allocation)</h2>
            <p className="text-xs text-slate-500">تخصيص كميات السلع المستلمة للزبناء حسب الأسبقية الأقدم (FIFO)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اختر الكتاب أو السلعة المستلمة من المورد:
            </label>
            <input
              type="text"
              list="received-products-list"
              placeholder="ابحث أو اختر السلعة المستلمة..."
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setSelectedItemIds([]);
                setAllocatedClientLinks([]);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-bold min-h-[44px]"
            />
            <datalist id="received-products-list">
              {masterProducts.map(p => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الكمية المستلمة (عدد القطع):
            </label>
            <input
              type="number"
              min="1"
              value={receivedQty}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                setReceivedQty(Math.max(1, parseInt(e.target.value) || 1));
                setSelectedItemIds([]);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 text-center min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* FIFO Queue Table */}
      {selectedProduct && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <span className="text-xs text-slate-500 block">السلعة المختارة:</span>
              <h3 className="font-extrabold text-slate-900 text-base">{selectedProduct}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-slate-600">
                  مطلوبة لـ <span className="font-bold text-slate-900">{waitingItems.length}</span> زبناء • إجمالي المعلق: <span className="font-bold text-slate-900">{totalRequired}</span> قطعة
                </p>
                {matchedMasterProd && (
                  <span className="bg-sky-50 text-sky-800 border border-sky-200 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                    الكمية المتوفرة بالرفوف: {matchedMasterProd.available_stock || 0} قطعة
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">القطع المحددة للتوزيع</span>
                <span className={`text-base font-black ${currentSelectedQty <= receivedQty ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {currentSelectedQty} / {receivedQty}
                </span>
              </div>

              <button
                onClick={handleSelectAll}
                disabled={waitingItems.length === 0}
                className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                <span>{selectedItemIds.length === waitingItems.length ? 'إلغاء التحديد' : 'تحديد الممكن'}</span>
              </button>
            </div>
          </div>

          {waitingItems.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-600">لا يوجد زبناء ينتظرون هذه السلعة حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {waitingItems.map((item, idx) => {
                  const isChecked = selectedItemIds.includes(item.itemId);

                  return (
                    <div 
                      key={item.itemId}
                      onClick={() => handleToggleSelect(item)}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors min-h-[50px] ${
                        isChecked ? 'bg-slate-100 border-r-4 border-r-slate-800' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-sm">{item.clientName}</h4>
                            {idx === 0 && (
                              <span className="bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">الأسبقية الأقدم</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono dir-ltr text-right">
                            {item.clientPhone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-500 block">المطلوب</span>
                          <span className="font-black text-sm text-slate-900">{item.requiredQty} قطعة</span>
                        </div>

                        <div className="text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                          {isChecked ? (
                            <CheckSquare className="w-6 h-6 text-slate-900" />
                          ) : (
                            <Square className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleApplyAllocation}
              disabled={selectedItemIds.length === 0 || isProcessing}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
            >
              <BellRing className="w-4 h-4" />
              <span>{isProcessing ? 'جاري التوزيع...' : `تأكيد التخصيص وتخريج (${currentSelectedQty}) قطعة`}</span>
            </button>
          </div>

        </div>
      )}

      {/* Generated WhatsApp Links */}
      {allocatedClientLinks.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <MessageSquare className="w-5 h-5 text-emerald-700 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold">تم التخصيص بنجاح! روابط إشعار الواتساب للزبناء:</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allocatedClientLinks.map((cli, idx) => (
              <div key={idx} className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{cli.clientName}</h4>
                  <p className="text-xs text-slate-500 font-mono dir-ltr text-right">{cli.phone}</p>
                </div>
                <a
                  href={cli.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0 min-h-[44px]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>إشعار واتساب</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
