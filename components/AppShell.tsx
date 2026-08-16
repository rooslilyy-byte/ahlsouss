'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  getActiveBatch, 
  archiveActiveBatch, 
  getMasterProducts, 
  getClientDemands, 
  createClientDemand, 
  updateClientDemand,
  updateDemandItemState, 
  deleteClientDemand 
} from '@/lib/dataStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PurchaseBatch, MasterProduct, ClientDemand } from '@/lib/types';

export interface AppShellData {
  demands: ClientDemand[];
  masterProducts: MasterProduct[];
  activeBatch: PurchaseBatch | null;
  isLoading: boolean;
  loadData: () => Promise<void>;
  handleCreateDemand: (name: string, phone: string, items: any[]) => Promise<void>;
  handleUpdateDemand: (id: string, name: string, phone: string, items: any[]) => Promise<void>;
  handleUpdateItemState: (id: string, updates: any) => Promise<void>;
  handleDeleteDemand: (id: string) => Promise<void>;
  handleArchiveBatch: (name: string) => Promise<void>;
}

interface AppShellProps {
  children: (data: AppShellData) => React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [activeBatch, setActiveBatch] = useState<PurchaseBatch | null>(null);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [demands, setDemands] = useState<ClientDemand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const batch = await getActiveBatch();
      setActiveBatch(batch);

      const [prods, demList] = await Promise.all([
        getMasterProducts(),
        getClientDemands(batch.id),
      ]);

      setMasterProducts(prods);
      setDemands(demList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDemand = async (name: string, phone: string, items: any[]) => {
    await createClientDemand(name, phone, items);
    await loadData();
  };

  const handleUpdateDemand = async (id: string, name: string, phone: string, items: any[]) => {
    await updateClientDemand(id, name, phone, items);
    await loadData();
  };

  const handleUpdateItemState = async (itemId: string, updates: { is_in_stock?: boolean; is_delivered?: boolean }) => {
    await updateDemandItemState(itemId, updates);
    await loadData();
  };

  const handleDeleteDemand = async (id: string) => {
    await deleteClientDemand(id);
    await loadData();
  };

  const handleArchiveBatch = async (newBatchName: string) => {
    await archiveActiveBatch(newBatchName);
    await loadData();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex font-cairo dir-rtl overflow-x-hidden">
      <Sidebar isSupabaseActive={isSupabaseConfigured} />

      <div className="flex-1 lg:mr-64 flex flex-col min-h-[100dvh] pt-14 lg:pt-0 w-full">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-600">جاري تحميل بيانات مكتبة وراقة اهل سوس...</p>
            </div>
          ) : (
            children({
              demands,
              masterProducts,
              activeBatch,
              isLoading,
              loadData,
              handleCreateDemand,
              handleUpdateDemand,
              handleUpdateItemState,
              handleDeleteDemand,
              handleArchiveBatch,
            })
          )}
        </main>

        <footer className="bg-slate-900 text-slate-400 text-xs py-4 text-center border-t border-slate-800 mt-auto no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-bold text-slate-300">
              مكتبة وراقة اهل سوس — الهاتف: <span className="font-mono text-slate-300 dir-ltr">0675502660</span>
            </p>
            <p>© {new Date().getFullYear()} نظام متابعة وتوزيع خصاصات الدخول المدرسي POS.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
