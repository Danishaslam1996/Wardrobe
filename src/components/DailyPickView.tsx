import { processSelectedFile } from '../lib/imageUtils';
import React, { useState } from 'react';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Sun,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  ThumbsUp,
  Shirt,
  Info,
  User,
  Eye,
  X,
  Share2,
  Plus,
  BookOpen,
} from 'lucide-react';
import {
  WardrobeItem,
  Outfit,
  CalendarDayPlan,
  ProfileId,
  ClothingCategory,
} from '../types';
import { requestDailyPick, DailyPickResponse } from '../lib/geminiClient';
import { WeatherData } from '../store/useWardrobeStore';
import { BodyVisualizer } from './BodyVisualizer';
import { LookbookModal } from './LookbookModal';
import { soundService } from '../lib/soundHaptics';
import confetti from 'canvas-confetti';

interface DailyPickViewProps {
  profileId: ProfileId;
  cleanItems: WardrobeItem[];
  savedOutfits: Outfit[];
  calendarPlans: CalendarDayPlan[];
  weather?: WeatherData;
  customApiKey?: string;
  onSetCalendarPlan: (plan: Omit<CalendarDayPlan, 'profileId'>) => void;
  onLogSelfieOotd: (date: string, selfieUrl: string, drapeNotes?: string) => void;
  onSaveOutfit: (outfit: Omit<Outfit, 'id' | 'profileId' | 'createdAt' | 'wearCount'>) => Outfit;
}

