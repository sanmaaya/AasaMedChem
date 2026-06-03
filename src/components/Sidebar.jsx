'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
      case 'admin': return 'bg-slate-900 text-slate-100 border-slate-700';
      case 'seller': return 'bg-blue-600 text-white border-blue-500';
      case 'buyer': return 'bg-emerald-600 text-white border-emerald-500';
      default: return 'bg-gray-600 text-white border-gray-500';
    }
  };

  const activeLinkClass = "flex items-center px-4 py-3 rounded-lg text-sm font-semibold bg-role-accent-light text-role-accent border-l-4 border-role-border-active transition-all-custom";
  const inactiveLinkClass = "flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all-custom";

  return (
    <div className={`theme-${role}`}>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 h-16 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-role-primary flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-bold text-slate-800 text-md tracking-tight">Aasa MedChem</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRoleBadgeColor()}`}>
            {role}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 h-full' : '-translate-x-full h-full lg:h-screen'
        } pt-16 lg:pt-0`}
      >
        <div>
          {/* Logo / Header */}
          <div className="hidden lg:flex items-center space-x-3 px-6 py-6 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-role-primary flex items-center justify-center text-white font-black text-xl shadow-sm">
              A
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">Aasa MedChem</h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Inventory Hub</span>
            </div>
          </div>

          {/* User Info Block */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </div>
            <div className="mt-3 flex">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRoleBadgeColor()}`}>
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
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all-custom"
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
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-30 transition-opacity"
        />
      )}
    </div>
  );
}
