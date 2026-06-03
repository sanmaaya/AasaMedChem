'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const role = user?.role || 'buyer';
  const name = user?.name || 'User';
  const email = user?.email || '';

  // Get navigation links based on role
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Products', href: '/admin/products', icon: Package },
          { name: 'Quotations', href: '/admin/quotations', icon: FileText },
          { name: 'User Management', href: '/admin/users', icon: Users },
        ];
      case 'seller':
        return [
          { name: 'Browse Products', href: '/seller/products', icon: Package },
          { name: 'Active Cart', href: '/seller/cart', icon: ShoppingCart },
          { name: 'Quotations History', href: '/seller/quotations', icon: FileText },
        ];
      case 'buyer':
        return [
          { name: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
          { name: 'My Orders/Quotations', href: '/buyer/quotations', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-905 border-stone-850';
      case 'seller': return 'bg-blue-600 text-white border-blue-500';
      case 'buyer': return 'bg-emerald-605 text-white border-emerald-500';
      default: return 'bg-stone-600 text-white border-stone-500';
    }
  };

  const activeLinkClass = "flex items-center px-4 py-3 rounded-lg text-sm font-semibold bg-role-accent-light text-role-accent border-l-4 border-role-border-active transition-all-custom";
  const inactiveLinkClass = "flex items-center px-4 py-3 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-stone-100 transition-all-custom";

  return (
    <div className={`theme-${role}`}>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 px-4 py-3 h-16 fixed top-0 left-0 right-0 z-40 transition-colors duration-300">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-role-primary flex items-center justify-center text-role-primary-foreground font-bold text-lg">
            A
          </div>
          <span className="font-serif-luxury font-black text-stone-800 dark:text-stone-100 text-sm tracking-tight">Aasa MedChem</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRoleBadgeColor()}`}>
            {role}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-400 focus:outline-hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 h-full' : '-translate-x-full h-full lg:h-screen'
        } pt-16 lg:pt-0 transition-colors duration-300`}
      >
        <div>
          {/* Logo / Header */}
          <div className="hidden lg:flex items-center justify-between px-6 py-6 border-b border-stone-100 dark:border-stone-850">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-role-primary flex items-center justify-center text-role-primary-foreground font-black text-lg shadow-sm">
                A
              </div>
              <div>
                <h1 className="font-serif-luxury font-black text-stone-850 dark:text-stone-100 text-sm leading-tight">Aasa MedChem</h1>
                <span className="text-[9px] text-stone-450 dark:text-stone-500 font-bold uppercase tracking-wider block">Inventory OS</span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* User Info Block */}
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-950/20">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-stone-250 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                <User className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{email}</p>
              </div>
            </div>
            <div className="mt-3 flex">
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRoleBadgeColor()}`}>
                {role} Panel
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-4 py-4 space-y-1.5 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={isActive ? activeLinkClass : inactiveLinkClass}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-850">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all-custom cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-stone-900/50 z-30 transition-opacity"
        />
      )}
    </div>
  );
}
