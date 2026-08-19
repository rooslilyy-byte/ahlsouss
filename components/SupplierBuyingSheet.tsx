'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, FileText, ShoppingCart, Users } from 'lucide-react';
import { SupplierAggregatedItem, PurchaseBatch, ClientDemand } from '@/lib/types';
import { getSupplierAggregatedReport } from '@/lib/dataStore';

interface SupplierBuyingSheetProps {
  activeBatch: PurchaseBatch | null;
  demands?: ClientDemand[];
  onArchiveBatch?: (newBatchName: string) => void;
}

export default function SupplierBuyingSheet({
  activeBatch,
  demands,
}: SupplierBuyingSheetProps) {
  const [fetchedReport, setFetchedReport] = useState<SupplierAggregatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await getSupplierAggregatedReport(activeBatch?.id);
      setFetchedReport(data);
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

  const computedReport = useMemo(() => {
    if (!demands) return null;
    const itemMap: Record<string, SupplierAggregatedItem> = {};

    for (const dem of demands) {
      if (!dem.items || !dem.client) continue;

      for (const item of dem.items) {
        if (item.is_delivered || item.is_in_stock) continue;

        const pName = item.product_name.trim();
        if (!itemMap[pName]) {
          itemMap[pName] = {
            productName: pName,
            totalQuantity: 0,
            clients: [],
          };
        }

        itemMap[pName].totalQuantity += item.quantity;
        itemMap[pName].clients.push({
          clientName: dem.client.name,
          phone: dem.client.phone,
          quantity: item.quantity,
          demandId: dem.id,
        });
      }
    }

    return Object.values(itemMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [demands]);

  const report = computedReport !== null ? computedReport : fetchedReport;

  const handlePrint = () => {
    window.print();
  };

  const totalItemTypes = report.length;
  const totalPiecesCount = report.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  const formattedDate = new Date().toLocaleDateString('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Screen Header Controls (NO-PRINT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">قائمة المشتريات المعلقة للموردين (A4 Supplier Sheet)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تقرير تجميعي بالكتب والسلع المعلقة للدفعة الحالية: <span className="font-bold text-slate-800">{activeBatch?.batch_name}</span>
          </p>
        </div>

        {/* Page-level action buttons: ONLY A4 Print button */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            onClick={handlePrint}
            disabled={report.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>طباعة القائمة A4</span>
          </button>
        </div>
      </div>

      {/* 2. Screen Metrics (NO-PRINT) */}
      <div className="grid grid-cols-2 gap-4 no-print">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">العناوين المعلقة</span>
            <span className="text-xl font-black text-slate-900">{totalItemTypes} عنوان</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">مجموع القطع للجملة</span>
            <span className="text-xl font-black text-emerald-700">{totalPiecesCount} قطعة</span>
          </div>
        </div>
      </div>

      {/* 3. Screen UI Web View (NO-PRINT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm no-print">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 font-bold">جاري تحميل تقرير المشتريات...</div>
        ) : report.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-600 font-bold">لا توجد سلع معلقة حالياً في هذه الدفعة</p>
          </div>
        ) : (
          <>
            {/* Mobile Stacked Card View (< md) */}
            <div className="block md:hidden space-y-3">
              {report.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-white font-bold text-xs w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm">{item.productName}</h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-black text-sm shrink-0">
                      {item.totalQuantity} قطعة
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">طلبيات الزبناء:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.clients.map((cli, cIdx) => (
                        <span key={cIdx} className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-semibold">
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
                  <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">اسم السلعة / الكتاب</th>
                    <th className="py-3 px-4 text-center w-28">إجمالي العدد المطلوب</th>
                    <th className="py-3 px-4">تفاصيل الزبناء المنتظرين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">{item.productName}</td>
                      <td className="py-3 px-4 text-center font-black text-base text-slate-900 bg-slate-50">
                        {item.totalQuantity}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex flex-wrap gap-1.5">
                          {item.clients.map((cli, cIdx) => (
                            <span key={cIdx} className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
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
                  <p className="text-xs font-semibold text-slate-700">متابعة خصاصات الدخول المدرسي — قائمة المشتريات المعلقة</p>
                  <p className="text-xs font-mono text-slate-800 dir-ltr mt-0.5 text-right">الهاتف: 0675502660</p>
                </div>
              </div>
              <div className="text-left text-xs text-slate-700 font-medium">
                <p><span className="font-bold">الدفعة:</span> {activeBatch?.batch_name}</p>
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
                {report.map((item, idx) => (
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
                  <td colSpan={2} className="py-3 px-3 text-left">المجموع الإجمالي للقطع المطلوب شراؤها:</td>
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
