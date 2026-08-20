'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Calendar, 
  ArrowRight, 
  Edit, 
  Printer, 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen,
  CheckSquare,
  Square,
  Package
} from 'lucide-react';
import { ClientDemand, MasterProduct } from '@/lib/types';
import ThermalReceiptModal from './ThermalReceiptModal';
import EditDemandModal from './EditDemandModal';

interface CustomerDetailsProps {
  id: string;
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
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
}

export default function CustomerDetails({
  id,
  demands,
  masterProducts,
  onUpdateDemand,
  onUpdateItemState,
  onDeleteDemand,
}: CustomerDetailsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Match target demand/customer by id, client id, phone, or name
  const targetDemand = useMemo(() => {
    const cleanId = decodeURIComponent(id).trim();
    return demands.find(d => 
      d.id === cleanId || 
      d.client?.id === cleanId || 
      d.client?.phone?.trim() === cleanId ||
      d.client?.name?.trim() === cleanId
    ) || null;
  }, [demands, id]);

  const stats = useMemo(() => {
    if (!targetDemand || !targetDemand.items) {
      return { total: 0, inStock: 0, delivered: 0, missing: 0, isComplete: false, isReady: false, isPartial: false };
    }
    const total = targetDemand.items.length;
    const inStock = targetDemand.items.filter(i => i.is_in_stock && !i.is_delivered).length;
    const delivered = targetDemand.items.filter(i => i.is_delivered).length;
    const missing = targetDemand.items.filter(i => !i.is_in_stock && !i.is_delivered).length;
    const isComplete = total > 0 && delivered === total;
    const isReady = !isComplete && total > 0 && (inStock + delivered) === total;
    const isPartial = !isComplete && !isReady && (inStock + delivered) > 0;

    return { total, inStock, delivered, missing, isComplete, isReady, isPartial };
  }, [targetDemand]);

  const whatsAppUrl = useMemo(() => {
    if (!targetDemand?.client?.phone) return '#';
    let rawPhone = targetDemand.client.phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '212' + rawPhone.slice(1);

    const readyItems = targetDemand.items?.filter(i => i.is_in_stock && !i.is_delivered) || [];
    const readyText = readyItems.map(i => `- ${i.product_name} (${i.quantity})`).join('\n');

    const message = `السلام عليكم ورحمة الله وبركاته السيد(ة) ${targetDemand.client.name}،\n\nنخبركم من مكتبة وراقة اهل سوس أن الكتب والخصاصات التالية قد وصلت وتنتظر استلامكم:\n\n${readyText || 'جميع خصاصاتكم المسجلة جاهزة'}\n\nالعنوان: مكتبة وراقة اهل سوس\nالهاتف: 0675502660`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  }, [targetDemand]);

  const handleDelete = async () => {
    if (!targetDemand) return;
    if (confirm('هل أنت تأكد من رغبتك في حذف ملف طلبية هذا الزبون نهائياً؟')) {
      await onDeleteDemand(targetDemand.id);
      router.push('/customers');
    }
  };

  if (!targetDemand) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">لم يتم العثور على طلبية هذا الزبون</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">قد تكون الطلبية حذفت أو غير متوفرة في الدفعة الحالية.</p>
        </div>
        <div className="pt-2">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى دليل الزبائن</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 h-8 rounded-lg transition-colors shadow-2xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى دليل الزبناء</span>
        </Link>

        <span className="text-xs font-mono font-bold text-slate-400">
          #ID: {targetDemand.id.substring(0, 8)}
        </span>
      </div>

      {/* 1. Header Banner & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        
        {/* Customer Main Metadata & Status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {targetDemand.client?.name.substring(0, 2)}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                  {targetDemand.client?.name}
                </h1>

                {/* Overall Demand Status Badge */}
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                  stats.isComplete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : stats.isReady
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : stats.isPartial
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {stats.isComplete 
                    ? 'مكتمل (تم التسليم)' 
                    : stats.isReady 
                    ? 'جاهز للتسليم' 
                    : stats.isPartial 
                    ? 'تسليم جزئي' 
                    : 'خصاص معلق'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                <a 
                  href={`tel:${targetDemand.client?.phone}`}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dir-ltr"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{targetDemand.client?.phone}</span>
                </a>

                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ التسجيل: {new Date(targetDemand.created_at || Date.now()).toLocaleDateString('ar-MA')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Action Buttons Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          
          {/* 1. Edit Demand */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>تعديل الطلب</span>
          </button>

          {/* 2. Thermal Print Receipt */}
          <button
            type="button"
            onClick={() => setIsPrinting(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-3.5 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الوصل</span>
          </button>

          {/* 3. WhatsApp Notification */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>إشعار الواتساب</span>
          </a>

          {/* 4. Delete Demand */}
          <button
            type="button"
            onClick={handleDelete}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs sm:text-sm px-3.5 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>حذف الطلب</span>
          </button>
        </div>

      </div>

      {/* 3. Missing vs. Ready Products List (Real-Time State) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <span>تفاصيل الكتب والمستلزمات المطلوبة ({stats.total} عناوين):</span>
          </h3>

          <div className="flex items-center gap-2 text-xs font-extrabold">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {stats.inStock + stats.delivered} متوفر / مسلَم
            </span>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
              {stats.missing} خصاص معلق
            </span>
          </div>
        </div>

        {/* Product Items List */}
        <div className="space-y-3">
          {targetDemand.items?.map((item, idx) => {
            const isInStock = item.is_in_stock;
            const isDelivered = item.is_delivered;

            return (
              <div
                key={item.id || idx}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:bg-slate-50"
              >
                
                {/* Item Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-900 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {item.quantity}
                  </span>

                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-base sm:text-lg leading-snug">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      الكمية المطلوبة: <strong className="text-slate-900 font-extrabold">{item.quantity} قطعة</strong>
                    </p>
                  </div>
                </div>

                {/* Stock Status Badge & Interactive Toggles */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  
                  {/* Stock Status Badge */}
                  {isInStock ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>متوفر / جاهز للاستلام</span>
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>خصاص / في انتظار التوفير</span>
                    </span>
                  )}

                  {/* Quick Action Toggle Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateItemState(item.id, { is_in_stock: !item.is_in_stock })}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs min-h-[38px] transition-all flex items-center gap-1.5 ${
                        item.is_in_stock 
                          ? 'bg-sky-100 text-sky-900 border border-sky-300' 
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      {item.is_in_stock ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{item.is_in_stock ? 'بالمحل' : 'توفير'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateItemState(item.id, { is_delivered: !item.is_delivered })}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs min-h-[38px] transition-all flex items-center gap-1.5 ${
                        item.is_delivered 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      {item.is_delivered ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{item.is_delivered ? 'تم التسليم' : 'تسليم'}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Thermal Receipt Modal */}
      {isPrinting && (
        <ThermalReceiptModal
          demand={targetDemand}
          onClose={() => setIsPrinting(false)}
        />
      )}

      {/* Edit Demand Modal */}
      {isEditing && (
        <EditDemandModal
          demand={targetDemand}
          masterProducts={masterProducts}
          onClose={() => setIsEditing(false)}
          onSave={onUpdateDemand}
        />
      )}

    </div>
  );
}
