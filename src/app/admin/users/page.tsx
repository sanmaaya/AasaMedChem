'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Loader2, 
  Shield, 
  Briefcase, 
  ShoppingBag, 
  Check, 
  Mail,
  RefreshCw 
} from 'lucide-react';

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user account');
      }

      setSuccess(`Account for ${name} (${role}) has been created successfully!`);
      // Reset form fields
      setName('');
      setEmail('');
      setPassword('');
      setRole('buyer');
      
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while registering user.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (userRole) => {
    switch (userRole) {
      case 'admin':
        return <Shield className="h-4 w-4 text-slate-700" />;
      case 'seller':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'buyer':
        return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'admin':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'seller':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'buyer':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">User Directory</h2>
        <p className="text-sm text-slate-500 mt-1">Register new Seller representatives, assign Buyer customer accounts, and monitor access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left side: Add User form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:sticky lg:top-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Register New Account</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Admin provisioning panel</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-750 border border-red-200 rounded-lg p-3 text-xs font-semibold mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-xs font-semibold mb-4 flex items-center">
              <Check className="h-4 w-4 text-emerald-600 mr-1.5 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">FULL NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                placeholder="e.g. john@aasa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Choose safe password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">PLATFORM ROLE</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
              >
                <option value="buyer">Buyer (End Customer)</option>
                <option value="seller">Seller (Sales Intermediary)</option>
              </select>
              <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                Admins cannot self-assign roles or create new Admin accounts from the dashboard.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Provisioning...
                </>
              ) : (
                'Create User Account'
              )}
            </button>
          </form>
        </div>

        {/* Right side: Users Directory list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-850 text-base flex items-center">
              <Users className="h-5 w-5 mr-2 text-slate-400" /> System Accounts ({usersList.length})
            </h3>
            <button
              onClick={fetchUsers}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
              title="Refresh directory list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-5">Email</th>
                      <th className="py-3 px-5">Role</th>
                      <th className="py-3 px-5">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-5">
                          <p className="font-bold text-foreground">{usr.name}</p>
                          {usr.role === 'seller' && usr.businessInfo && (() => {
                            try {
                              const biz = JSON.parse(usr.businessInfo);
                              return (
                                <div className="text-[10px] text-muted-foreground bg-secondary/50 border border-border p-2 rounded-lg mt-1.5 space-y-0.5 max-w-xs leading-snug font-medium">
                                  <p><strong className="text-foreground">Agency:</strong> {biz.businessName}</p>
                                  <p><strong className="text-foreground">Licence:</strong> {biz.licenseNumber}</p>
                                  {biz.notes && <p className="line-clamp-2"><strong className="text-foreground">Focus:</strong> {biz.notes}</p>}
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </td>
                        <td className="py-3 px-5 text-foreground/90 font-medium">
                          <span className="flex items-center">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground mr-1.5" /> {usr.email}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border uppercase ${getRoleBadge(usr.role)}`}>
                            {getRoleIcon(usr.role)}
                            <span className="ml-1">{usr.role}</span>
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-400 font-semibold text-xs">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
