'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, Search, Phone, MessageSquare, ClipboardList, ChevronDown, ChevronUp, BookOpen, Plus, Trash2, X } from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';
import CreateDemandModal from './CreateDemandModal';

interface CustomersDirectoryProps {
  demands: ClientDemand[];
  masterProducts?: MasterProduct[];
  onCreateDemand?: (
    clientName: string, 
    clientPhone: string, 
    items: { product_name: string; quantity: number }[]
  ) => Promise<void>;
  onDeleteBulkCustomers?: (clientIds: string[]) => Promise<void>;
  onSelectCustomer?: (clientPhone: string) => void;
}

export default function CustomersDirectory({ 
  demands, 
  masterProducts = [], 
  onCreateDemand,
  onDeleteBulkCustomers,
  onSelectCustomer 
}: CustomersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomerPhone, setExpandedCustomerPhone] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const customers = useMemo(() => {
    const map: Record<string, {
      id: string;
      name: string;
      phone: string;
      createdAt: string;
      totalDemands: number;
      totalItems: number;
      deliveredItems: number;
      latestDemand: ClientDemand;
    }> = {};

    for (const dem of demands) {
      if (!dem.client?.phone) continue;
      const phone = dem.client.phone.trim();
      const itemsCount = dem.items?.length || 0;
      const delCount = dem.items?.filter(i => i.is_delivered).length || 0;

      if (!map[phone]) {
        map[phone] = {
          id: dem.client.id,
          name: dem.client.name,
          phone,
          createdAt: dem.created_at || new Date().toISOString(),
          totalDemands: 1,
          totalItems: itemsCount,
          deliveredItems: delCount,
          latestDemand: dem,
        };
      } else {
        map[phone].totalDemands += 1;
        map[phone].totalItems += itemsCount;
        map[phone].deliveredItems += delCount;
      }
    }

    return Object.values(map).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [demands]);

  const filteredCustomers = customers.filter(c => 
    !searchQuery.trim() ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    c.phone.includes(searchQuery.trim())
  );

  const isAllSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleToggleCustomer = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedCustomerIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedCustomerIds.length === 0) return;
    const count = selectedCustomerIds.length;
    if (window.confirm(`هل أنت متأكد من حذف ${count} زبناء بجميع طلباتهم وسجلات خصاصهم نهائياً؟`)) {
      setIsDeletingBulk(true);
      try {
        if (onDeleteBulkCustomers) {
          await onDeleteBulkCustomers(selectedCustomerIds);
        }
        setSelectedCustomerIds([]);
        setIsSelectMode(false);
      } catch (err) {
        console.error('Error deleting bulk customers:', err);
        alert('حدث خطأ أثناء حذف الزبناء المحددات.');
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const getWhatsAppLink = (name: string, phone: string) => {
    let rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);
    const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${name}،\n\nنواصل معكم من مكتبة وراقة اهل سوس لمتابعة خصاصاتكم.\nالهاتف: 0675502660`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">دليل الزبناء</h2>
        </div>

        <div className="flex items-center gap-2 flex-col sm:flex-row w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 sm:top-3" />
            <input
              type="text"
              placeholder="ابحث باسم الزبون أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 h-9 sm:h-10 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-medium transition-colors"
            />
          </div>

          {/* Action Buttons based on isSelectMode */}
          {!isSelectMode ? (
            <>
              {/* Enter Select Mode Button */}
              {onDeleteBulkCustomers && (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs sm:text-sm px-3.5 h-9 sm:h-10 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0"
                  title="تحديد زبناء لحذفهم"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>حذف زبناء</span>
                </button>
              )}

              {/* Add Customer & Demand Button */}
              {onCreateDemand && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 h-9 sm:h-10 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>إضافة زبون وطلب خصاص</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Confirm Bulk Delete Button */}
              <button
                onClick={handleBulkDelete}
                disabled={selectedCustomerIds.length === 0 || isDeletingBulk}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm px-3.5 h-9 sm:h-10 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
                title="تأكيد حذف الزبناء المحددين"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>
                  {isDeletingBulk 
                    ? 'جاري الحذف...' 
                    : selectedCustomerIds.length > 0 
                    ? `تأكيد حذف (${selectedCustomerIds.length})` 
                    : 'حدد زبناء للحذف'}
                </span>
              </button>

              {/* Cancel Selection Mode Button */}
              <button
                onClick={handleCancelSelectMode}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm px-3.5 h-9 sm:h-10 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 border border-slate-200"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>إلغاء التحديد</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {onCreateDemand && (
        <CreateDemandModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          masterProducts={masterProducts}
          onCreateDemand={onCreateDemand}
        />
      )}

      {/* Compact Full-Width Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
        
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">لا يوجد زبناء مطابقتون للبحث</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80">
            
            {/* Desktop Table Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-3 min-w-[240px]">
                {isSelectMode && (
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      title="تحديد الكل"
                    />
                  </div>
                )}
                <span className="w-7 text-center">#</span>
                <span>الزبون والترقيم</span>
              </div>
              <div className="w-44 text-right">رقم الهاتف (الواتساب)</div>
              <div className="flex-1 text-center">حالة الخصاص والاستلام</div>
              <div className="w-48 text-left">الإجراءات الخيارات</div>
            </div>

            {/* Rows */}
            {filteredCustomers.map((cli, idx) => {
              const customerDemands = demands.filter(d => d.client?.phone?.trim() === cli.phone);
              const missingItems: { id: string; product_name: string; quantity: number }[] = [];
              for (const dem of customerDemands) {
                if (dem.items) {
                  for (const it of dem.items) {
                    if (!it.is_in_stock && !it.is_delivered) {
                      missingItems.push({
                        id: it.id,
                        product_name: it.product_name,
                        quantity: it.quantity,
                      });
                    }
                  }
                }
              }
              const missingCount = missingItems.length;
              const isExpanded = expandedCustomerPhone === cli.phone;
              const isSelected = selectedCustomerIds.includes(cli.id);

              return (
                <div key={cli.phone} className={`group transition-colors ${isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/80'}`}>
                  
                  {/* Main Minimalist Compact Row */}
                  <div 
                    onClick={() => setExpandedCustomerPhone(isExpanded ? null : cli.phone)}
                    className="py-2.5 px-3 sm:py-3 sm:px-5 cursor-pointer flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-right select-none"
                  >
                    
                    {/* RTL Section 1: Checkbox + ID + Customer Name */}
                    <div className="flex items-center justify-between md:justify-start gap-2.5 min-w-[240px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelectMode && (
                          <div className="w-5 flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleCustomer(cli.id);
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                              title="تحديد هذا الزبون"
                            />
                          </div>
                        )}

                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                          #{idx + 1}
                        </span>
                        
                        <Link
                          href={`/customers/${encodeURIComponent(cli.phone)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-extrabold text-slate-900 text-xs sm:text-sm hover:text-sky-700 hover:underline transition-colors truncate dir-rtl text-right"
                          title="انقر لعرض ملف الزبون الكامل"
                        >
                          {cli.name}
                        </Link>
                      </div>

                      {/* Mobile Expand Toggle Arrow */}
                      <div className="md:hidden flex items-center gap-1.5">
                        <button 
                          type="button" 
                          className="p-1 rounded-lg text-slate-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-800" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* RTL Section 2: Phone Column */}
                    <div className="w-full md:w-40 flex items-center justify-between md:justify-start gap-2">
                      <a 
                        href={`tel:${cli.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold font-mono text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 px-2 py-0.5 rounded border border-slate-200 transition-colors dir-ltr"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{cli.phone}</span>
                      </a>

                      {/* Mobile Badges */}
                      <div className="md:hidden flex items-center gap-1.5 flex-wrap">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded">
                          {cli.totalItems} سلعة
                        </span>
                        {missingCount > 0 ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded">
                            {missingCount} خصاص
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded">
                            جاهز
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RTL Section 3: Desktop Badges */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-2">
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black px-2.5 py-0.5 rounded-md">
                        {cli.totalItems} سلعة
                      </span>

                      {missingCount > 0 ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-2.5 py-0.5 rounded-md">
                          {missingCount} خصاص
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-md">
                          جميع طلباته مستلمة
                        </span>
                      )}
                    </div>

                    {/* RTL Section 4: Desktop Chevron */}
                    <div className="hidden md:flex w-16 items-center justify-end">
                      <div className="w-6 h-6 rounded bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-900" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Pure Minimalist Inline Missing Items List */}
                  {isExpanded && (
                    <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 space-y-1.5 animate-in fade-in duration-150 text-right">
                      {missingItems.length === 0 ? (
                        <div className="text-[11px] font-bold text-emerald-700 py-1">
                          جميع طلبات هذا الزبون متوفرة بالمحل أو تم تسليمها بالكامل.
                        </div>
                      ) : (
                        missingItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2.5 py-1 border-b border-slate-200/50 last:border-0 text-xs">
                            <span className="w-6 h-6 rounded bg-slate-200/80 text-slate-800 font-black text-xs flex items-center justify-center shrink-0">
                              {item.quantity}
                            </span>
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded shrink-0 border border-rose-200">
                              خصاص
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs truncate">
                              {item.product_name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
