'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Package, 
  Plus, 
  ArrowLeft,
  FileText
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';

interface DashboardOverviewProps {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardOverview({
  demands,
  masterProducts,
}: DashboardOverviewProps) {
  const stats = useMemo(() => {
    const totalDemands = demands.length;
    const pendingDemands = demands.filter(d => d.status === 'pending').length;
    const partialDemands = demands.filter(d => d.status === 'partial').length;
    const completedDemands = demands.filter(d => d.status === 'completed').length;

    let totalItemsCount = 0;
    let deliveredItemsCount = 0;
    const bookFrequency: Record<string, number> = {};

    for (const d of demands) {
      if (d.items) {
        for (const item of d.items) {
          totalItemsCount += item.quantity;
          if (item.is_delivered) deliveredItemsCount += item.quantity;

          bookFrequency[item.product_name] = (bookFrequency[item.product_name] || 0) + item.quantity;
        }
      }
    }

    const topRequestedBooks = Object.entries(bookFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalDemands,
      pendingDemands,
      partialDemands,
      completedDemands,
      totalItemsCount,
      deliveredItemsCount,
      topRequestedBooks,
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

      {/* 3. Top Requested Books & Quick POS Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Requested Books */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-700" />
              <h3 className="font-extrabold text-slate-900 text-base">أكثر الكتب والمستلزمات طلباً</h3>
            </div>
            
            {/* Direct A4 Reports Route Link */}
            <Link
              href="/reports"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors min-h-[44px]"
            >
              <FileText className="w-4 h-4 text-slate-700 shrink-0" />
              <span>تقرير المشتريات A4</span>
            </Link>
          </div>

          <div className="space-y-3">
            {stats.topRequestedBooks.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">لا توجد بيانات كافية للتحليل حالياً</p>
            ) : (
              stats.topRequestedBooks.map(([title, qty], idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{title}</span>
                  </div>
                  <span className="font-black text-slate-900 text-xs bg-white border border-slate-200 px-3 py-1 rounded-md">
                    {qty} قطعة مطلوب
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* POS Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
            اختصارات سريعة للبائع
          </h3>

          <div className="space-y-2.5">
            <Link
              href="/demands"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors shadow-sm min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-white" />
                <span>تسجيل طلب خصاص جديد</span>
              </span>
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/stock"
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 p-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-600" />
                <span>استقبال وتوزيع السلع</span>
              </span>
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/customers"
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 p-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>دليل وسجل الزبائن</span>
              </span>
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