export const DailyPickView: React.FC<DailyPickViewProps> = ({
  profileId,
  cleanItems,
  savedOutfits,
  calendarPlans,
  weather,
  customApiKey,
  onSetCalendarPlan,
  onLogSelfieOotd,
  onSaveOutfit,
}) => {
  const safeWeather: WeatherData = weather || {
    city: 'Abu Dhabi',
    tempC: 33,
    humidity: 60,
    condition: 'Warm & Sunny',
    isCustom: false,
  };
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'calendar'>('daily');

  // Context Inputs for AI Stylist
  const [occasion, setOccasion] = useState('Executive Work & Client Lunch');
  const [meetingWith, setMeetingWith] = useState('Founding Partners & VIPs');
  const [locationType, setLocationType] = useState('AC Indoor Dining & Brief Outdoor Terrace Walk');
  const [extraNotes, setExtraNotes] = useState('');

  // AI Daily Pick State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPick, setGeneratedPick] = useState<DailyPickResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Lookbook Modal State
  const [lookbookOutfit, setLookbookOutfit] = useState<Outfit | null>(null);

  // Body Visualizer Modal State
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [bodyPreviewItemIds, setBodyPreviewItemIds] = useState<string[]>([]);
  const [bodyPreviewOutfitName, setBodyPreviewOutfitName] = useState('');

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 24)); // August 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-08-24');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Selfie OOTD Upload State
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieDrapeNotes, setSelfieDrapeNotes] = useState('');
  const [selfieImagePreview, setSelfieImagePreview] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const todayStr = '2026-08-24';
  const todayPlan = calendarPlans.find((p) => p.date === todayStr);
  const selectedDatePlan = calendarPlans.find((p) => p.date === selectedCalendarDate);

  const openBodyPreview = (itemIds: string[], outfitName: string) => {
    soundService.playTap();
    setBodyPreviewItemIds(itemIds);
    setBodyPreviewOutfitName(outfitName);
    setIsBodyModalOpen(true);
  };

  const handleGenerateDailyPick = async () => {
    soundService.playTap();
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const result = await requestDailyPick(
        {
          profileId,
          weather: {
            tempC: safeWeather.tempC,
            humidity: safeWeather.humidity,
            condition: safeWeather.condition,
            location: safeWeather.city,
          },
          context: {
            occasion,
            meetingWith,
            locationType,
            notes: extraNotes,
          },
          availableItems: cleanItems,
        },
        customApiKey
      );

      setGeneratedPick(result);
      soundService.playChime();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#000000', '#D4AF37', '#9E7B7A'],
      });
    } catch (err: any) {
      console.warn('AI Daily Pick fallback:', err);
      // Construct an intelligent fallback using the user's closet
      const tops = cleanItems.filter((i) => i.category === 'tops');
      const bottoms = cleanItems.filter((i) => i.category === 'bottoms');
      const outerwear = cleanItems.filter((i) => i.category === 'outerwear');
      const stoles = cleanItems.filter((i) => i.category === 'stoles_scarves');
      const jewelry = cleanItems.filter((i) => i.category === 'jewelry');
      const shoes = cleanItems.filter((i) => i.category === 'shoes');

      const fallbackIds: string[] = [];
      if (profileId === 'eesha') {
        if (stoles[0]) fallbackIds.push(stoles[0].id);
        if (jewelry[0]) fallbackIds.push(jewelry[0].id);
      }
      if (tops[0]) fallbackIds.push(tops[0].id);
      if (bottoms[0]) fallbackIds.push(bottoms[0].id);
      if (outerwear[0]) fallbackIds.push(outerwear[0].id);
      if (shoes[0]) fallbackIds.push(shoes[0].id);

      setGeneratedPick({
        name: profileId === 'eesha' ? 'Rose Silk & Modest Duster Curation' : 'Sharpened Slate Tailored Ensemble',
        selectedItemIds: fallbackIds,
        vibe: 'smart_casual',
        reasoning: `Optimally layered for ${safeWeather.city}'s ${safeWeather.tempC}°C climate with seamless transition into air-conditioned interior dining.`,
        weatherFitExplanation: `Breathable natural fibers prevent overheating outdoors while structured layers protect against brisk indoor AC.`,
        stylingTips: [
          profileId === 'eesha'
            ? 'Drape the rose-taupe silk wrap loosely over the shoulders and let baroque drop earrings catch natural light.'
            : 'Keep collar crisp with sleeves unrolled and clean court sneakers.',
        ],
      });
      soundService.playChime();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToCalendar = (outfitIds: string[], outfitName: string) => {
    soundService.playChime();
    const saved = onSaveOutfit({
      name: outfitName,
      type: 'dressing_room',
      itemIds: outfitIds,
      vibe: (generatedPick?.vibe as any) || 'smart_casual',
      isFavorite: true,
      stylingNotes: generatedPick?.reasoning,
    });

    onSetCalendarPlan({
      date: todayStr,
      outfitId: saved?.id || 'outfit-today',
      customNotes: `${occasion} with ${meetingWith}`,
      weatherSnapshot: {
        tempC: safeWeather.tempC,
        humidity: safeWeather.humidity,
        condition: safeWeather.condition,
        location: safeWeather.city,
      },
      context: {
        occasion,
        meetingWith,
        locationType,
      },
    });

    confetti({ particleCount: 40, spread: 50 });
  };

  const handleOpenLookbookForGenerated = () => {
    if (!generatedPick) return;
    soundService.playTap();
    setLookbookOutfit({
      id: 'daily-generated',
      profileId,
      name: generatedPick.name,
      type: 'dressing_room',
      itemIds: generatedPick.selectedItemIds,
      vibe: (generatedPick.vibe as any) || 'smart_casual',
      isFavorite: true,
      createdAt: new Date().toISOString(),
      wearCount: 0,
      stylingNotes: generatedPick.reasoning,
    });
  };

  const handleAssignSavedOutfitToDate = (outfit: Outfit) => {
    soundService.playChime();
    onSetCalendarPlan({
      date: selectedCalendarDate,
      outfitId: outfit.id,
      customNotes: outfit.name,
      weatherSnapshot: {
        tempC: safeWeather.tempC,
        humidity: safeWeather.humidity,
        condition: safeWeather.condition,
        location: safeWeather.city,
      },
    });
    setIsAssignModalOpen(false);
    confetti({ particleCount: 30, spread: 45 });
  };

  const handleSelfieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.playCameraShutter();
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processSelectedFile(file);
        setSelfieImagePreview(base64);
      } catch (err) {
        console.error("Selfie load failed", err);
      }
    }
  };

  const handleSaveSelfieOotd = () => {
    if (selfieImagePreview) {
      soundService.playChime();
      onLogSelfieOotd(selectedCalendarDate, selfieImagePreview, selfieDrapeNotes);
      setIsSelfieModalOpen(false);
      setSelfieImagePreview('');
      setSelfieDrapeNotes('');
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  // Calendar Day Rendering Calculation (August 2026)
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const plan = calendarPlans.find((p) => p.date === dateKey);
    return { dayNum: d, dateKey, plan };
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa] relative select-none">
      {/* Sub-tabs: AI Daily Stylist vs Monthly Calendar */}
      <div className="p-3 bg-white border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="bg-zinc-100 p-1 rounded-full flex items-center">
          <button
            onClick={() => {
              soundService.playTap();
              setActiveSubTab('daily');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
              activeSubTab === 'daily'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Stylist Pick</span>
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setActiveSubTab('calendar');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Visual Calendar</span>
          </button>
        </div>

        {/* Weather Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-amber-50/80 px-2.5 py-1 rounded-full border border-amber-100">
          <Sun className="w-3 h-3 text-amber-500" />
          <span>
            {safeWeather.city.split(',')[0]} {safeWeather.tempC}°C / {safeWeather.humidity}%H
          </span>
        </div>
      </div>

      {activeSubTab === 'daily' ? (
        /* ================= AI DAILY PICK SUB-TAB ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
          {/* Profile Logic Banner */}
          <div className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-xs flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-1.5" />
            <div className="text-xs">
              <p className="font-bold text-black">
                {profileId === 'eesha' ? "Eesha's Modest Luxury Engine" : "Danish's Tailored Crisp Engine"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {profileId === 'eesha'
                  ? 'Mandatory inclusion of silk/cashmere stoles & fine jewelry on every generated look.'
                  : 'Sharp structured tailoring, crisp shirting, and clean minimalist silhouettes.'}
              </p>
            </div>
          </div>

          {/* Context Inputs Card */}
          <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Today's Context & Schedule
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-zinc-400" />
                  Occasion / Agenda
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:border-black"
                  placeholder="e.g. Executive Presentation & Dinner"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-zinc-400" />
                    Meeting With
                  </label>
                  <input
                    type="text"
                    value={meetingWith}
                    onChange={(e) => setMeetingWith(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-black focus:outline-none focus:border-black"
                    placeholder="e.g. VIP Clients"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    Venue / Setting
                  </label>
                  <input
                    type="text"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-black focus:outline-none focus:border-black"
                    placeholder="e.g. Indoor AC & Terrace"
                  />
                </div>
              </div>
            </div>

            {/* AI Generator CTA */}
            <button
              onClick={handleGenerateDailyPick}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-black text-white hover:bg-zinc-900 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Styling from Clean Inventory...' : 'Generate Today’s AI Look'}</span>
            </button>
          </div>

          {/* Generated Outfit Output Card */}
          {generatedPick && (
            <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold">
                    {generatedPick.vibe.replace('_', ' ')}
                  </span>
                  <h2 className="text-base font-serif font-bold text-black mt-1">
                    {generatedPick.name}
                  </h2>
                </div>
                <button
                  onClick={() =>
                    handleApplyToCalendar(generatedPick.selectedItemIds, generatedPick.name)
                  }
                  className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Wear Today
                </button>
              </div>

              {/* Action Buttons: View on Body, Lookbook Card, Wear Today */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => openBodyPreview(generatedPick.selectedItemIds, generatedPick.name)}
                  className="py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>On Body</span>
                </button>
                <button
                  onClick={handleOpenLookbookForGenerated}
                  className="py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center gap-1 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Lookbook</span>
                </button>
                <button
                  onClick={() =>
                    handleApplyToCalendar(generatedPick.selectedItemIds, generatedPick.name)
                  }
                  className="py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Log Wear</span>
                </button>
              </div>

              {/* Grid of Selected Garment Pieces */}
              <div className="grid grid-cols-3 gap-2">
                {generatedPick.selectedItemIds.map((itemId) => {
                  const item = cleanItems.find((i) => i.id === itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={item.id}
                      className="p-2 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center text-center"
                    >
                      <img src={item.imageUrl} alt={item.name} className="h-16 object-contain drop-shadow-sm" />
                      <span className="text-[10px] font-bold text-black truncate w-full mt-1">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 capitalize">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rationale & Weather Fit */}
              <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3 rounded-2xl">
                <p className="leading-relaxed">
                  <strong className="text-black font-semibold">Stylist Note: </strong>
                  {generatedPick.reasoning}
                </p>
                <p className="text-[11px] text-zinc-500">
                  <strong className="text-zinc-700">Climate Factor: </strong>
                  {generatedPick.weatherFitExplanation}
                </p>
              </div>

              {/* Styling Tips */}
              {generatedPick.stylingTips?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                    Drape & Accent Details
                  </p>
                  <ul className="list-disc list-inside text-xs text-zinc-600 space-y-0.5">
                    {generatedPick.stylingTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Today's Reality Drape / Selfie Log Status */}
          {todayPlan?.selfieOotdUrl && (
            <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-zinc-600" />
                  Logged Selfie OOTD (Reality Check)
                </span>
                <span className="text-[10px] text-zinc-400">August 24</span>
              </div>
              <div
                onClick={() => setLightboxImage(todayPlan.selfieOotdUrl || null)}
                className="w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 flex items-center justify-center cursor-pointer relative group"
              >
                <img
                  src={todayPlan.selfieOotdUrl}
                  alt="Today's OOTD"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Tap to Expand
                </div>
              </div>
              {todayPlan.customNotes && (
                <p className="text-xs text-zinc-500 italic">"{todayPlan.customNotes}"</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ================= VISUAL CALENDAR SUB-TAB ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
          {/* Calendar Header Month Switcher */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-100">
            <h2 className="text-sm font-serif font-bold text-black">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundService.playTap();
                  setCurrentMonthDate(new Date(year, month - 1, 1));
                }}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundService.playTap();
                  setCurrentMonthDate(new Date(year, month + 1, 1));
                }}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 uppercase">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-3xl border border-zinc-100">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 rounded-xl opacity-0" />
            ))}

            {daysArray.map(({ dayNum, dateKey, plan }) => {
              const isSelected = selectedCalendarDate === dateKey;
              const isToday = dateKey === todayStr;

              return (
                <button
                  key={dateKey}
                  onClick={() => {
                    soundService.playTap();
                    setSelectedCalendarDate(dateKey);
                  }}
                  className={`h-14 rounded-2xl p-1 flex flex-col items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-black text-white shadow-sm'
                      : isToday
                      ? 'bg-zinc-100 text-black font-bold'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <span className="text-[11px] font-bold">{dayNum}</span>

                  {plan?.selfieOotdUrl ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white">
                      <img src={plan.selfieOotdUrl} alt="OOTD" className="w-full h-full object-cover" />
                    </div>
                  ) : plan?.outfitId ? (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-amber-400' : 'bg-black'
                      }`}
                    />
                  ) : (
                    <span className="w-1 h-1 rounded-full opacity-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Plan & Actions */}
          <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Plan for {selectedCalendarDate}
                </span>
                <h3 className="text-sm font-bold text-black">
                  {selectedDatePlan?.customNotes || 'No specific agenda logged'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundService.playTap();
                    setIsAssignModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Look</span>
                </button>
                <button
                  onClick={() => {
                    soundService.playTap();
                    setIsSelfieModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>OOTD</span>
                </button>
              </div>
            </div>

            {selectedDatePlan?.selfieOotdUrl && (
              <div
                onClick={() => setLightboxImage(selectedDatePlan.selfieOotdUrl || null)}
                className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 cursor-pointer relative group"
              >
                <img
                  src={selectedDatePlan.selfieOotdUrl}
                  alt="Day OOTD"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Full Screen
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Outfit to Date Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-base font-bold text-black">
                Assign Outfit for {selectedCalendarDate}
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-black font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Select one of your saved curate looks to wear on this calendar day:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {savedOutfits.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No saved outfits found. Create looks in Studio first!
                </div>
              ) : (
                savedOutfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => handleAssignSavedOutfitToDate(outfit)}
                    className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left flex items-center justify-between transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-black">{outfit.name}</h4>
                      <p className="text-[10px] text-zinc-400 capitalize">{outfit.vibe?.replace('_', ' ')}</p>
                    </div>
                    <Check className="w-4 h-4 text-zinc-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selfie OOTD Attachment Modal */}
      {isSelfieModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-base font-bold text-black">
                Log Reality Selfie OOTD
              </h3>
              <button
                onClick={() => setIsSelfieModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-black font-bold"
              >
                Cancel
              </button>
            </div>

            {!selfieImagePreview ? (
              <label className="w-full h-44 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-black bg-zinc-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-800">Snap or Upload Full-Length Selfie</p>
                <p className="text-[10px] text-zinc-400">Record how the fabrics drape in reality</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieFile}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-zinc-100">
                <img
                  src={selfieImagePreview}
                  alt="Selfie Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelfieImagePreview('')}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-white rounded-full text-[10px] font-bold"
                >
                  Change
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Drape & Reality Reflections
              </label>
              <textarea
                value={selfieDrapeNotes}
                onChange={(e) => setSelfieDrapeNotes(e.target.value)}
                placeholder="e.g. Scarf held up great in humidity, trousers draped perfectly with mules."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
              />
            </div>

            <button
              onClick={handleSaveSelfieOotd}
              disabled={!selfieImagePreview}
              className="w-full py-3 rounded-2xl bg-black text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save OOTD to Calendar
            </button>
          </div>
        </div>
      )}

      {/* Lightbox for Fullscreen Image Preview */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-lg max-h-[90vh] overflow-hidden rounded-3xl">
            <img src={lightboxImage} alt="Fullscreen OOTD" className="w-full h-full object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* On-Body Visualizer Modal */}
      {isBodyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center">
          <div className="w-full max-w-md h-[92vh] sm:h-[85vh] bg-white rounded-t-[36px] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-sm text-black">
                    On-Body Visualizer
                  </h3>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                    {bodyPreviewOutfitName || 'Selected Look'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBodyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <BodyVisualizer
                profileId={profileId}
                selectedItemIds={bodyPreviewItemIds}
                allItems={cleanItems}
                customApiKey={customApiKey}
                onClose={() => setIsBodyModalOpen(false)}
              />
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
          allWardrobeItems={cleanItems}
          profileId={profileId}
          onWearToday={() => {
            handleApplyToCalendar(lookbookOutfit.itemIds, lookbookOutfit.name);
          }}
        />
      )}
    </div>
  );
};
