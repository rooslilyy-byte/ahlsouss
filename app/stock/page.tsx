'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import StockAllocation from '@/components/StockAllocation';

export default function StockPage() {
  return (
    <AppShell>
      {({ demands, masterProducts, handleUpdateItemState, handleAutoAllocateStock }) => (
        <StockAllocation
          demands={demands}
          masterProducts={masterProducts}
          onUpdateItemState={handleUpdateItemState}
          onAutoAllocateStock={handleAutoAllocateStock}
        />
      )}
    </AppShell>
  );
}
