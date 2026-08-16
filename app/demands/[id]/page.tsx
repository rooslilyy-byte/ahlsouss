'use client';

import React, { use } from 'react';
import AppShell from '@/components/AppShell';
import DemandsList from '@/components/DemandsList';

export default function SingleDemandPage({ params }: { params: Promise<{ id: string }> }) {
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
      }) => {
        const targetDemand = demands.find(d => d.id === id);
        const searchQuery = targetDemand?.client?.name || id;

        return (
          <DemandsList
            demands={demands}
            masterProducts={masterProducts}
            onCreateDemand={handleCreateDemand}
            onUpdateDemand={handleUpdateDemand}
            onUpdateItemState={handleUpdateItemState}
            onDeleteDemand={handleDeleteDemand}
            initialSearchQuery={searchQuery}
          />
        );
      }}
    </AppShell>
  );
}
