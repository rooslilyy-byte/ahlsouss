'use client';

import React, { use } from 'react';
import AppShell from '@/components/AppShell';
import CustomerDetails from '@/components/CustomerDetails';

export default function SingleCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppShell>
      {({
        demands,
        masterProducts,
        handleUpdateDemand,
        handleUpdateItemState,
        handleDeleteDemand,
      }) => (
        <CustomerDetails
          id={id}
          demands={demands}
          masterProducts={masterProducts}
          onUpdateDemand={handleUpdateDemand}
          onUpdateItemState={handleUpdateItemState}
          onDeleteDemand={handleDeleteDemand}
        />
      )}
    </AppShell>
  );
}
