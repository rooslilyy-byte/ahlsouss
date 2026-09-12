'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, FileText, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupplierAggregatedItem, PurchaseBatch, ClientDemand } from '@/lib/types';
import { getSupplierAggregatedReport } from '@/lib/dataStore';
import { compareProductNames } from '@/lib/sortUtils';

interface SupplierBuyingSheetProps {
  activeBatch: PurchaseBatch | null;
  demands?: ClientDemand[];
  onArchiveBatch?: (newBatchName: string) => void;
}

type ReportTab = 'normal' | 'rupture';

export default function SupplierBuyingSheet({
  activeBatch,
  demands,
}: SupplierBuyingSheetProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('normal');
  const [fetchedNormalReport, setFetchedNormalReport] = useState<SupplierAggregatedItem[]>([]);
  const [fetchedRuptureReport, setFetchedRuptureReport] = useState<SupplierAggregatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const [normalData, ruptureData] = await Promise.all([
        getSupplierAggregatedReport(activeBatch?.id, 'normal'),
        getSupplierAggregatedReport(activeBatch?.id, 'rupture'),
      ]);
      setFetchedNormalReport(normalData);
      setFetchedRuptureReport(ruptureData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!demands) {
      fetchReport();
    } else {
      setIsLoading(false);
    }
  }, [activeBatch, demands]);

  const { normalReport, ruptureReport } = useMemo(() => {
    if (!demands) return { normalReport: null, ruptureReport: null };
    const normalMap: Record<string, SupplierAggregatedItem> = {};
    const ruptureMap: Record<string, SupplierAggregatedItem> = {};

    for (const dem of demands) {
      if (!dem.items || !dem.client) continue;

      for (const item of dem.items) {
        if (item.is_delivered || item.is_in_stock) continue;

        const stillNeeded = Math.max(0, item.quantity - (item.fulfilled_quantity || 0));
        if (stillNeeded <= 0) continue;

        const isRupture = item.status === 'en_rupture';
        const targetMap = isRupture ? ruptureMap : normalMap;

        const pName = item.product_name.trim();
        if (!targetMap[pName]) {
          targetMap[pName] = {
            productName: pName,
            totalQuantity: 0,
            clients: [],
          };
        }

        targetMap[pName].totalQuantity += stillNeeded;
        targetMap[pName].clients.push({
          clientName: dem.client.name,
          phone: dem.client.phone,
          quantity: stillNeeded,
          demandId: dem.id,
        });
      }
    }

    const sortFn = (a: SupplierAggregatedItem, b: SupplierAggregatedItem) => compareProductNames(a.productName, b.productName);

    return {
      normalReport: Object.values(normalMap).sort(sortFn),
      ruptureReport: Object.values(ruptureMap).sort(sortFn),
    };
  }, [demands]);

  const normalList = normalReport ?? fetchedNormalReport;
  const ruptureList = ruptureReport ?? fetchedRuptureReport;

  const currentReport = activeTab === 'normal' ? normalList : ruptureList;

  // Alphabetical sorting (Arabic first أ-ي, then French/Latin A-Z) right before rendering table rows
  const sortedReport = useMemo(() => {
    return [...currentReport].sort((a, b) => compareProductNames(a.productName, b.productName));
  }, [currentReport]);

  const handlePrint = () => {
    window.print();
  };

  const normalCount = normalList.length;
  const ruptureCount = ruptureList.length;

  const totalItemTypes = sortedReport.length;
  const totalPiecesCount = sortedReport.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  const reportTitle = activeTab === 'normal' ? 'تقرير مشتريات الموردين' : 'تقرير السلع غير المتوفرة';
  const reportSubtitle = activeTab === 'normal'
    ? 'متابعة خصاصات الدخول المدرسي — قائمة المشتريات المعلقة'
    : 'متابعة خصاصات الدخول المدرسي — قائمة السلع غير المتوفرة (En rupture)';

  const formattedDate = new Date().toLocaleDateString('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      
      {/* 1. Screen Header Controls (NO-PRINT) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 no-print">
        {/* Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{reportTitle}</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'normal' ? 'حصر الخصاصات وطلبيات الموردين المعلقة' : 'قائمة السلع المقطوعة لدى الموردين (En rupture)'}
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center self-start xl:self-center bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('normal')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all ${
              activeTab === 'normal'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
            <span>المشتريات العادية</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'normal' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {normalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rupture')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all ${
              activeTab === 'rupture'
                ? 'bg-white text-rose-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>السلع غير المتوفرة</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'rupture' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {ruptureCount}
            </span>
          </button>
        </div>

        {/* Summary Counters & A4 Print Button */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 h-9 rounded-lg">
            <span className="text-slate-500">العناوين:</span>
            <strong className="text-slate-900">{totalItemTypes}</strong>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">مجموع القطع:</span>
            <strong className="text-slate-900">{totalPiecesCount}</strong>
          </div>

          <button
            onClick={handlePrint}
            disabled={currentReport.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold h-9 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>

      {/* 3. Screen UI Web View (NO-PRINT) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs no-print">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500 font-medium text-xs">جاري تحميل تقرير المشتريات...</div>
        ) : sortedReport.length === 0 ? (
          activeTab === 'normal' ? (
            <div className="text-center py-8 border border-dashed border-emerald-200 bg-emerald-50/50 rounded-lg space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-emerald-800 font-bold text-sm">جميع الكتب متوفرة في المخزون</p>
              <p className="text-xs text-emerald-600">لا توجد خصاصات معلقة للموردين في الوقت الحالي</p>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-lg space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-slate-800 font-bold text-sm">لا توجد سلع مقطوعة (En rupture)</p>
              <p className="text-xs text-slate-500">لم يتم تحديد أي كتاب كسلعة غير متوفرة حالياً</p>
            </div>
          )
        ) : (
          <>
            {/* Mobile Stacked Card View (< md) */}
            <div className="block md:hidden space-y-2">
              {sortedReport.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="bg-slate-800 text-white font-bold text-xs w-5 h-5 rounded flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-xs truncate">{item.productName}</h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold text-xs shrink-0">
                      {item.totalQuantity} قطعة
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">طلبيات الزبناء:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.clients.map((cli, cIdx) => (
                        <span key={cIdx} className="bg-white border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                          {cli.clientName} ({cli.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3 w-12 text-center">#</th>
                    <th className="py-2 px-3">اسم السلعة / الكتاب</th>
                    <th className="py-2 px-3 text-center w-28">إجمالي العدد</th>
                    <th className="py-2 px-3">تفاصيل الزبناء المنتظرين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedReport.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 text-xs sm:text-sm">{item.productName}</td>
                      <td className="py-2 px-3 text-center font-bold text-sm text-slate-900 bg-slate-50/50">
                        {item.totalQuantity}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {item.clients.map((cli, cIdx) => (
                            <span key={cIdx} className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                              {cli.clientName} ({cli.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* DEDICATED PRINTABLE PORTAL DIRECTLY AT DOCUMENT BODY */}
      {mounted && createPortal(
        <div id="printable-a4-report" className="print-only">
          <div className="printable-supplier font-cairo bg-white text-black">
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="شعار مكتبة وراقة اهل سوس" 
                  className="w-14 h-14 object-contain grayscale contrast-125 shrink-0" 
                />
                <div>
                  <h1 className="text-2xl font-black text-black">مكتبة وراقة اهل سوس</h1>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">{reportTitle}</h2>
                  <p className="text-xs font-semibold text-slate-700">{reportSubtitle}</p>
                  <p className="text-xs font-mono text-slate-800 dir-ltr mt-0.5 text-right">الهاتف: 0675502660</p>
                </div>
              </div>
              <div className="text-left text-xs text-slate-700 font-medium">
                <p><span className="font-bold">النوع:</span> {activeTab === 'normal' ? 'مشتريات معلقة' : 'سلع غير متوفرة'}</p>
                <p><span className="font-bold">الدفعة:</span> {activeBatch?.batch_name || 'الدفعة العامة'}</p>
                <p><span className="font-bold">التاريخ:</span> {formattedDate}</p>
              </div>
            </div>

            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black border-y-2 border-slate-900">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">السلعة / الكتاب المطلوب</th>
                  <th className="py-2.5 px-3 text-center w-28">العدد المطلوب</th>
                  <th className="py-2.5 px-3">تفاصيل طلبات الزبناء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {sortedReport.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-center font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-extrabold text-sm">{item.productName}</td>
                    <td className="py-3 px-3 text-center font-black text-base">{item.totalQuantity}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.clients.map((cli, cIdx) => (
                          <span key={cIdx} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                            {cli.clientName} ({cli.quantity})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 font-black bg-slate-50">
                  <td colSpan={2} className="py-3 px-3 text-left">
                    {activeTab === 'normal' ? 'المجموع الإجمالي للقطع المطلوب شراؤها:' : 'المجموع الإجمالي للقطع غير المتوفرة:'}
                  </td>
                  <td className="py-3 px-3 text-center text-lg font-black text-slate-900">{totalPiecesCount}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between items-end text-xs font-bold text-slate-800">
              <div>
                <p>توقيع مسؤول المشتريات:</p>
                <div className="h-10"></div>
              </div>
              <div>
                <p>خاتم مكتبة وراقة اهل سوس:</p>
                <div className="h-10"></div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
