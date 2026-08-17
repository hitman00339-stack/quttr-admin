'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Plus, MoreVertical, Package, Edit, Trash2,
  Eye, EyeOff, TrendingUp, ShoppingBag, Users,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { productsService } from '../../../services/products';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [page, categoryFilter, audienceFilter, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      load();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (audienceFilter !== 'all') params.audience = audienceFilter;
    if (activeFilter !== 'all') params.active = activeFilter;
    if (search) params.search = search;

    const result = await productsService.getAll(params);
    if (result.success) {
      setProducts(result.products || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  };

  const handleToggle = async (product) => {
    const result = await productsService.toggle(product._id);
    if (result.success) {
      toast.success(result.message);
      load();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const result = await productsService.delete(modal._id);
    setActionLoading(false);
    if (result.success) {
      toast.success('Product deleted');
      setModal(null);
      load();
    } else {
      toast.error(result.message);
    }
  };

  const audienceColors = {
    customer: 'chip-info',
    barber: 'chip-accent',
    both: 'chip-success',
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.thumbnail || p.images?.[0] ? (
            <img src={p.thumbnail || p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{p.name}</p>
            <p className="text-2xs text-white/40 truncate">
              {p.brand && <span>{p.brand} · </span>}
              {p.category?.replace('_', ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (p) => (
        <div>
          <p className="font-semibold text-white">₹{p.price}</p>
          {p.originalPrice > p.price && (
            <p className="text-2xs text-white/40 line-through">₹{p.originalPrice}</p>
          )}
        </div>
      ),
    },
    {
      key: 'audience',
      label: 'For',
      render: (p) => (
        <span className={audienceColors[p.audience] || 'chip-neutral'}>
          {p.audience === 'both' ? 'All' : p.audience}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (p) => (
        <span className={p.stock === 0 ? 'text-error' : p.stock < 10 ? 'text-warning' : 'text-white'}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'sales',
      label: 'Sales',
      render: (p) => (
        <div className="text-xs">
          <div className="text-white">{p.totalSales || 0} sold</div>
          <div className="text-white/40">{p.totalViews || 0} views</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <div className="flex flex-col gap-1">
          {p.isActive ? (
            <span className="chip-success">Active</span>
          ) : (
            <span className="chip-error">Inactive</span>
          )}
          {p.isFeatured && <span className="chip-accent">Featured</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (p) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === p._id ? null : p._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenu === p._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-48 card p-1.5 z-20 animate-scale-in">
                <Link
                  href={`/dashboard/products/${p._id}`}
                  className="cmd-item"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleToggle(p);
                  }}
                  className={`cmd-item w-full ${p.isActive ? 'text-warning' : 'text-success'}`}
                >
                  {p.isActive ? <><EyeOff className="w-4 h-4" /> Deactivate</> : <><Eye className="w-4 h-4" /> Activate</>}
                </button>
                <div className="divider my-1" />
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal(p);
                  }}
                  className="cmd-item w-full text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display">Products</h1>
          <p className="text-body mt-1">Products for customers & barbers · {total} total</p>
        </div>

        <Link href="/dashboard/products/new" className="btn-accent">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input min-w-[160px]"
        >
          <option value="all">All Categories</option>
          <option value="hair_care">Hair Care</option>
          <option value="beard_care">Beard Care</option>
          <option value="tools">Tools</option>
          <option value="fragrance">Fragrance</option>
          <option value="wellness">Wellness</option>
          <option value="equipment">Equipment</option>
          <option value="supplies">Supplies</option>
          <option value="furniture">Furniture</option>
          <option value="care_products">Care Products</option>
          <option value="sanitization">Sanitization</option>
        </select>

        <select
          value={audienceFilter}
          onChange={(e) => { setAudienceFilter(e.target.value); setPage(1); }}
          className="input min-w-[140px]"
        >
          <option value="all">All Audiences</option>
          <option value="customer">Customer App</option>
          <option value="barber">Business App</option>
          <option value="both">Both Apps</option>
        </select>

        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="input min-w-[120px]"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => {
            setSearch(''); setCategoryFilter('all'); setAudienceFilter('all');
            setActiveFilter('all'); setPage(1);
          }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found. Add your first product!"
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={handleDelete}
          loading={actionLoading}
          title="Delete Product?"
          message={`⚠️ Permanently delete "${modal.name}"? This cannot be undone.`}
          confirmText="Delete Forever"
          variant="danger"
        />
      )}
    </div>
  );
}
