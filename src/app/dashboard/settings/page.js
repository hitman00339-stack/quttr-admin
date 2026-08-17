'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings, User, Shield, Bell, Database, Info,
  LogOut, Server, Mail, Phone, MessageCircle, Globe,
} from 'lucide-react';
import { authService, getAdminData } from '../../../services/api';
import { authService as auth } from '../../../services/auth';

export default function SettingsPage() {
  const [admin, setAdmin] = useState(getAdminData());

  const handleLogout = async () => {
    if (confirm('Logout from admin panel?')) {
      await auth.logout();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-display">Settings</h1>
        <p className="text-body mt-1">Manage your admin preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-accent-500" />
          <h2 className="text-title">Profile</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-2xl font-bold text-surface-100">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{admin?.name || 'Admin'}</p>
            <p className="text-sm text-white/60">{admin?.phone}</p>
            <span className="chip-error mt-1">Super Admin</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent-500" />
          <h2 className="text-title">Security</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-sm font-medium">Session Duration</p>
              <p className="text-xs text-white/50">Auto-logout timer</p>
            </div>
            <span className="chip-success">24 hours</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-sm font-medium">2-Step Verification</p>
              <p className="text-xs text-white/50">OTP + Password required</p>
            </div>
            <span className="chip-success">Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-sm font-medium">Phone Whitelist</p>
              <p className="text-xs text-white/50">Only registered admins can access</p>
            </div>
            <span className="chip-info">2 numbers</span>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-accent-500" />
          <h2 className="text-title">System</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <p className="text-2xs text-white/40 uppercase tracking-wider">Admin Version</p>
            <p className="text-sm font-mono mt-1">v1.0.0</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <p className="text-2xs text-white/40 uppercase tracking-wider">Backend</p>
            <p className="text-sm font-mono mt-1">Render.com</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <p className="text-2xs text-white/40 uppercase tracking-wider">Database</p>
            <p className="text-sm font-mono mt-1">MongoDB Atlas</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <p className="text-2xs text-white/40 uppercase tracking-wider">Region</p>
            <p className="text-sm font-mono mt-1">Mumbai, IN</p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-accent-500" />
          <h2 className="text-title">Support</h2>
        </div>

        <div className="space-y-2">
          <a
            href="mailto:support@quttrr.com"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            <Mail className="w-4 h-4 text-white/60" />
            <span className="text-sm">support@quttrr.com</span>
          </a>
          <a
            href="tel:+919519953149"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            <Phone className="w-4 h-4 text-white/60" />
            <span className="text-sm">+91 95199 53149</span>
          </a>
          <a
            href="https://wa.me/919519953149"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-white/60" />
            <span className="text-sm">WhatsApp Support</span>
          </a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-error/20">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5 text-error" />
          <h2 className="text-title">Session</h2>
        </div>

        <button
          onClick={handleLogout}
          className="btn-brand w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout from Admin Panel
        </button>
      </div>

      {/* Footer */}
      <div className="text-center py-6">
        <p className="text-xs text-white/30">© 2026 QUTTR · Admin Panel v1.0.0</p>
      </div>
    </div>
  );
}
