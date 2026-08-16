'use client';

import React, { use } from 'react';
import AppShell from '@/components/AppShell';
import DemandsList from '@/components/DemandsList';

export default function SingleCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

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
          initialSearchQuery={decodeURIComponent(id)}
        />
      )}
    </AppShell>
  );
}
