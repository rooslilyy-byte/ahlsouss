'use client';

import React, { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import DemandsList from '@/components/DemandsList';
import { useSearchParams } from 'next/navigation';

function DemandsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  return (
    <AppShell>
      {({
        demands,
        masterProducts,
        handleCreateDemand,
        handleUpdateDemand,
        handleUpdateItemState,
        handleDeleteDemand,
      }) => (
        <DemandsList
          demands={demands}
          masterProducts={masterProducts}
          onCreateDemand={handleCreateDemand}
          onUpdateDemand={handleUpdateDemand}
          onUpdateItemState={handleUpdateItemState}
          onDeleteDemand={handleDeleteDemand}
          initialSearchQuery={searchQuery}
        />
      )}
    </AppShell>
  );
}

export default function DemandsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">جاري تحميل طلبات الخصاص...</div>}>
      <DemandsContent />
    </Suspense>
  );
}
