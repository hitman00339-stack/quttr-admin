'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Download, MoreVertical, Star, Eye, EyeOff,
  Trash2, User, Store, MessageSquare, ThumbsUp,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { reviewsService } from '../../../services/reviews';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [page, ratingFilter, visibilityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      loadReviews();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadReviews = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (ratingFilter !== 'all') params.rating = ratingFilter;
    if (visibilityFilter !== 'all') params.hidden = visibilityFilter === 'hidden';
    if (search) params.search = search;

    const result = await reviewsService.getAll(params);
    if (result.success) {
      setReviews(result.reviews || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  };

  const handleToggle = async (review) => {
    setActionLoading(true);
    const result = await reviewsService.toggleVisibility(review._id);
    setActionLoading(false);
    if (result.success) {
      toast.success(result.message);
      loadReviews();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (review) => {
    setActionLoading(true);
    const result = await reviewsService.delete(review._id);
    setActionLoading(false);
    if (result.success) {
      toast.success('Review deleted');
      setModal(null);
      loadReviews();
    } else {
      toast.error(result.message);
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'text-accent-500 fill-accent-500' : 'text-white/10'
          }`}
        />
      ))}
      <span className="text-xs text-white/60 ml-1">{rating}</span>
    </div>
  );

  const columns = [
    {
      key: 'user',
      label: 'Customer',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-blue-700 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium truncate">{r.customer?.name || 'Anonymous'}</p>
            <p className="text-2xs text-white/40">{r.customer?.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'shop',
      label: 'Shop',
      render: (r) => (
        <div className="flex items-center gap-2 text-sm">
          <Store className="w-3.5 h-3.5 text-white/40" />
          <span className="truncate">{r.shop?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => renderStars(r.rating),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (r) => (
        <p className="text-xs text-white/70 max-w-md truncate">
          {r.comment || <span className="text-white/30">No comment</span>}
        </p>
      ),
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (r) => (
        r.isHidden
          ? <span className="chip-error">Hidden</span>
          : <span className="chip-success">Visible</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => (
        <span className="text-xs text-white/40">
          {new Date(r.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (r) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === r._id ? null : r._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openMenu === r._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-48 card p-1.5 z-20 animate-scale-in">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleToggle(r);
                  }}
                  className={`cmd-item w-full ${r.isHidden ? 'text-success' : 'text-warning'}`}
                >
                  {r.isHidden ? <><Eye className="w-4 h-4" /> Show Review</> : <><EyeOff className="w-4 h-4" /> Hide Review</>}
                </button>
                <div className="divider my-1" />
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ review: r });
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
          <h1 className="text-display">Reviews</h1>
          <p className="text-body mt-1">Manage customer reviews · {total} total</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search comments, users, shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="input min-w-[140px]"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        <select
          value={visibilityFilter}
          onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1); }}
          className="input min-w-[140px]"
        >
          <option value="all">All Reviews</option>
          <option value="visible">Visible Only</option>
          <option value="hidden">Hidden Only</option>
        </select>

        <button
          onClick={() => { setSearch(''); setRatingFilter('all'); setVisibilityFilter('all'); setPage(1); }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        emptyMessage="No reviews found."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={() => handleDelete(modal.review)}
          loading={actionLoading}
          title="Delete Review?"
          message="⚠️ Permanently delete this review? This cannot be undone."
          confirmText="Delete Forever"
          variant="danger"
        />
      )}
    </div>
  );
}
