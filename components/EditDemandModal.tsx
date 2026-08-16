'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  User, 
  Phone, 
  Plus, 
  Trash2, 
  Minus, 
  Save, 
  CheckSquare, 
  Square,
  CheckCircle2,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';

interface EditDemandModalProps {
  demand: ClientDemand;
  masterProducts: MasterProduct[];
  onClose: () => void;
  onSave: (
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
  ) => Promise<void>;
}

export default function EditDemandModal({
  demand,
  masterProducts,
  onClose,
  onSave,
}: EditDemandModalProps) {
  const [clientName, setClientName] = useState(demand.client?.name || '');
  const [clientPhone, setClientPhone] = useState(demand.client?.phone || '');
  const [items, setItems] = useState<
    {
      id?: string;
      product_name: string;
      quantity: number;
      is_in_stock: boolean;
      is_delivered: boolean;
    }[]
  >([]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [suppressedWarnings, setSuppressedWarnings] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (demand.items) {
      setItems(
        demand.items.map(it => ({
          id: it.id,
          product_name: it.product_name,
          quantity: it.quantity,
          is_in_stock: it.is_in_stock,
          is_delivered: it.is_delivered,
        }))
      );
    }
  }, [demand]);

  const handleItemChange = (
    index: number,
    field: 'product_name' | 'quantity' | 'is_in_stock' | 'is_delivered',
    value: any
  ) => {
    const newItems = [...items];
    const updated = { ...newItems[index], [field]: value };

    // Auto logic: if delivered, set in_stock = true
    if (field === 'is_delivered' && value === true) {
      updated.is_in_stock = true;
    }
    // If not in stock, cannot be delivered
    if (field === 'is_in_stock' && value === false) {
      updated.is_delivered = false;
    }

    newItems[index] = updated;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_name: '',
        quantity: 1,
        is_in_stock: false,
        is_delivered: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('يجب أن تحتوي الطلبية على عنصر واحد على الأقل');
      return;
    }
    setErrorMessage('');
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validItems = items.filter(i => i.product_name.trim().length > 0);

    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMessage('يرجى ملء اسم الزبون ورقم الهاتف');
      return;
    }

    if (validItems.length === 0) {
      setErrorMessage('يرجى إضافة كتاب أو مستلزم واحد على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        demand.id,
        clientName.trim(),
        clientPhone.trim(),
        validItems
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving demand:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">تعديل طلب الزبون</h3>
              <p className="text-xs text-slate-400">تحديث المعلومات الشخصية والكتب والخصاصات المطلوبة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Client Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              <span>معلومات الزبون</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الزبون الكامل:</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-medium min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-mono dir-ltr text-right min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                قائمة الكتب والمستلزمات المطلوبة:
              </label>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                عدد العناصر: {items.length}
              </span>
            </div>

            {items.map((item, idx) => {
              const matchedProd = masterProducts.find(
                mp => mp.name.trim().toLowerCase() === item.product_name.trim().toLowerCase()
              );
              const hasAvailableStock = matchedProd && matchedProd.available_stock && matchedProd.available_stock > 0;
              const showWarning = hasAvailableStock && !suppressedWarnings[idx] && !item.is_in_stock && !item.is_delivered;

              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    
                    {/* Product Name Autocomplete */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        required
                        list={`edit-master-suggestions-${idx}`}
                        placeholder="اسم الكتاب أو المستلزم..."
                        value={item.product_name}
                        onChange={(e) => {
                          handleItemChange(idx, 'product_name', e.target.value);
                          setSuppressedWarnings(prev => ({ ...prev, [idx]: false }));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-medium min-h-[44px]"
                      />
                      <datalist id={`edit-master-suggestions-${idx}`}>
                        {masterProducts.map(mp => (
                          <option key={mp.id} value={mp.name}>
                            {mp.available_stock ? `${mp.name} [متوفر بالمحل: ${mp.available_stock} قطعة]` : mp.name}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      {/* Quantity Stepper */}
                      <div className="w-32 flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shrink-0 min-h-[44px]">
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'quantity', Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40 transition-opacity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-center text-sm font-black text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'quantity', Math.max(1, item.quantity + 1))}
                          className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border border-rose-200 sm:border-0 bg-white sm:bg-transparent"
                        title="حذف هذا الكتاب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {showWarning && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs font-bold space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>تنبيه: هذا الكتاب متوفر حالياً بالمحل (الكمية المتوفرة بالرفوف: {matchedProd.available_stock} قطعة)</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleItemChange(idx, 'product_name', '');
                          }}
                          className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
                        >
                          تجاوز السلعة (أخذها مباشرة من الرف)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSuppressedWarnings(prev => ({ ...prev, [idx]: true }));
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
                        >
                          إصرار على الإضافة للخصاص
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State Toggles (In Stock / Delivered) */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 min-h-[40px] px-1">
                      <input
                        type="checkbox"
                        checked={item.is_in_stock}
                        onChange={(e) => handleItemChange(idx, 'is_in_stock', e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-5 h-5"
                      />
                      <span>متوفر بالمتجر</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 min-h-[40px] px-1">
                      <input
                        type="checkbox"
                        checked={item.is_delivered}
                        onChange={(e) => handleItemChange(idx, 'is_delivered', e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                      />
                      <span>تم التسليم للزبون</span>
                    </label>
                  </div>

                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-dashed border-slate-300 transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كتاب أو مستلزم جديد للطلب</span>
            </button>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-3 flex items-center justify-end gap-3 z-10 -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 sm:p-6 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
