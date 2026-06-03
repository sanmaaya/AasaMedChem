'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  User,
  ClipboardCheck,
  Tag,
  Shield,
} from 'lucide-react';

type SidebarUser = {
  role?: string;
  name?: string | null;
  email?: string | null;
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center min-w-0 ${compact ? 'gap-2.5' : 'gap-3.5'}`}>
      <div
        className={`shrink-0 rounded-xl bg-role-primary flex items-center justify-center text-role-primary-foreground font-black shadow-sm ${
          compact ? 'h-9 w-9 text-base' : 'h-10 w-10 text-lg'
        }`}
        aria-hidden
      >
        A
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className={`font-serif-luxury font-black text-foreground tracking-tight truncate ${
            compact ? 'text-sm' : 'text-[0.95rem]'
          }`}
        >
          AasaMedChem
        </p>
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em] mt-0.5">
          B2B Workspace
        </p>
      </div>
    </div>
  );
}

function HeaderActions({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center shrink-0 gap-2 sm:gap-2.5 ${className}`}>
      <ThemeToggle />
      <NotificationBell />
    </div>
  );
}

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const role = user?.role || 'buyer';
  const name = user?.name || 'User';
  const email = user?.email || '';

  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Products', href: '/admin/products', icon: Package },
          { name: 'Categories', href: '/admin/categories', icon: Tag },
          { name: 'Quotations', href: '/admin/quotations', icon: FileText },
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
        ];
      case 'seller':
        return [
          { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
          { name: 'Browse Products', href: '/seller/products', icon: Package },
          { name: 'Active Cart', href: '/seller/cart', icon: ShoppingCart },
          { name: 'Manage My Listings', href: '/seller/listings', icon: ClipboardCheck },
          { name: 'Quotations History', href: '/seller/quotations', icon: FileText },
        ];
      case 'buyer':
        return [
          { name: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
          { name: 'Browse Products', href: '/buyer/products', icon: Package },
          { name: 'Active Cart', href: '/buyer/cart', icon: ShoppingCart },
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

  const roleBadgeClass =
    'inline-flex items-center text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide bg-role-accent-light text-role-accent border-role-accent/25';

  const activeLinkClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-role-accent-light text-role-accent border-l-[3px] border-role-border-active transition-all-custom';
  const inactiveLinkClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all-custom';

  return (
    <div className={`theme-${role}`}>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between gap-4 min-h-[4.25rem] px-4 sm:px-5 py-3 max-w-[100vw]">
          <BrandMark compact />
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <HeaderActions />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[min(100vw-1rem,17.5rem)] sm:w-64 border-r border-border bg-card flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 h-full lg:h-screen pt-[4.25rem] lg:pt-0`}
      >
        {/* Desktop brand + actions */}
        <div className="hidden lg:flex flex-col gap-5 px-5 py-7 border-b border-border">
          <BrandMark />
          <div className="flex items-center justify-start gap-2.5">
            <HeaderActions />
          </div>
        </div>

        {/* User profile */}
        <div className="px-5 py-5 border-b border-border bg-secondary/25">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 shrink-0 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-snug">{name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={roleBadgeClass}>{role} panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={isActive ? activeLinkClass : inactiveLinkClass}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                <span className="truncate">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 sm:p-5 border-t border-border mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all-custom cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-foreground/40 backdrop-blur-[1px]"
        />
      )}
    </div>
  );
}
