'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowLeft,
  UserPlus,
  FileSpreadsheet,
  PackageCheck
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';

interface DashboardOverviewProps {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardOverview({
  demands,
}: DashboardOverviewProps) {
  const stats = useMemo(() => {
    const totalDemands = demands.length;
    const pendingDemands = demands.filter(d => d.status === 'pending').length;
    const partialDemands = demands.filter(d => d.status === 'partial').length;
    const completedDemands = demands.filter(d => d.status === 'completed').length;

    let totalItemsCount = 0;
    let deliveredItemsCount = 0;

    for (const d of demands) {
      if (d.items) {
        for (const item of d.items) {
          totalItemsCount += item.quantity;
          if (item.is_delivered) deliveredItemsCount += item.quantity;
        }
      }
    }

    return {
      totalDemands,
      pendingDemands,
      partialDemands,
      completedDemands,
      totalItemsCount,
      deliveredItemsCount,
    };
  }, [demands]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">لوحة تحكّم المكتبة</h2>
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded border border-slate-700">
              موسم الدخول المدرسي
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مكتبة وراقة اهل سوس • نظام متابعة وتوزيع خصاصات الكتب في الوقت الفعلي
          </p>
        </div>

        <Link
          href="/demands"
          className="bg-slate-100 hover:bg-white text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-2 transition-all active:scale-95 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-slate-900 shrink-0" />
          <span>تسجيل طلب جديد</span>
        </Link>
      </div>

      {/* 2. Professional ERP KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Demands Card */}
        <Link 
          href="/demands"
          className="bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-2xl p-5 shadow-sm block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">إجمالي الطلبات</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.totalDemands}</span>
            <span className="text-xs text-slate-500 font-medium">طلب مسجل</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>مجموع القطع المطلوبة:</span>
            <span className="font-bold text-slate-800">{stats.totalItemsCount} قطعة</span>
          </div>
        </Link>

        {/* Pending Card */}
        <Link 
          href="/demands"
          className="bg-white border border-rose-200 hover:border-rose-300 transition-all rounded-2xl p-5 shadow-sm block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">قيد الانتظار</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700">{stats.pendingDemands}</span>
            <span className="text-xs text-rose-600 font-medium">طلب معلق</span>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700">
            <span>تنتظر الشراء للمحل</span>
          </div>
        </Link>

        {/* Partial Card */}
        <Link 
          href="/demands"
          className="bg-white border border-amber-200 hover:border-amber-300 transition-all rounded-2xl p-5 shadow-sm block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">تسليم جزئي</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{stats.partialDemands}</span>
            <span className="text-xs text-amber-600 font-medium">مستلم جزئياً</span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-700">
            <span>بعض العناصر متوفرة</span>
          </div>
        </Link>

        {/* Completed Card */}
        <Link 
          href="/demands"
          className="bg-white border border-emerald-200 hover:border-emerald-300 transition-all rounded-2xl p-5 shadow-sm block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">مكتمل المسلمات</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{stats.completedDemands}</span>
            <span className="text-xs text-emerald-600 font-medium">تم التسليم بالكامل</span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-700">
            <span>تم تسليم جميع الكتب</span>
          </div>
        </Link>

      </div>

      {/* 3. Prominent Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        
        {/* Card 1: Add Client & Demand */}
        <Link
          href="/demands"
          className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md transition-all active:scale-[0.98] flex flex-col justify-between space-y-4 group min-h-[140px] w-full"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
              <UserPlus className="w-6 h-6 text-sky-400" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
          </div>
          <div>
            <h3 className="font-black text-white text-base sm:text-lg">إضافة زبون جديد</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">تسجيل خصاص مدرسي جديد لزبون</p>
          </div>
        </Link>

        {/* Card 2: A4 Purchase Report */}
        <Link
          href="/reports"
          className="bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm transition-all active:scale-[0.98] flex flex-col justify-between space-y-4 group min-h-[140px] w-full"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-slate-900" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">تقرير المشتريات A4</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">طباعة ورقة الخصاص للموردين</p>
          </div>
        </Link>

        {/* Card 3: Add & Allocate Stock */}
        <Link
          href="/stock"
          className="bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm transition-all active:scale-[0.98] flex flex-col justify-between space-y-4 group min-h-[140px] w-full"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
              <PackageCheck className="w-6 h-6 text-slate-900" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">استقبال السلع والمخزون</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">تأكيد وصول الكتب وتوزيعها فوراً</p>
          </div>
        </Link>

      </div>

    </div>
  );
}
