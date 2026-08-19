'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import CustomersDirectory from '@/components/CustomersDirectory';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();

  return (
    <AppShell>
      {({ demands, masterProducts, handleCreateDemand, handleDeleteBulkCustomers }) => (
        <CustomersDirectory
          demands={demands}
          masterProducts={masterProducts}
          onCreateDemand={handleCreateDemand}
          onDeleteBulkCustomers={handleDeleteBulkCustomers}
          onSelectCustomer={(clientPhone) => {
            router.push(`/customers/${encodeURIComponent(clientPhone)}`);
          }}
        />
      )}
    </AppShell>
  );
}
