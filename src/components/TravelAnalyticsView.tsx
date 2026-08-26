import React, { useState } from 'react';
import {
  Luggage,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Compass,
  DollarSign,
  TrendingUp,
  AlertOctagon,
  Calendar,
  Layers,
  MapPin,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { WardrobeItem, TripCapsule, ProfileId, Outfit } from '../types';
import { requestTripCapsule, TripCapsuleResponse } from '../lib/geminiClient';
import { soundService } from '../lib/soundHaptics';
import { LookbookModal } from './LookbookModal';
import confetti from 'canvas-confetti';

interface TravelAnalyticsViewProps {
  profileId: ProfileId;
  wardrobe: WardrobeItem[];
  trips: TripCapsule[];
  customApiKey?: string;
  onAddTrip: (trip: Omit<TripCapsule, 'id' | 'profileId' | 'createdAt'>) => void;
  onUpdateTripChecklist: (tripId: string, checklistId: string, isPacked: boolean) => void;
}

export const TravelAnalyticsView: React.FC<TravelAnalyticsViewProps> = ({
  profileId,
  wardrobe,
  trips,
  customApiKey,
  onAddTrip,
  onUpdateTripChecklist,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'travel' | 'analytics'>('travel');

  // Travel Builder Form State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [destination, setDestination] = useState('Milan, Italy');
  const [climate, setClimate] = useState<'hot_humid' | 'mild' | 'cold' | 'tropical'>('mild');
  const [tripDays, setTripDays] = useState<number>(5);
  const [tripType, setTripType] = useState('Executive Meetings & Dining');
  const [isGeneratingCapsule, setIsGeneratingCapsule] = useState(false);

  // Active Selected Trip for Packing Checklist
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  // Lookbook Modal State
  const [lookbookOutfit, setLookbookOutfit] = useState<Outfit | null>(null);

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  // Analytics Computations
  const totalItems = wardrobe.length;
  const totalValue = wardrobe.reduce((acc, i) => acc + (i.purchasePrice || 0), 0);
  const totalWears = wardrobe.reduce((acc, i) => acc + i.wearCount, 0);
  const avgCostPerWear = totalWears > 0 ? (totalValue / totalWears).toFixed(1) : '0';

  // Most worn staples (sorted descending by wearCount)
  const staples = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount).slice(0, 4);

  // Neglected pieces (wearCount <= 2)
  const neglected = [...wardrobe].filter((i) => i.wearCount <= 2).slice(0, 4);

  const handleGenerateCapsule = async () => {
    soundService.playTap();
    setIsGeneratingCapsule(true);
    try {
      const capsuleData: TripCapsuleResponse = await requestTripCapsule(
        {
          profileId,
          destination,
          climate,
          days: tripDays,
          tripType,
          availableItems: wardrobe.filter((w) => !w.isLaundry),
        },
        customApiKey
      );

      // Build checklist
      const chosenItems = wardrobe.filter((w) => capsuleData.capsuleItemIds.includes(w.id));
      const checklist = [
        ...chosenItems.map((item) => ({
          id: `check-${item.id}`,
          title: item.name,
          isPacked: false,
        })),
        ...capsuleData.packingChecklistItems.map((title, i) => ({
          id: `custom-check-${i}`,
          title,
          isPacked: false,
          isCustomItem: true,
        })),
      ];

      onAddTrip({
        title: `${destination} Capsule`,
        destination,
        climate,
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        days: tripDays,
        rationale: capsuleData.rationale,
        wardrobeItemIds: capsuleData.capsuleItemIds,
        dailyOutfits: capsuleData.dailyOutfits,
        packingChecklist: checklist,
      });

      soundService.playChime();
      confetti({ particleCount: 50, spread: 60 });
      setIsBuilderOpen(false);
    } catch (err: any) {
      console.warn('Fallback trip capsule generation:', err);
      const chosen = wardrobe.slice(0, 8);
      onAddTrip({
        title: `${destination} Capsule`,
        destination,
        climate,
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        days: tripDays,
        rationale: `Hand-selected compact capsule tailored for ${destination} travel with maximum interchangeability.`,
        wardrobeItemIds: chosen.map((c) => c.id),
        dailyOutfits: [
          {
            dayNumber: 1,
            itemIds: chosen.slice(0, 4).map((c) => c.id),
            vibe: 'smart_casual',
            description: 'Arrival & Light Exploration',
          },
          {
            dayNumber: 2,
            itemIds: chosen.slice(2, 6).map((c) => c.id),
            vibe: 'formal',
            description: 'VIP Dinner & Terrace Walk',
          },
        ],
        packingChecklist: chosen.map((item) => ({
          id: `check-${item.id}`,
          title: item.name,
          isPacked: false,
        })),
      });
      soundService.playChime();
      setIsBuilderOpen(false);
    } finally {
      setIsGeneratingCapsule(false);
    }
  };

  const handleCopyChecklist = () => {
    if (!activeTrip) return;
    soundService.playTap();
    const text = `✈️ ${activeTrip.title} (${activeTrip.destination})\n` +
      `------------------------------------\n` +
      activeTrip.packingChecklist.map((c) => `[${c.isPacked ? 'X' : ' '}] ${c.title}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2000);
  };

  const openLookbookForTripDay = (dailyOutfit: any) => {
    soundService.playTap();
    setLookbookOutfit({
      id: `trip-day-${dailyOutfit.dayNumber}`,
      profileId,
      name: `Day ${dailyOutfit.dayNumber}: ${dailyOutfit.description}`,
      type: 'dressing_room',
      itemIds: dailyOutfit.itemIds,
      vibe: dailyOutfit.vibe || 'smart_casual',
      isFavorite: true,
      createdAt: new Date().toISOString(),
      wearCount: 0,
      stylingNotes: `Styled for ${activeTrip?.destination || 'travel'}: ${dailyOutfit.description}`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa] relative select-none">
      {/* Sub-tabs: AI Travel vs Wardrobe Analytics */}
      <div className="p-3 bg-white border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="bg-zinc-100 p-1 rounded-full flex items-center">
          <button
            onClick={() => {
              soundService.playTap();
              setActiveSubTab('travel');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
              activeSubTab === 'travel'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Luggage className="w-3.5 h-3.5" />
            <span>Travel Capsules</span>
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setActiveSubTab('analytics');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
              activeSubTab === 'analytics'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cost-Per-Wear Stats</span>
          </button>
        </div>

        {activeSubTab === 'travel' && (
          <button
            onClick={() => {
              soundService.playTap();
              setIsBuilderOpen(true);
            }}
            className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Trip</span>
          </button>
        )}
      </div>

      {activeSubTab === 'travel' ? (
        /* ================= TRAVEL CAPSULES SUB-TAB ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
          {/* Trip Selector Carousel */}
          {trips.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {trips.map((trip) => {
                const isSelected = (activeTrip?.id || '') === trip.id;
                const packedCount = trip.packingChecklist.filter((c) => c.isPacked).length;
                const totalCount = trip.packingChecklist.length;

                return (
                  <button
                    key={trip.id}
                    onClick={() => {
                      soundService.playTap();
                      setSelectedTripId(trip.id);
                    }}
                    className={`p-3 rounded-2xl border text-left shrink-0 w-44 transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                      <MapPin className="w-3 h-3" />
                      <span>{trip.destination}</span>
                    </div>
                    <h3 className="text-xs font-bold font-serif truncate mt-0.5">{trip.title}</h3>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span>{trip.days} Days</span>
                      <span className="font-mono">{packedCount}/{totalCount} Packed</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-3xl border border-zinc-100 text-center space-y-2">
              <Compass className="w-8 h-8 text-zinc-300 mx-auto" />
              <h3 className="text-xs font-bold text-black">No Travel Capsules Yet</h3>
              <p className="text-[11px] text-zinc-400">
                Generate a multi-day wardrobe capsule with smart packing checklists for your upcoming trip.
              </p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="mt-2 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Build Trip Capsule</span>
              </button>
            </div>
          )}

          {/* Active Trip Details */}
          {activeTrip && (
            <div className="space-y-4">
              {/* Rationale Banner */}
              <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Capsule Logic ({activeTrip.climate.replace('_', ' ')})
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {activeTrip.wardrobeItemIds.length} Core Pieces
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">{activeTrip.rationale}</p>
              </div>

              {/* Capsule Wardrobe Pieces */}
              <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Capsule Inventory ({activeTrip.wardrobeItemIds.length} Items)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {activeTrip.wardrobeItemIds.map((itemId) => {
                    const item = wardrobe.find((w) => w.id === itemId);
                    if (!item) return null;
                    return (
                      <div
                        key={item.id}
                        className="p-2 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center text-center"
                      >
                        <img src={item.imageUrl} alt={item.name} className="h-12 object-contain" />
                        <span className="text-[9px] font-semibold text-black truncate w-full mt-1">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day-by-Day Outfits */}
              {activeTrip.dailyOutfits?.length > 0 && (
                <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Daily Itinerary Outfits
                  </h3>
                  <div className="space-y-2">
                    {activeTrip.dailyOutfits.map((day) => (
                      <div
                        key={day.dayNumber}
                        className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                              Day {day.dayNumber}
                            </span>
                            <span className="text-xs font-bold text-black">{day.description}</span>
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {day.itemIds.map((id) => {
                              const it = wardrobe.find((w) => w.id === id);
                              if (!it) return null;
                              return (
                                <img
                                  key={it.id}
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="w-6 h-6 object-contain rounded-md bg-white border border-zinc-200"
                                  title={it.name}
                                />
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => openLookbookForTripDay(day)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 text-black text-[11px] font-bold border border-zinc-200 flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Lookbook</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packing Checklist */}
              <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Luggage Packing Checklist
                  </h3>
                  <button
                    onClick={handleCopyChecklist}
                    className="text-[10px] font-bold text-zinc-600 hover:text-black flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-full"
                  >
                    {copiedChecklist ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedChecklist ? 'Copied' : 'Copy List'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {activeTrip.packingChecklist.map((checkItem) => (
                    <button
                      key={checkItem.id}
                      onClick={() => {
                        soundService.playTap();
                        onUpdateTripChecklist(activeTrip.id, checkItem.id, !checkItem.isPacked);
                      }}
                      className={`w-full p-2.5 rounded-2xl text-left text-xs flex items-center gap-2.5 transition-all ${
                        checkItem.isPacked
                          ? 'bg-zinc-50 text-zinc-400 line-through'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-black font-semibold'
                      }`}
                    >
                      {checkItem.isPacked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                      )}
                      <span className="truncate">{checkItem.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= WARDROBE ANALYTICS SUB-TAB ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3.5 rounded-3xl border border-zinc-100 text-center shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Closet Value</p>
              <p className="text-base font-bold text-black mt-1 font-mono">${totalValue}</p>
            </div>
            <div className="bg-white p-3.5 rounded-3xl border border-zinc-100 text-center shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Wears</p>
              <p className="text-base font-bold text-black mt-1 font-mono">{totalWears}</p>
            </div>
            <div className="bg-white p-3.5 rounded-3xl border border-zinc-100 text-center shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Avg Cost/Wear</p>
              <p className="text-base font-bold text-emerald-600 mt-1 font-mono">
                ${avgCostPerWear}
              </p>
            </div>
          </div>

          {/* Most Worn Staples */}
          <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Highest Rotation Staples
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {staples.map((it) => {
                const cpw = (it.purchasePrice && it.wearCount > 0
                  ? it.purchasePrice / it.wearCount
                  : 0
                ).toFixed(1);
                return (
                  <div
                    key={it.id}
                    className="p-2.5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-2"
                  >
                    <img src={it.imageUrl} alt={it.name} className="w-10 h-10 object-contain" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-black truncate">{it.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {it.wearCount} wears &bull; ${cpw}/w
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Neglected Closet Items */}
          <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
              Neglected Pieces (Under 2 Wears)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {neglected.map((it) => (
                <div
                  key={it.id}
                  className="p-2.5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-2"
                >
                  <img src={it.imageUrl} alt={it.name} className="w-10 h-10 object-contain" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-black truncate">{it.name}</p>
                    <p className="text-[10px] text-amber-600 font-semibold">
                      Only worn {it.wearCount} times
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capsule Trip Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif italic text-base font-bold text-black">
              AI Travel Capsule Builder
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Destination City
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Kyoto, Japan / Milan, Italy"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Climate
                </label>
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
                >
                  <option value="mild">Mild (18-24°C)</option>
                  <option value="hot_humid">Hot & Humid (30°C+)</option>
                  <option value="cold">Cold / Winter (5-12°C)</option>
                  <option value="tropical">Tropical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Trip Days
                </label>
                <input
                  type="number"
                  value={tripDays}
                  onChange={(e) => setTripDays(Number(e.target.value))}
                  min={2}
                  max={14}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Trip Focus / Purpose
              </label>
              <input
                type="text"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                placeholder="e.g. Cultural Sightseeing & Fine Dining"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCapsule}
                disabled={isGeneratingCapsule}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isGeneratingCapsule ? 'Optimizing...' : 'Build Capsule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lookbook Modal */}
      {lookbookOutfit && (
        <LookbookModal
          isOpen={Boolean(lookbookOutfit)}
          onClose={() => setLookbookOutfit(null)}
          outfit={lookbookOutfit}
          allWardrobeItems={wardrobe}
          profileId={profileId}
        />
      )}
    </div>
  );
};
