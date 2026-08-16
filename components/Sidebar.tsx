'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  PackageCheck, 
  FileText, 
  Phone, 
  Menu, 
  X
} from 'lucide-react';

interface SidebarProps {
  isSupabaseActive: boolean;
}

export default function Sidebar({ isSupabaseActive }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: BarChart3 },
    { href: '/customers', label: 'دليل الزبائن', icon: Users },
    { href: '/demands', label: 'طلبات الخصاص', icon: ClipboardList },
    { href: '/stock', label: 'استقبال وتوزيع السلع', icon: PackageCheck },
    { href: '/reports', label: 'التقارير والمشتريات', icon: FileText },
  ];

  const activeItem = navItems.find(item => 
    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
  ) || navItems[0];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 border-l border-slate-800 shadow-xl no-print">
      
      {/* Library Branding */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-700 shrink-0 overflow-hidden">
            <img src="/logo.png" alt="شعار مكتبة وراقة اهل سوس" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-100 tracking-tight leading-tight">
              مكتبة وراقة اهل سوس
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">متابعة خصاصات الدخول المدرسي</p>
          </div>
        </div>

        {/* Store Phone & Database Status */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <a href="tel:0675502660" className="flex items-center gap-1.5 text-slate-300 hover:text-slate-100 font-mono dir-ltr">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>0675502660</span>
          </a>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
            isSupabaseActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
          }`}>
            {isSupabaseActive ? 'Supabase' : 'محلي'}
          </span>
        </div>
      </div>

      {/* Pure Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-100' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        نظام خصاصات المكتبة POS v2.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Right Side) */}
      <aside className="hidden lg:block fixed top-0 right-0 bottom-0 z-30 no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar (Fixed full width on top of viewport) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shadow-md no-print min-h-[56px] w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 text-slate-300 hover:text-white rounded-xl bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="القائمة الرئيسية"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="شعار" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 shrink-0 shadow-sm" />
            <div>
              <h1 className="font-extrabold text-xs text-slate-100 leading-tight">مكتبة وراقة اهل سوس</h1>
              <span className="text-[10px] text-sky-400 font-bold block">{activeItem?.label}</span>
            </div>
          </div>
        </div>

        <a 
          href="tel:0675502660" 
          className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-2 rounded-xl dir-ltr flex items-center gap-1.5 min-h-[44px] hover:text-white"
        >
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>0675502660</span>
        </a>
      </div>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-start no-print animate-in fade-in duration-150">
          <div className="w-72 h-full animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}
    </>
  );
}
