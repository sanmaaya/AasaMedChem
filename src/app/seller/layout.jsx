import React from 'react';
import { auth } from '@/auth.js';
import Sidebar from '@/components/Sidebar.jsx';
import { redirect } from 'next/navigation';

export default async function SellerLayout({ children }) {
  const session = await auth();
  
  if (!session || session.user.role !== 'seller') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row theme-seller">
      <Sidebar user={session.user} />
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
