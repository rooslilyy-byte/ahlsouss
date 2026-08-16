'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'رمز الدخول غير صحيح، يرجى التأكد وإعادة المحاولة');
      }
    } catch (err) {
      setError('حدث خطأ بالاتصال، يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo dir-rtl selection:bg-sky-500 selection:text-white">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Bookstore Branding */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-lg border border-slate-700 flex items-center justify-center">
            <img src="/logo.png" alt="شعار مكتبة وراقة اهل سوس" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              مكتبة وراقة اهل سوس
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              نظام متابعة وتوزيع خصاصات الدخول المدرسي POS
            </p>
          </div>
        </div>

        {/* Auth Error Banner */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Passcode Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-sky-400" />
              <span>رمز الدخول السري (Passcode):</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="أدخل الرمز السري هنا..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono tracking-wider transition-colors min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors min-h-[48px] min-w-[44px]"
                title={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passcode.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق من الرمز...</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول للنظام</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          حماية خاصة بطاقم عمل مكتبة وراقة اهل سوس • الجلسة ممتدة 30 يوماً
        </div>

      </div>
    </div>
  );
}
