'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground transition cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
            <h4 className="font-bold text-sm text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs font-medium">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.isRead ? 'bg-role-accent-light/40' : ''}`}>
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? 'bg-role-accent' : 'bg-transparent'}`} />
                  <div>
                    <p className="text-xs font-bold text-foreground leading-snug">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
