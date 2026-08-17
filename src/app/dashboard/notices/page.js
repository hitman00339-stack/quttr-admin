'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, Send, Trash2, Users, Store, Info,
  AlertTriangle, CheckCircle2, Sparkles, Calendar,
} from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';
import { noticesService } from '../../../services/notices';

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    audience: 'all',
    priority: 'normal',
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    const result = await noticesService.getAll();
    if (result.success) setNotices(result.notices);
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error('Title and message required');
    }

    setSending(true);
    const result = await noticesService.send(form);
    setSending(false);

    if (result.success) {
      toast.success('Notice broadcasted successfully!');
      setForm({ title: '', message: '', type: 'info', audience: 'all', priority: 'normal' });
      setShowForm(false);
      loadNotices();
    } else {
      toast.error(result.message || 'Failed to send');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    const result = await noticesService.delete(deleteModal._id);
    if (result.success) {
      toast.success('Notice deleted');
      setDeleteModal(null);
      loadNotices();
    } else {
      toast.error(result.message);
    }
  };

  const typeIcons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    announcement: Sparkles,
  };

  const typeColors = {
    info: 'from-info to-blue-700',
    success: 'from-success to-emerald-700',
    warning: 'from-warning to-amber-700',
    announcement: 'from-accent-500 to-accent-700',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display">Notices</h1>
          <p className="text-body mt-1">Broadcast announcements to users · {notices.length} sent</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-accent"
        >
          <Send className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Notice'}
        </button>
      </div>

      {/* Compose Form */}
      {showForm && (
        <div className="card p-6 animate-in">
          <h2 className="text-title mb-4">Compose Notice</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="announcement">Announcement (Gold)</option>
                </select>
              </div>

              <div>
                <label className="label">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="input"
                >
                  <option value="all">All Users</option>
                  <option value="customers">Customers Only</option>
                  <option value="shopOwners">Shop Owners Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., New features available!"
                className="input"
                maxLength={100}
              />
              <p className="label-hint">{form.title.length}/100 characters</p>
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement here..."
                className="input min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="label-hint">{form.message.length}/500 characters</p>
            </div>

            <div>
              <label className="label">Priority</label>
              <div className="flex gap-2">
                {['low', 'normal', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`btn ${form.priority === p ? 'btn-accent' : 'btn-outline'} flex-1`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline flex-1"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !form.title || !form.message}
                className="btn-accent flex-1"
              >
                {sending ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Broadcast Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-40" />)
        ) : notices.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Bell className="w-8 h-8 mx-auto text-white/20 mb-3" />
            <p className="text-body">No notices sent yet</p>
            <p className="text-caption mt-1">Create your first announcement</p>
          </div>
        ) : (
          notices.map((notice) => {
            const Icon = typeIcons[notice.type] || Info;
            return (
              <div key={notice._id} className="card p-5 hover:border-white/[0.12] transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[notice.type]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{notice.title}</h3>
                    <p className="text-2xs text-white/40 mt-0.5 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(notice.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteModal(notice)}
                    className="btn-icon text-white/40 hover:text-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm text-white/70 mb-3 line-clamp-3">{notice.message}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip-neutral">
                    {notice.audience === 'all' ? <><Users className="w-3 h-3" /> All</> :
                     notice.audience === 'customers' ? <><Users className="w-3 h-3" /> Customers</> :
                     <><Store className="w-3 h-3" /> Owners</>}
                  </span>
                  <span className={`chip ${
                    notice.priority === 'urgent' ? 'chip-error' :
                    notice.priority === 'high' ? 'chip-warning' :
                    'chip-info'
                  }`}>
                    {notice.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deleteModal && (
        <ConfirmModal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          title="Delete Notice?"
          message="Permanently delete this notice? This cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
