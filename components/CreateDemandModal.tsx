'use client';

import React, { useState } from 'react';
import { User, Phone, Plus, Minus, Trash2, X, BookOpen, CheckCircle2 } from 'lucide-react';
import { MasterProduct } from '@/lib/types';
import ProductAutocomplete from './ProductAutocomplete';

interface CreateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProducts?: MasterProduct[];
  onCreateDemand: (
    clientName: string, 
    clientPhone: string, 
    items: { product_name: string; quantity: number }[]
  ) => Promise<void>;
}

export default function CreateDemandModal({
  isOpen,
  onClose,
  masterProducts = [],
  onCreateDemand,
}: CreateDemandModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<{ product_name: string; quantity: number }[]>([
    { product_name: '', quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: 'product_name' | 'quantity', value: any) => {
    if (field === 'product_name' && typeof value === 'string' && value.trim()) {
      const trimmedLower = value.trim().toLowerCase();
      const isDuplicate = items.some(
        (it, idx) => idx !== index && it.product_name.trim().toLowerCase() === trimmedLower
      );
      if (isDuplicate) {
        alert(`الكتاب "${value.trim()}" مختار بالفعل في سطر آخر. يرجى زيادة العدد (+/-) في السطر الحالي بدلاً من تكراره.`);
        return;
      }
    }
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_name: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    // Check for duplicate product names
    const nameCounts: Record<string, number> = {};
    for (const item of items) {
      const name = item.product_name.trim().toLowerCase();
      if (!name) continue;
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    }

    const duplicateNames = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
    if (duplicateNames.length > 0) {
      const rawDupName = items.find(i => i.product_name.trim().toLowerCase() === duplicateNames[0])?.product_name || duplicateNames[0];
      alert(`الكتاب "${rawDupName}" مكرر في عدة أسطر. يرجى تعديل العدد (+/-) في السطر الحالي بدلاً من إضافة سطر مكرر.`);
      return;
    }

    // Deduplicate items for the same client: merge quantities for identical product titles
    const itemMap: Record<string, number> = {};
    for (const item of items) {
      const name = item.product_name.trim();
      if (!name) continue;
      const qty = Math.max(1, Number(item.quantity) || 1);
      itemMap[name] = (itemMap[name] || 0) + qty;
    }

    const validItems = Object.entries(itemMap).map(([product_name, quantity]) => ({
      product_name,
      quantity,
    }));

    if (validItems.length === 0) {
      alert('يرجى إضافة كتاب أو مستلزم واحداً على الأقل للطلب.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDemand(clientName.trim(), clientPhone.trim(), validItems);

      // Show floating Toast
      setToastMessage('تمت إضافة الزبون والطلب بنجاح');
      setTimeout(() => {
        setToastMessage(null);
        // Reset form and close
        setClientName('');
        setClientPhone('');
        setItems([{ product_name: '', quantity: 1 }]);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error creating demand:', err);
      alert('حدث خطأ أثناء حفظ الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 text-right relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">إضافة زبون وطلب جديد</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Client Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم الزبون</span>
              </label>
              <input
                type="text"
                required
                placeholder="اسم الزبون..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-900 font-medium text-xs sm:text-sm px-3 h-9 rounded-lg outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>رقم الهاتف</span>
              </label>
              <input
                type="tel"
                required
                placeholder="0661234567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-900 font-medium text-xs sm:text-sm px-3 h-9 rounded-lg outline-none transition-colors font-mono dir-ltr text-right"
              />
            </div>
          </div>

          {/* Missing Items List Sub-section */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              قائمة الخصاص
            </label>

            {items.map((item, idx) => {
              const selectedOtherNames = items
                .filter((_, i) => i !== idx)
                .map(it => it.product_name.trim().toLowerCase())
                .filter(Boolean);

              const availableProducts = masterProducts.filter(
                p => !selectedOtherNames.includes(p.name.trim().toLowerCase())
              );

              return (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="flex-1 relative">
                    <ProductAutocomplete
                      required
                      value={item.product_name}
                      onChange={(val) => handleItemChange(idx, 'product_name', val)}
                      masterProducts={availableProducts}
                      placeholder="اسم الكتاب أو المستلزم..."
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-1.5">
                    {/* Quantity Stepper */}
                    <div className="w-28 flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shrink-0 h-9">
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="px-2.5 h-9 text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-opacity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center font-bold text-slate-900 text-xs focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', item.quantity + 1)}
                        className="px-2.5 h-9 text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Line Button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shrink-0 h-9 w-9 flex items-center justify-center"
                        title="حذف هذا السطر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 h-8 rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-200 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة كتاب آخر</span>
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm h-9 px-4 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الطلب'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-lg transition-colors border border-slate-200"
            >
              إلغاء
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
