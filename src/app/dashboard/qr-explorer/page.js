'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Filter, Download, Loader2, MapPin, Store, User,
  Zap, ExternalLink, ChevronLeft, ChevronRight, X, RefreshCw,
  QrCode, TrendingUp,
} from 'lucide-react';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'most_scanned', label: 'Most Scanned' },
];

const STATUS_OPTIONS = [
  { id: '', label: 'All Statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'INACTIVE', label: 'Inactive' },
];

export default function QRExplorerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    agent: '',
    state: '',
    city: '',
    town: '',
    type: '',
    status: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/analytics/qr-explorer?${params.toString()}`);
      const d = await res.json();
      if (d.success) setData(d);
      else toast.error('Failed to load');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load + when page/filters change
  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'newest').length + (search ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setFilters({
      agent: '', state: '', city: '', town: '', type: '', status: '', sort: 'newest',
    });
    setPage(1);
  };

  const exportCSV = () => {
    if (!data?.rows?.length) {
      toast.error('No data to export');
      return;
    }
    const headers = [
      'QR Code', 'Shop Name', 'Location Type', 'Owner', 'Owner Phone',
      'Town', 'City', 'State', 'Landmark', 'Pincode',
      'GPS Lat', 'GPS Lng', 'Agent', 'Agent Type', 'Total Scans',
      'Status', 'Activated At',
    ];
    const rows = data.rows.map((r) => [
      r.qr_code,
      r.shop_name || '',
      r.location_type || '',
      r.owner_name || '',
      r.owner_phone || '',
      r.town || '',
      r.city || '',
      r.state || '',
      r.landmark || '',
      r.pincode || '',
      r.gps?.latitude || '',
      r.gps?.longitude || '',
      r.agent_name || '',
      r.agent_type || '',
      r.total_scans,
      r.status,
      r.activated_at ? new Date(r.activated_at).toLocaleString('en-IN') : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quttr-qr-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success(`Exported ${data.rows.length} rows`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#FFD700]" />
            QR Explorer
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Search & filter every QR · click any row for full details · {data?.total || 0} total QRs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!data?.rows?.length}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/20 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by shop, code, owner, town, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#FFD700]/40 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <FilterSelect
            label="Agent"
            value={filters.agent}
            onChange={(v) => { setPage(1); setFilters({ ...filters, agent: v }); }}
            options={[
              { id: '', label: 'All Agents' },
              ...(data?.filters?.agents || []).map((a) => ({ id: a._id, label: a.name })),
            ]}
          />
          <FilterSelect
            label="State"
            value={filters.state}
            onChange={(v) => { setPage(1); setFilters({ ...filters, state: v }); }}
            options={[
              { id: '', label: 'All States' },
              ...(data?.filters?.states || []).map((s) => ({ id: s, label: s })),
            ]}
          />
          <FilterSelect
            label="City"
            value={filters.city}
            onChange={(v) => { setPage(1); setFilters({ ...filters, city: v }); }}
            options={[
              { id: '', label: 'All Cities' },
              ...(data?.filters?.cities || []).map((s) => ({ id: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Town"
            value={filters.town}
            onChange={(v) => { setPage(1); setFilters({ ...filters, town: v }); }}
            options={[
              { id: '', label: 'All Towns' },
              ...(data?.filters?.towns || []).map((s) => ({ id: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Type"
            value={filters.type}
            onChange={(v) => { setPage(1); setFilters({ ...filters, type: v }); }}
            options={[
              { id: '', label: 'All Types' },
              ...(data?.filters?.types || []).map((s) => ({ id: s, label: formatType(s) })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => { setPage(1); setFilters({ ...filters, status: v }); }}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(v) => { setPage(1); setFilters({ ...filters, sort: v }); }}
            options={SORT_OPTIONS}
          />
        </div>

        {/* Reset button */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <p className="text-xs text-white/50">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </p>
            <button
              onClick={resetFilters}
              className="text-xs text-[#FFD700] hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
          </div>
        ) : !data?.rows?.length ? (
          <div className="p-12 text-center">
            <QrCode className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No QRs found</p>
            <p className="text-xs text-white/40 mt-1">
              Try changing filters or search terms
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                  <tr>
                    <Th>Code</Th>
                    <Th>Shop / Location</Th>
                    <Th>Town</Th>
                    <Th>City · State</Th>
                    <Th>Agent</Th>
                    <Th className="text-right">Scans</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  
