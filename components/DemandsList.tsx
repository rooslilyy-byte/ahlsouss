'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Phone, 
  BookOpen,
  CheckSquare,
  Square,
  Minus,
  Edit
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';
import ThermalReceiptModal from './ThermalReceiptModal';
import EditDemandModal from './EditDemandModal';
import ProductAutocomplete from './ProductAutocomplete';

interface DemandsListProps {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  onCreateDemand: (
    clientName: string, 
    clientPhone: string, 
    items: { product_name: string; quantity: number }[]
  ) => Promise<void>;
  onUpdateDemand: (
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
  onUpdateItemState: (
    itemId: string, 
    updates: { is_in_stock?: boolean; is_delivered?: boolean }
  ) => Promise<void>;
  onDeleteDemand: (demandId: string) => Promise<void>;
  initialSearchQuery?: string;
}

export default function DemandsList({
  demands,
  masterProducts,
  onCreateDemand,
  onUpdateDemand,
  onUpdateItemState,
  onDeleteDemand,
  initialSearchQuery = '',
}: DemandsListProps) {
  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<{ product_name: string; quantity: number }[]>([
    { product_name: '', quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all');
  const [expandedDemandId, setExpandedDemandId] = useState<string | null>(null);

  // Modals
  const [selectedPrintDemand, setSelectedPrintDemand] = useState<ClientDemand | null>(null);
  const [editingDemand, setEditingDemand] = useState<ClientDemand | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const total = demands.length;
    const pending = demands.filter(d => d.status === 'pending').length;
    const partial = demands.filter(d => d.status === 'partial').length;
    const completed = demands.filter(d => d.status === 'completed').length;
    return { total, pending, partial, completed };
  }, [demands]);

  const handleItemChange = (index: number, field: 'product_name' | 'quantity', value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_name: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product_name.trim().length > 0);
    if (!clientName.trim() || !clientPhone.trim() || validItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateDemand(clientName.trim(), clientPhone.trim(), validItems);
      setClientName('');
      setClientPhone('');
      setItems([{ product_name: '', quantity: 1 }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDemands = useMemo(() => {
    return demands.filter(dem => {
      const matchesStatus = statusFilter === 'all' || dem.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        dem.client?.name.toLowerCase().includes(q) ||
        dem.client?.phone.includes(q) ||
        dem.items?.some(i => i.product_name.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [demands, searchQuery, statusFilter]);

  const getWhatsAppLink = (demand: ClientDemand) => {
    if (!demand.client?.phone) return '#';
    let rawPhone = demand.client.phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);
    
    const readyItems = demand.items?.filter(i => i.is_in_stock && !i.is_delivered) || [];
    const readyText = readyItems.map(i => `- ${i.product_name} (${i.quantity})`).join('\n');
    
    const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${demand.client.name}،\n\nنخبركم من مكتبة وراقة اهل سوس أن الكتب والخصاصات التالية قد وصلت وتنتظر استلامكم:\n\n${readyText}\n\nالعنوان: مكتبة وراقة اهل سوس\nالهاتف: 0675502660`;
    
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Demand Entry Form */}
      <div ref={formRef} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">تسجيل طلبية خصاص جديدة</h2>
              <p className="text-xs text-slate-500">إدخال معلومات الزبون والكتب المستلزمات المعلقة</p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
            تكميل تلقائي سريع
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>اسم الزبون الكامل:</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: الحسن أيت الطالب"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-medium min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>رقم الهاتف (الواتساب):</span>
              </label>
              <input
                type="tel"
                required
                placeholder="مثال: 0661234567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-mono dir-ltr text-right min-h-[44px]"
              />
            </div>
          </div>

          {/* Items Row */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              قائمة الكتب والمستلزمات الناقصة:
            </label>

            {items.map((item, idx) => {
              return (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                  <div className="flex-1 relative">
                    <ProductAutocomplete
                      required
                      value={item.product_name}
                      onChange={(val) => handleItemChange(idx, 'product_name', val)}
                      masterProducts={masterProducts}
                      placeholder="ابحث أو اكتب اسم الكتاب..."
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="w-32 flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shrink-0 min-h-[44px]">
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

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2.5 text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border border-rose-200 sm:border-0 bg-white sm:bg-transparent"
                        title="حذف السطر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سطر آخر</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>طلب خصاص جديد</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* 2. Demands List & Search Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم الزبون، الهاتف، أو الكتاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              الكل ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'}`}
            >
              معلق ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'partial' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'}`}
            >
              جزئي ({stats.partial})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
            >
              مكتمل ({stats.completed})
            </button>
          </div>
        </div>

        {filteredDemands.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-600">لا توجد طلبات مطابقة للبحث</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDemands.map((demand) => {
              const totalItems = demand.items?.length || 0;
              const deliveredItems = demand.items?.filter(i => i.is_delivered).length || 0;
              const isExpanded = expandedDemandId === demand.id;

              return (
                <div 
                  key={demand.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all bg-white"
                >
                  <div className="p-3 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
                    
                    {/* Header: Client Info + Achievement Counter Aligned */}
                    <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                          {demand.client?.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{demand.client?.name}</h3>
                            <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              demand.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : demand.status === 'partial' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {demand.status === 'completed' ? 'مكتمل' : demand.status === 'partial' ? 'تسليم جزئي' : 'قيد الانتظار'}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 dir-ltr text-right">
                            <span>{demand.client?.phone}</span>
                            <span>•</span>
                            <span>{new Date(demand.created_at || Date.now()).toLocaleDateString('ar-MA')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-center shrink-0">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 block leading-tight">الإنجاز</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900">{deliveredItems} / {totalItems}</span>
                      </div>
                    </div>

                    {/* Compact Action Buttons Grid for Mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      
                      <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:flex-wrap sm:w-auto">
                        
                        <button
                          onClick={() => setEditingDemand(demand)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[36px] sm:min-h-[44px]"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
                          <span>تعديل الطلب</span>
                        </button>

                        <button
                          onClick={() => setSelectedPrintDemand(demand)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-200 min-h-[36px] sm:min-h-[44px]"
                        >
                          <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
                          <span>طباعة الوصل</span>
                        </button>

                        <a
                          href={getWhatsAppLink(demand)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[36px] sm:min-h-[44px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                          <span>إشعار واتساب</span>
                        </a>

                        <button
                          onClick={() => onDeleteDemand(demand.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[36px] sm:min-h-[44px]"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
                          <span>حذف الطلب</span>
                        </button>

                        <button
                          onClick={() => setExpandedDemandId(isExpanded ? null : demand.id)}
                          className="col-span-2 sm:col-span-1 p-1.5 sm:p-2.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 min-h-[36px] sm:min-h-[44px] flex items-center justify-center border border-slate-200 sm:border-0"
                          title="عرض التفاصيل"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>

                      </div>

                    </div>

                  </div>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200/60">
                        <h4 className="text-xs font-bold text-slate-700">تفاصيل الكتب والمستلزمات المطلوبة:</h4>
                        <button
                          onClick={() => setEditingDemand(demand)}
                          className="text-sky-700 hover:text-sky-900 text-xs font-bold flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 min-h-[36px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-sky-600" />
                          <span>تعديل هذه الطلبية</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {demand.items?.map((item) => (
                          <div 
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm sm:text-xs">{item.product_name}</span>
                              <span className="bg-slate-100 font-bold px-2.5 py-1 rounded-md text-slate-700 text-xs sm:text-[11px]">
                                العدد: {item.quantity}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => onUpdateItemState(item.id, { is_in_stock: !item.is_in_stock })}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs min-h-[44px] ${
                                  item.is_in_stock 
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {item.is_in_stock ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                <span>{item.is_in_stock ? 'متوفر بالمحل' : 'غير متوفر'}</span>
                              </button>

                              <button
                                onClick={() => onUpdateItemState(item.id, { is_delivered: !item.is_delivered })}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs min-h-[44px] ${
                                  item.is_delivered 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {item.is_delivered ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                <span>{item.is_delivered ? 'تم التسليم' : 'لم يسلم'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Thermal Receipt Modal */}
      {selectedPrintDemand && (
        <ThermalReceiptModal
          demand={selectedPrintDemand}
          onClose={() => setSelectedPrintDemand(null)}
        />
      )}

      {/* Edit Demand Modal */}
      {editingDemand && (
        <EditDemandModal
          demand={editingDemand}
          masterProducts={masterProducts}
          onClose={() => setEditingDemand(null)}
          onSave={onUpdateDemand}
        />
      )}

    </div>
  );
}
