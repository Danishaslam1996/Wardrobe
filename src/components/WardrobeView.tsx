import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Sparkles,
  Waves,
  Tag,
  Clock,
  DollarSign,
  Trash2,
  CheckCircle2,
  Scissors,
  Edit3,
  Layers,
  Check,
  X,
  Share2,
} from 'lucide-react';
import { WardrobeItem, ClothingCategory, ProfileId } from '../types';
import { PROFILES } from '../data/seedData';
import { soundService } from '../lib/soundHaptics';

interface WardrobeViewProps {
  profileId: ProfileId;
  items: WardrobeItem[];
  onOpenIngestModal: (mode?: 'single' | 'deconstruct') => void;
  onToggleLaundry: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<WardrobeItem>) => void;
  onStyleWithItem?: (item: WardrobeItem) => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  profileId,
  items,
  onOpenIngestModal,
  onToggleLaundry,
  onDeleteItem,
  onUpdateItem,
  onStyleWithItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLaundryOnly, setShowLaundryOnly] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<WardrobeItem | null>(null);

  // Quick Filters
  const [quickFilter, setQuickFilter] = useState<'all' | 'clean' | 'unworn' | 'linen_silk'>('all');

  // Edit Mode inside Detail Sheet
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editBrand, setEditBrand] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const profile = PROFILES[profileId];

  // Dynamic Categories based on Profile
  const categories = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: 'all', label: 'All Items' }];
    if (profileId === 'eesha') {
      list.push(
        { id: 'stoles_scarves', label: 'Stoles & Scarves' },
        { id: 'jewelry', label: 'Jewelry' },
        { id: 'tops', label: 'Tops' },
        { id: 'bottoms', label: 'Bottoms' },
        { id: 'outerwear', label: 'Outerwear' },
        { id: 'shoes', label: 'Shoes' },
        { id: 'bags', label: 'Bags' }
      );
    } else {
      list.push(
        { id: 'tops', label: 'Tops' },
        { id: 'bottoms', label: 'Bottoms' },
        { id: 'outerwear', label: 'Outerwear' },
        { id: 'shoes', label: 'Shoes' },
        { id: 'accessories', label: 'Accessories' }
      );
    }
    return list;
  }, [profileId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.color.primary.toLowerCase().includes(q) ||
        item.material.some((m) => m.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLaundry = showLaundryOnly ? item.isLaundry : true;

      // Quick filter
      let matchesQuick = true;
      if (quickFilter === 'clean') matchesQuick = !item.isLaundry;
      if (quickFilter === 'unworn') matchesQuick = item.wearCount <= 1;
      if (quickFilter === 'linen_silk') {
        matchesQuick = item.material.some(
          (m) =>
            m.toLowerCase().includes('linen') ||
            m.toLowerCase().includes('silk') ||
            m.toLowerCase().includes('cashmere')
        );
      }

      return matchesSearch && matchesCategory && matchesLaundry && matchesQuick;
    });
  }, [items, searchQuery, selectedCategory, showLaundryOnly, quickFilter]);

  const laundryCount = items.filter((i) => i.isLaundry).length;

  const handleOpenDetail = (item: WardrobeItem) => {
    soundService.playTap();
    setSelectedItemForDetail(item);
    setIsEditing(false);
    setEditName(item.name);
    setEditPrice(item.purchasePrice || '');
    setEditBrand(item.brand || '');
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!selectedItemForDetail) return;
    soundService.playTap();
    const updates: Partial<WardrobeItem> = {
      name: editName.trim() || selectedItemForDetail.name,
      purchasePrice: editPrice === '' ? 0 : Number(editPrice),
      brand: editBrand.trim() || undefined,
      notes: editNotes.trim() || undefined,
    };
    onUpdateItem(selectedItemForDetail.id, updates);
    setSelectedItemForDetail({
      ...selectedItemForDetail,
      ...updates,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa] relative select-none">
      {/* Top Banner / Search bar */}
      <div className="p-4 bg-white border-b border-zinc-100 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif tracking-tight text-black flex items-center gap-2">
              <span>{profile.name}'s Wardrobe</span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              {items.length} curated pieces &bull; {laundryCount} in laundry
            </p>
          </div>

          <button
            onClick={() => {
              soundService.playTap();
              setShowLaundryOnly(!showLaundryOnly);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showLaundryOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Laundry ({laundryCount})</span>
          </button>
        </div>

        {/* Search Input & Quick Photo Deconstruct Action */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search color, linen, silk, brand, tag..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-zinc-100/90 text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  soundService.playTap();
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-black"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              soundService.playTap();
              onOpenIngestModal('deconstruct');
            }}
            className="px-3 py-2 rounded-full bg-black text-amber-300 hover:bg-zinc-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
            title="Upload photo of yourself to extract all pieces"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Deconstruct Look</span>
            <span className="sm:hidden">Extract</span>
          </button>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundService.playTap();
                  setSelectedCategory(cat.id);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition-all duration-150 ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Garments */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Scissors className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-black">No clothing pieces found</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                {showLaundryOnly
                  ? 'Your laundry basket is clean. All pieces are ready to wear.'
                  : 'Add clothes via camera roll or live snap to start AI styling.'}
              </p>
            </div>
            {!showLaundryOnly && (
              <button
                onClick={() => {
                  soundService.playTap();
                  onOpenIngestModal('single');
                }}
                className="mt-2 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold"
              >
                Snap First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24">
            {filteredItems.map((item) => {
              const costPerWear =
                item.purchasePrice && item.wearCount > 0
                  ? (item.purchasePrice / item.wearCount).toFixed(1)
                  : item.purchasePrice || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="group bg-white rounded-3xl p-3 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer relative overflow-hidden"
                >
                  {/* Image Container with Transparent Backdrop */}
                  <div className="w-full h-36 rounded-2xl bg-zinc-50 flex items-center justify-center p-2 relative overflow-hidden group-hover:bg-zinc-100/70 transition-colors">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-32 max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Color dot badge */}
                    <div
                      className="absolute top-2 left-2 w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: item.color.hex }}
                      title={`Primary: ${item.color.primary}`}
                    />

                    {/* Laundry Badge */}
                    {item.isLaundry && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Waves className="w-2.5 h-2.5" />
                        Wash
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="mt-2.5 flex flex-col gap-1">
                    <h3 className="text-xs font-bold text-black line-clamp-1 leading-tight">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="capitalize">{item.category.replace('_', ' ')}</span>
                      {item.material[0] && (
                        <span className="font-mono text-zinc-400">{item.material[0]}</span>
                      )}
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-zinc-50 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.wearCount} wears
                      </span>
                      {item.purchasePrice ? (
                        <span className="font-semibold text-zinc-700 font-mono">
                          ${costPerWear}/w
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Ingestion */}
      <button
        onClick={() => {
          soundService.playTap();
          onOpenIngestModal('single');
        }}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:bg-zinc-900 active:scale-95 transition-all duration-200 z-20"
        title="Add New Piece"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Item Detail Bottom Sheet Modal */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[88vh]">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Garment Profile
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold text-zinc-700 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => setSelectedItemForDetail(null)}
                  className="text-xs font-bold text-black px-2.5 py-1 bg-zinc-200 rounded-full"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 no-scrollbar">
              {/* Garment Image Showcase */}
              <div className="w-full h-48 bg-zinc-50 rounded-2xl flex items-center justify-center p-4 relative border border-zinc-100">
                <img
                  src={selectedItemForDetail.imageUrl}
                  alt={selectedItemForDetail.name}
                  className="max-h-40 max-w-[85%] object-contain drop-shadow-md"
                />
              </div>

              {/* Title & Category / Edit Form */}
              {isEditing ? (
                <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/60">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Piece Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Price ($)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Brand / Maker</label>
                      <input
                        type="text"
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        placeholder="e.g. Loro Piana, Zara"
                        className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. Dry clean only, fits slightly oversize"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-2 rounded-xl bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-zinc-800"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-serif font-bold text-black">
                    {selectedItemForDetail.name}
                  </h2>
                  <p className="text-xs text-zinc-500 capitalize">
                    {selectedItemForDetail.subcategory || selectedItemForDetail.category} &bull;{' '}
                    {selectedItemForDetail.color.primary}
                    {selectedItemForDetail.brand && ` &bull; ${selectedItemForDetail.brand}`}
                  </p>
                  {selectedItemForDetail.notes && (
                    <p className="text-xs text-zinc-600 mt-1 italic">
                      "{selectedItemForDetail.notes}"
                    </p>
                  )}
                </div>
              )}

              {/* Badges / Materials */}
              <div className="flex flex-wrap gap-1.5">
                {selectedItemForDetail.material.map((mat, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-semibold"
                  >
                    {mat}
                  </span>
                ))}
                {selectedItemForDetail.vibe.map((v, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-medium capitalize"
                  >
                    {v.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {/* Action: Style With This Item */}
              {onStyleWithItem && (
                <button
                  onClick={() => {
                    soundService.playChime();
                    onStyleWithItem(selectedItemForDetail);
                    setSelectedItemForDetail(null);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-black text-amber-300 hover:bg-zinc-900 active:scale-95 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Style an Outfit with this Piece</span>
                </button>
              )}

              {/* Stats & Wear metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Total Wears</p>
                  <p className="text-base font-bold text-black mt-0.5">
                    {selectedItemForDetail.wearCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Original Price</p>
                  <p className="text-base font-bold text-black mt-0.5">
                    ${selectedItemForDetail.purchasePrice || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Cost / Wear</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">
                    $
                    {selectedItemForDetail.purchasePrice && selectedItemForDetail.wearCount > 0
                      ? (
                          selectedItemForDetail.purchasePrice / selectedItemForDetail.wearCount
                        ).toFixed(1)
                      : selectedItemForDetail.purchasePrice || 0}
                  </p>
                </div>
              </div>

              {/* Laundry Toggle Button */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-black">Laundry Status</p>
                  <p className="text-[11px] text-zinc-500">
                    {selectedItemForDetail.isLaundry
                      ? 'Item is in laundry hamper'
                      : 'Clean and ready to wear'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundService.playTap();
                    onToggleLaundry(selectedItemForDetail.id);
                    setSelectedItemForDetail({
                      ...selectedItemForDetail,
                      isLaundry: !selectedItemForDetail.isLaundry,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedItemForDetail.isLaundry
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  {selectedItemForDetail.isLaundry ? 'In Laundry' : 'Mark Laundry'}
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => {
                  soundService.playTap();
                  if (confirm(`Remove "${selectedItemForDetail.name}" from your wardrobe?`)) {
                    onDeleteItem(selectedItemForDetail.id);
                    setSelectedItemForDetail(null);
                  }
                }}
                className="w-full py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-2xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove from Wardrobe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
