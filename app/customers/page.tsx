'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import CustomersDirectory from '@/components/CustomersDirectory';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();

  return (
    <AppShell>
      {({ demands }) => (
        <CustomersDirectory
          demands={demands}
          onSelectCustomer={(clientPhone) => {
            router.push(`/demands?search=${encodeURIComponent(clientPhone)}`);
          }}
        />
      )}
    </AppShell>
  );
}
