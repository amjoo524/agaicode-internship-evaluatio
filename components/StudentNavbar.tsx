'use client';
import React, { useState } from 'react';
import {
  Zap,
  LayoutDashboard,
  History,
  BarChart3,
  BookOpen,
  LogOut,
  Bell,
  Check,
  Trash2,
  Clock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export interface StudentNavbarProps {
  userProfile?: any;
  activeTab?: 'dashboard' | 'history' | 'analytics' | 'resources';
  onTabChange?: (tab: 'dashboard' | 'history' | 'analytics' | 'resources') => void;
  onSignOut: () => void;
  notifications?: any[];
  onMarkAllRead?: () => void;
  onClearNotifications?: () => void;
  inQuiz?: boolean;
}

export default function StudentNavbar({
  userProfile,
  activeTab = 'dashboard',
  onTabChange,
  onSignOut,
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  inQuiz = false,
}: StudentNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const name = userProfile?.full_name || userProfile?.email || 'Student';

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 font-sans shadow-2xl">
      {/* Left Side: Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
          <Zap className="w-5 h-5 fill-white" />
        </div>
        <div>
          <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-2 leading-tight">
            SkillPortal <span className="text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">STUDENT</span>
          </span>
        </div>
      </div>

      {/* Center: Navigation Links or Quiz Status */}
      {inQuiz ? (
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Evaluation Session Active • Proctoring System Engaged</span>
        </div>
      ) : (
        <nav className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Test History</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('resources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Resources</span>
          </button>
        </nav>
      )}

      {/* Right Side: Notifications & Profile / Logout */}
      <div className="flex items-center gap-3 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown && onMarkAllRead) onMarkAllRead();
            }}
            className="p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all relative cursor-pointer"
            title="Student Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Student Notification Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-extrabold text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && onMarkAllRead && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-950/50 transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Mark Read
                    </button>
                  )}
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <p className="font-semibold">No notifications yet</p>
                    <p className="text-[11px] text-slate-600 mt-1">Your submission logs and updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 text-xs transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-white leading-snug">{n.title}</h5>
                        <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Tag */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-200 max-w-[120px] truncate">{name}</span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
