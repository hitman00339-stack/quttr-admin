'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Save, Loader2, Package, Plus, X,
  Upload, Star, TrendingUp, Award,
} from 'lucide-react';
import { productsService } from '../../../../services/products';

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    category: 'hair_care',
    audience: 'customer',
    brand: '',
    sku: '',
    stock: 0,
    images: [],
    thumbnail: '',
    tags: [],
    keywords: [],
    isActive: true,
    isFeatured: false,
    isTrending: false,
    isNew: true,
    deliveryDays: 3,
    freeDelivery: false,
    deliveryCharge: 50,
  });

  const [imageInput, setImageInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEdit) load();
  }, [params.id]);

  const load = async () => {
    setLoading(true);
    const result = await productsService.getById(params.id);
    if (result.success) {
      setForm({ ...form, ...result.product });
    } else {
      toast.error('Product not found');
      router.push('/dashboard/products');
    }
    setLoading(false);
  };

  const addImage = () => {
    if (!imageInput.trim()) return;
    const images = [...(form.images || []), imageInput.trim()];
    setForm({ ...form, images, thumbnail: form.thumbnail || imageInput.trim() });
    setImageInput('');
  };

  const removeImage = (idx) => {
    const images = form.images.filter((_, i) => i !== idx);
    setForm({ ...form, images });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] });
    setTagInput('');
  };

  const removeTag = (idx) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price) {
      return toast.error('Name, description, and price are required');
    }

    setSaving(true);
    const data = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
      deliveryDays: Number(form.deliveryDays),
      deliveryCharge: Number(form.deliveryCharge),
    };

    const result = isEdit
      ? await productsService.update(params.id, data)
      : await productsService.create(data);

    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      router.push('/dashboard/products');
    } else {
      toast.error(result.message || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="btn-icon">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-display">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-body mt-1">
            {isEdit ? 'Update product details' : 'Add a new product for sale'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title flex items-center gap-2">
            <Package className="w-5 h-5 text-accent-500" />
            Basic Information
          </h2>

          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Premium Beard Oil 50ml"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Short Description</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="One-line summary for cards"
              className="input"
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">Full Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed product description..."
              className="input min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g., Beardo"
                className="input"
              />
            </div>
            <div>
              <label className="label">SKU (Unique Code)</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g., BEA-OIL-50"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Category & Audience */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title">Category & Audience</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                <option value="hair_care">Hair Care</option>
                <option value="beard_care">Beard Care</option>
                <option value="tools">Tools</option>
                <option value="fragrance">Fragrance</option>
                <option value="wellness">Wellness</option>
                <option value="equipment">Equipment (Barbers)</option>
                <option value="supplies">Supplies (Barbers)</option>
                <option value="furniture">Furniture (Barbers)</option>
                <option value="care_products">Care Products</option>
                <option value="sanitization">Sanitization</option>
              </select>
            </div>

            <div>
              <label className="label">Shown To *</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="input"
              >
                <option value="customer">Customer App Only</option>
                <option value="barber">Business App Only</option>
                <option value="both">Both Apps</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title">Pricing & Stock</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="299"
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="label">Original Price (₹)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="499"
                className="input"
                min="0"
              />
              <p className="label-hint">If higher than price, shows as discount</p>
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="100"
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-500" />
            Product Images
          </h2>

          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="https://image-url.jpg"
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <button type="button" onClick={addImage} className="btn-outline">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {form.images?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-full aspect-square rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {form.thumbnail === img && (
                    <span className="absolute bottom-1 left-1 chip-accent text-2xs">Thumbnail</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {form.images?.length > 0 && (
            <div>
              <label className="label">Set Thumbnail</label>
              <select
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                className="input"
              >
                {form.images.map((img, i) => (
                  <option key={i} value={img}>Image {i + 1}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title">Tags & Keywords</h2>

          <div>
            <label className="label">Tags (for search)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g., organic, natural"
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="btn-outline">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {form.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="chip-neutral flex items-center gap-1.5">
                    {tag}
                    <button type="button" onClick={() => removeTag(i)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delivery */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title">Delivery</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Delivery Days</label>
              <input
                type="number"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                className="input"
                min="1"
              />
            </div>
            <div>
              <label className="label">Delivery Charge (₹)</label>
              <input
                type="number"
                value={form.deliveryCharge}
                onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                className="input"
                min="0"
                disabled={form.freeDelivery}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.freeDelivery}
              onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Free Delivery</span>
          </label>
        </div>

        {/* Flags */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title">Visibility & Flags</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <Star className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-sm">Featured</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-sm">Trending</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <Award className="w-3.5 h-3.5 text-success" />
              <span className="text-sm">New</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-4">
          <Link href="/dashboard/products" className="btn-outline flex-1">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-accent flex-[2]">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
