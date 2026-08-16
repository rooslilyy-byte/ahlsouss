'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import SupplierBuyingSheet from '@/components/SupplierBuyingSheet';

export default function ReportsPage() {
  return (
    <AppShell>
      {({ activeBatch, handleArchiveBatch }) => (
        <SupplierBuyingSheet
          activeBatch={activeBatch}
          onArchiveBatch={handleArchiveBatch}
        />
      )}
    </AppShell>
  );
}
