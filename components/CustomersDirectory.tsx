'use client';

import React, { useState, useMemo } from 'react';
import { Users, Search, Phone, MessageSquare, ClipboardList } from 'lucide-react';
import { ClientDemand } from '@/lib/types';

interface CustomersDirectoryProps {
  demands: ClientDemand[];
  onSelectCustomer: (clientPhone: string) => void;
}

export default function CustomersDirectory({ demands, onSelectCustomer }: CustomersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

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

  const getWhatsAppLink = (name: string, phone: string) => {
    let rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);
    const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${name}،\n\nنواصل معكم من مكتبة وراقة اهل سوس لمتابعة خصاصاتكم.\nالهاتف: 0675502660`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">دليل وسجل الزبناء (Customer Directory)</h2>
            <p className="text-xs text-slate-500">قائمة كاملة بجميع زبناء المكتبة المسجلين وسجل خصاصاتهم</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم الزبون أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 font-medium min-h-[44px]"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">لا يوجد زبناء مطابقتون للبحث</p>
          </div>
        ) : (
          filteredCustomers.map((cli) => {
            const isFullyDelivered = cli.deliveredItems === cli.totalItems && cli.totalItems > 0;

            return (
              <div 
                key={cli.phone} 
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                        {cli.name.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{cli.name}</h3>
                        <a 
                          href={`tel:${cli.phone}`} 
                          className="text-xs text-slate-500 font-mono flex items-center gap-1 hover:text-slate-900 mt-0.5 dir-ltr"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cli.phone}</span>
                        </a>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isFullyDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isFullyDelivered ? 'مكتمل' : 'معلق'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي الطلبيات</span>
                      <span className="font-extrabold text-slate-900">{cli.totalDemands} طلبية</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">استلام المواد</span>
                      <span className="font-extrabold text-slate-900">{cli.deliveredItems} / {cli.totalItems} قطعة</span>
                    </div>
                  </div>
                </div>

                {/* Clean SVG Icon + Arabic Text Buttons (No Emojis) */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={getWhatsAppLink(cli.name, cli.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>إشعار واتساب</span>
                  </a>

                  <button
                    onClick={() => onSelectCustomer(cli.phone)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <ClipboardList className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>عرض الخصاصات</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
