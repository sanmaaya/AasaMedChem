import React from 'react';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import { redirect } from 'next/navigation';

export default async function BuyerLayout({ children }) {
  const session = await auth();
  
  if (!session || session.user.role !== 'buyer') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row theme-buyer">
      <Sidebar user={session.user} />
      <main className="flex-1 lg:pl-64 pt-[4.25rem] lg:pt-0 min-h-screen">
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
