'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { 
  Search, 
  User, 
  Phone, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  PackageCheck,
  X,
  Loader2
} from 'lucide-react';

interface SearchResultItem {
  item_id: string;
  product_name: string;
  quantity: number;
  is_in_stock: boolean;
  is_delivered: boolean;
  item_created_at: string;
  demand_id: string;
  demand_status: string;
  demand_created_at: string;
  client_id: string;
  client_name: string;
  client_phone: string;
}

function ProductSearchContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchResults = useCallback(async (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search-product?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error('فشل جلب نتائج البحث');
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchResults]);

  const getItemStatusBadge = (item: SearchResultItem) => {
    if (item.is_delivered) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تم التسليم
        </span>
      );
    }
    if (item.is_in_stock) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <PackageCheck className="w-3.5 h-3.5" />
          متوفر بالمكتبة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        في انتظار التوفر
      </span>
    );
  };

  const getDemandStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
            مكتمل
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
            جزئي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            قيد الانتظار
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              البحث عن منتج في الطلبيات
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ابحث عن أي كتاب أو مطبوع لمعرفة الزبناء الذين طلبوه حالة التوفر والتسليم
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="relative bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex items-center">
          <div className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ادخل اسم المنتج أو الكتاب، اسم الزبون، أو رقم الهاتف..."
            className="w-full pr-11 pl-10 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Content */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">
              نتائج البحث ({results.length})
            </span>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                لم يتم العثور على أي نتائج
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                لا توجد عناصر مطابقة لـ &quot;<span className="font-bold text-slate-700">{searchTerm}</span>&quot;. تحقق من كلمة البحث أو جرب مصطلحاً آخر.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {results.map((item) => (
                <div
                  key={item.item_id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left (Product & Client Information) */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight break-words">
                            {item.product_name}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md shrink-0">
                            الكمية: {item.quantity}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {getItemStatusBadge(item)}
                          <span className="text-xs text-slate-400">|</span>
                          <span className="text-xs text-slate-500">حالة الطلبية:</span>
                          {getDemandStatusBadge(item.demand_status)}
                        </div>
                      </div>
                    </div>

                    {/* Client info bar */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>الزبون: {item.client_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-600 dir-ltr">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.client_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right (Action Link to Demand Page) */}
                  <div className="flex items-center md:flex-col justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <Link
                      href={`/demands/${encodeURIComponent(item.demand_id)}`}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm"
                    >
                      <span>عرض طلبية الزبون</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            ابحث عن الكتب والمنتجات
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            قم بكتابة اسم الكراسة، الكتاب المدرسي، اسم الزبون، أو رقم الهاتف لعرض الطلبيات المتعلقة به مباشرة.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell>
      {() => <ProductSearchContent />}
    </AppShell>
  );
}
