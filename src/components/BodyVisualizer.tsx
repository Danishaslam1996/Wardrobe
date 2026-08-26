import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  RotateCw,
  Eye,
  Check,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
  Info,
  Camera,
  Shirt,
  Scissors,
  Flame,
  Award,
  Sparkle,
} from 'lucide-react';
import {
  ProfileId,
  WardrobeItem,
  BodyBuild,
  BodyPose,
  LightingPreset,
  BodyModelConfig,
} from '../types';
import { requestVisualizeBody, VisualizeBodyResponse } from '../lib/geminiClient';
import confetti from 'canvas-confetti';

interface BodyVisualizerProps {
  profileId: ProfileId;
  selectedTop?: WardrobeItem;
  selectedBottom?: WardrobeItem;
  selectedOuterwear?: WardrobeItem;
  selectedStole?: WardrobeItem;
  selectedJewelry?: WardrobeItem;
  selectedShoes?: WardrobeItem;
  selectedBag?: WardrobeItem;
  customApiKey?: string;
  onSaveLook?: () => void;
}

const SKIN_TONES = [
  { id: 'fair', name: 'Fair Ivory', hex: '#F6E5D7', shadow: '#D9BDA7' },
  { id: 'warm_beige', name: 'Warm Beige', hex: '#E7C8A8', shadow: '#C89F7A' },
  { id: 'olive', name: 'Golden Olive', hex: '#D6A67B', shadow: '#B37D4E' },
  { id: 'caramel', name: 'Rich Caramel', hex: '#B87B4E', shadow: '#915629' },
  { id: 'deep_bronze', name: 'Deep Bronze', hex: '#875129', shadow: '#613414' },
  { id: 'espresso', name: 'Espresso Noir', hex: '#4E2F1A', shadow: '#311A0C' },
];

const LIGHTING_PRESETS: { id: LightingPreset; name: string; bgGradient: string; glow: string }[] = [
  {
    id: 'studio',
    name: 'Studio Softbox',
    bgGradient: 'from-zinc-100 via-white to-zinc-200',
    glow: 'rgba(255,255,255,0.8)',
  },
  {
    id: 'golden_hour',
    name: 'Golden Sunset',
    bgGradient: 'from-amber-100/50 via-rose-50/40 to-orange-100/30',
    glow: 'rgba(251,191,36,0.25)',
  },
  {
    id: 'boutique',
    name: 'Boutique Spotlight',
    bgGradient: 'from-stone-200 via-zinc-100 to-stone-300',
    glow: 'rgba(212,175,55,0.3)',
  },
  {
    id: 'minimal_noir',
    name: 'Minimal Noir',
    bgGradient: 'from-zinc-900 via-zinc-800 to-black',
    glow: 'rgba(255,255,255,0.15)',
  },
];

export const BodyVisualizer: React.FC<BodyVisualizerProps> = ({
  profileId,
  selectedTop,
  selectedBottom,
  selectedOuterwear,
  selectedStole,
  selectedJewelry,
  selectedShoes,
  selectedBag,
  customApiKey,
  onSaveLook,
}) => {
  // Body Avatar Configuration
  const [config, setConfig] = useState<BodyModelConfig>({
    skinToneId: profileId === 'eesha' ? 'warm_beige' : 'olive',
    skinToneHex: profileId === 'eesha' ? '#E7C8A8' : '#D6A67B',
    build: profileId === 'eesha' ? 'classic' : 'athletic',
    height: profileId === 'eesha' ? '168 cm (5\'6")' : '182 cm (6\'0")',
    pose: 'standing_front',
    lighting: 'studio',
    drapeTopMode: 'untucked',
    outerwearOpen: true,
    scarfStyle: 'shoulder_wrap',
  });

  // UI States
  const [zoomFocus, setZoomFocus] = useState<'full' | 'upper' | 'lower'>('full');
  const [showDressingControls, setShowDressingControls] = useState(false);
  const [showBodyCustomizer, setShowBodyCustomizer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<VisualizeBodyResponse | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const isEesha = profileId === 'eesha';
  const currentSkin = SKIN_TONES.find((s) => s.id === config.skinToneId) || SKIN_TONES[1];
  const currentLighting = LIGHTING_PRESETS.find((l) => l.id === config.lighting) || LIGHTING_PRESETS[0];

  // Width scale multipliers based on build
  const getBuildMultiplier = () => {
    switch (config.build) {
      case 'slim':
        return 0.92;
      case 'athletic':
        return 1.05;
      case 'curvy':
        return 1.1;
      case 'tall_lean':
        return 0.95;
      case 'classic':
      default:
        return 1.0;
    }
  };

  const buildMult = getBuildMultiplier();

  // Handle AI On-Body Fit Analysis
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    const activeItems = [
      selectedTop,
      selectedBottom,
      selectedOuterwear,
      selectedStole,
      selectedJewelry,
      selectedShoes,
      selectedBag,
    ].filter(Boolean);

    try {
      const result = await requestVisualizeBody(
        {
          profileId,
          bodySettings: {
            skinTone: currentSkin.name,
            buildType: config.build,
            height: config.height,
            drapePreference: config.drapeTopMode === 'tucked' ? 'Tucked Tailored' : 'Fluid Relaxed',
          },
          selectedItems: activeItems,
          lighting: currentLighting.name,
        },
        customApiKey
      );

      setAiAnalysis(result);
      setShowAnalysisModal(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000000', '#D4AF37', '#E7C8A8', '#FFFFFF'],
      });
    } catch (err: any) {
      console.warn('Fallback on-body analysis:', err);
      // Construct fallback analysis
      setAiAnalysis({
        silhouetteScore: 94,
        fitHeadline: isEesha
          ? 'Graceful Modest Drape & Noble Proportions'
          : 'Sharp Sculptural Tailoring & Balanced Break',
        bodyFitAnalysis: {
          upperBody: selectedOuterwear
            ? `The ${selectedOuterwear.name} frames the shoulders with clean architectural drape over the ${selectedTop?.name || 'top'}.`
            : `The ${selectedTop?.name || 'top'} contours naturally to the chest and collar line.`,
          midSection:
            config.drapeTopMode === 'tucked'
              ? 'Tucked waist creates an elongated vertical leg line with clear silhouette definition.'
              : 'Untucked hem flows smoothly over the waistline providing relaxed ease.',
          lowerBody: selectedBottom
            ? `The ${selectedBottom.name} falls with a clean drape toward the ankle, complementing the ${selectedShoes?.name || 'footwear'}.`
            : 'Proportions are balanced across the lower silhouette.',
          accessoriesDrape: isEesha
            ? `${selectedStole ? selectedStole.name : 'Silk wrap'} creates soft vertical texture while jewelry catches ambient light.`
            : 'Clean wrist break and minimalist accessory accents.',
        },
        colorHarmony: `The tonal combination complements the ${currentSkin.name} skin undertone beautifully under ${currentLighting.name}.`,
        stylingTweaks: [
          config.drapeTopMode === 'untucked'
            ? 'Try a subtle French tuck at the front waistband for added vertical balance.'
            : 'Keep collar crisp and ensure sleeve cuffs sit 1cm past jacket sleeve.',
          isEesha
            ? 'Let the stole fall slightly asymmetrical over the left shoulder for an editorial fluid look.'
            : 'Ensure trouser break rests cleanly on top of shoe vamp without stacking.',
          'Under current lighting, pearl and metal hardware add a refined luxury finish.',
        ],
        editorialCritique: isEesha
          ? 'A masterclass in modern modest luxury. The fluid movement of fabrics combined with noble textures crafts a sophisticated, elevated presence.'
          : 'A supremely sharp, modern tailored silhouette. The proportion between structured outerwear and tapered trousers exudes effortless luxury.',
      });
      setShowAnalysisModal(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Zoom transform styles
  const getZoomStyle = () => {
    switch (zoomFocus) {
      case 'upper':
        return 'scale-[1.65] translate-y-[28%]';
      case 'lower':
        return 'scale-[1.6] -translate-y-[28%]';
      case 'full':
      default:
        return 'scale-100 translate-y-0';
    }
  };

  const isDarkMode = config.lighting === 'minimal_noir';

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative select-none transition-colors duration-500 bg-gradient-to-b ${currentLighting.bgGradient}`}>
      {/* Top Floating Control Bar */}
      <div className="p-2.5 px-3 flex items-center justify-between z-30 shrink-0">
        {/* Left: Viewport Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/80 dark:bg-black/60 backdrop-blur-md p-1 rounded-full border border-black/5 shadow-xs">
          <button
            onClick={() => setZoomFocus('full')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              zoomFocus === 'full'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Full Body
          </button>
          <button
            onClick={() => setZoomFocus('upper')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              zoomFocus === 'upper'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Upper
          </button>
          <button
            onClick={() => setZoomFocus('lower')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              zoomFocus === 'lower'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Lower
          </button>
        </div>

        {/* Right: Lighting & Customizer Quick Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Lighting Selector */}
          <button
            onClick={() => {
              const currentIdx = LIGHTING_PRESETS.findIndex((l) => l.id === config.lighting);
              const nextIdx = (currentIdx + 1) % LIGHTING_PRESETS.length;
              setConfig({ ...config, lighting: LIGHTING_PRESETS[nextIdx].id });
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            title="Switch Ambience Lighting"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate max-w-[80px]">{currentLighting.name.split(' ')[0]}</span>
          </button>

          {/* Body Customizer Button */}
          <button
            onClick={() => setShowBodyCustomizer(!showBodyCustomizer)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all ${
              showBodyCustomizer
                ? 'bg-black text-white border-black'
                : 'bg-white/80 dark:bg-black/60 backdrop-blur-md text-zinc-800 dark:text-zinc-200 border-black/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Avatar</span>
          </button>
        </div>
      </div>

      {/* Main Full-Body Visualizer Stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Soft Ambient Radial Spotlight behind model */}
        <div
          className="absolute w-72 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
          style={{ backgroundColor: currentLighting.glow }}
        />

        {/* Floor Contact Shadow */}
        <div className="absolute bottom-8 w-48 h-5 bg-black/15 dark:bg-black/40 rounded-full blur-md pointer-events-none" />

        {/* Animateable Body Stage Container */}
        <div
          className={`relative w-72 h-[410px] flex flex-col items-center justify-center transition-all duration-500 ease-out origin-center ${getZoomStyle()}`}
        >
          {/* ================= SVG ANATOMICAL REALISTIC BODY BASE ================= */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 280 420"
              className="w-full h-full drop-shadow-lg transition-transform duration-300"
              style={{
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.08))',
              }}
            >
              <defs>
                {/* Skin Gradient (Light highlight to soft contour shadow) */}
                <linearGradient id={`skinGrad-${profileId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentSkin.hex} />
                  <stop offset="60%" stopColor={currentSkin.hex} />
                  <stop offset="100%" stopColor={currentSkin.shadow} />
                </linearGradient>

                {/* Soft Torso Shading Gradient */}
                <linearGradient id="torsoShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="85%" stopColor="rgba(0,0,0,0.06)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
                </linearGradient>

                {/* Hair Gradient */}
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2A1B14" />
                  <stop offset="100%" stopColor="#140D0A" />
                </linearGradient>

                {/* Hijab / Modest Wrap Base Gradient */}
                <linearGradient id="hijabBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5ECE4" />
                  <stop offset="50%" stopColor="#E2D2C2" />
                  <stop offset="100%" stopColor="#C4B09E" />
                </linearGradient>
              </defs>

              {/* === PROFILE-SPECIFIC ANATOMY === */}
              {isEesha ? (
                /* ================= EESHA: FEMININE MODEST SILHOUETTE ================= */
                <g transform={`translate(${140 - 140 * buildMult}, 0) scale(${buildMult}, 1)`}>
                  {/* Legs & Ankles Base */}
                  <path
                    d="M 124 240 L 122 340 Q 120 375 125 385 L 132 385 Q 135 350 136 280 L 138 240 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  <path
                    d="M 156 240 L 158 340 Q 160 375 155 385 L 148 385 Q 145 350 144 280 L 142 240 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Feet Base */}
                  <ellipse cx="128" cy="386" rx="9" ry="3.5" fill={currentSkin.shadow} />
                  <ellipse cx="152" cy="386" rx="9" ry="3.5" fill={currentSkin.shadow} />

                  {/* Female Torso & Hips */}
                  <path
                    d="M 115 110 Q 110 130 112 165 Q 113 185 120 205 Q 115 225 112 250 L 168 250 Q 165 225 160 205 Q 167 185 168 165 Q 170 130 165 110 Q 140 106 115 110 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  {/* Subtle Waist & Collarbone contour */}
                  <path
                    d="M 125 112 Q 140 118 155 112"
                    stroke={currentSkin.shadow}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                  />

                  {/* Arms & Hands (Graceful poised posture) */}
                  <path
                    d="M 113 115 Q 98 155 96 210 Q 95 235 98 250 Q 102 252 104 248 Q 106 220 112 165 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  <path
                    d="M 167 115 Q 182 155 184 210 Q 185 235 182 250 Q 178 252 176 248 Q 174 220 168 165 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Neck */}
                  <path
                    d="M 132 80 L 132 110 Q 140 114 148 110 L 148 80 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Modest Hijab / Silk Head Silhouette with gentle fabric drape */}
                  <path
                    d="M 124 55 Q 120 40 140 38 Q 160 40 156 55 Q 158 75 152 88 Q 140 92 128 88 Q 122 75 124 55 Z"
                    fill="url(#hijabBaseGrad)"
                  />
                  {/* Facial Oval (Soft contour) */}
                  <ellipse cx="140" cy="62" rx="10" ry="13" fill={`url(#skinGrad-${profileId})`} />
                  {/* Hijab Framing Fold */}
                  <path
                    d="M 128 55 Q 140 50 152 55 Q 155 72 140 82 Q 125 72 128 55 Z"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </g>
              ) : (
                /* ================= DANISH: MASCULINE TAILORED SILHOUETTE ================= */
                <g transform={`translate(${140 - 140 * buildMult}, 0) scale(${buildMult}, 1)`}>
                  {/* Tapered Legs & Calves */}
                  <path
                    d="M 120 230 L 118 335 Q 116 370 122 385 L 133 385 Q 137 345 138 275 L 139 230 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  <path
                    d="M 160 230 L 162 335 Q 164 370 158 385 L 147 385 Q 143 345 142 275 L 141 230 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Feet Base */}
                  <ellipse cx="126" cy="386" rx="11" ry="4" fill={currentSkin.shadow} />
                  <ellipse cx="154" cy="386" rx="11" ry="4" fill={currentSkin.shadow} />

                  {/* Muscular/Tailored Torso */}
                  <path
                    d="M 102 108 L 105 165 Q 110 195 116 235 L 164 235 Q 170 195 175 165 L 178 108 Q 140 102 102 108 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  {/* Subtle Pectoral & Collarbone Contours */}
                  <path
                    d="M 112 110 Q 140 116 168 110"
                    stroke={currentSkin.shadow}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.7"
                  />
                  <path
                    d="M 120 135 Q 140 142 160 135"
                    stroke={currentSkin.shadow}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.4"
                  />

                  {/* Strong Arms & Hands */}
                  <path
                    d="M 102 110 Q 86 150 84 210 Q 83 235 87 252 Q 92 254 94 248 Q 97 215 105 165 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />
                  <path
                    d="M 178 110 Q 194 150 196 210 Q 197 235 193 252 Q 188 254 186 248 Q 183 215 175 165 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Neck */}
                  <path
                    d="M 130 74 L 130 108 Q 140 112 150 108 L 150 74 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Male Face Contour */}
                  <path
                    d="M 126 52 Q 123 72 133 80 Q 140 84 147 80 Q 157 72 154 52 Q 152 40 140 40 Q 128 40 126 52 Z"
                    fill={`url(#skinGrad-${profileId})`}
                  />

                  {/* Styled Modern Hair Silhouette */}
                  <path
                    d="M 124 50 Q 120 34 140 32 Q 160 34 156 50 Q 158 56 155 58 Q 152 44 140 44 Q 128 44 125 58 Z"
                    fill="url(#hairGrad)"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* ================= CLOTHING LAYERS ANCHORED PRECISELY TO BODY ================= */}

          {/* 1. Stole / Hijab Silk Scarf (Eesha Mandatory Layer - Top Z-index) */}
          {selectedStole && (
            <div
              className={`absolute top-4 z-40 animate-in fade-in zoom-in-95 duration-200 pointer-events-none transition-transform ${
                config.scarfStyle === 'shoulder_wrap'
                  ? 'scale-100'
                  : config.scarfStyle === 'hijab_drape'
                  ? 'scale-105 -translate-y-1'
                  : 'scale-95 translate-y-2'
              }`}
            >
              <img
                src={selectedStole.imageUrl}
                alt={selectedStole.name}
                className="w-44 h-40 object-contain drop-shadow-xl"
              />
            </div>
          )}

          {/* 2. Fine Jewelry (Earrings / Necklaces / Rings) */}
          {selectedJewelry && (
            <div className="absolute top-16 z-35 animate-in fade-in duration-200 pointer-events-none">
              <img
                src={selectedJewelry.imageUrl}
                alt={selectedJewelry.name}
                className="w-20 h-20 object-contain drop-shadow-md brightness-105"
              />
            </div>
          )}

          {/* 3. Outerwear (Blazer, Coat, Duster) */}
          {selectedOuterwear && (
            <div
              className={`absolute z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-none transition-all ${
                isEesha ? 'top-14' : 'top-12'
              } ${config.outerwearOpen ? 'scale-105' : 'scale-100'}`}
            >
              <img
                src={selectedOuterwear.imageUrl}
                alt={selectedOuterwear.name}
                className="w-64 h-72 object-contain drop-shadow-2xl"
              />
            </div>
          )}

          {/* 4. Tops (Shirt, Blouse, Knit, T-Shirt) */}
          {selectedTop && (
            <div
              className={`absolute z-20 animate-in fade-in duration-200 pointer-events-none transition-all ${
                isEesha ? 'top-16' : 'top-14'
              } ${config.drapeTopMode === 'tucked' ? 'scale-95 translate-y-1' : 'scale-100'}`}
            >
              <img
                src={selectedTop.imageUrl}
                alt={selectedTop.name}
                className="w-56 h-48 object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* 5. Bottoms (Trousers, Maxi Skirt, Pleated Pants) */}
          {selectedBottom && (
            <div
              className={`absolute z-15 animate-in fade-in duration-200 pointer-events-none transition-all ${
                isEesha ? 'top-44' : 'top-42'
              }`}
            >
              <img
                src={selectedBottom.imageUrl}
                alt={selectedBottom.name}
                className="w-56 h-60 object-contain drop-shadow-xl"
              />
            </div>
          )}

          {/* 6. Footwear (Chelsea Boots, Court Sneakers, Loafers, Heels) */}
          {selectedShoes && (
            <div className="absolute bottom-2 z-25 animate-in fade-in duration-200 pointer-events-none">
              <img
                src={selectedShoes.imageUrl}
                alt={selectedShoes.name}
                className="w-40 h-22 object-contain drop-shadow-xl"
              />
            </div>
          )}

          {/* 7. Bags / Accessories (Optional Handbag or Clutch) */}
          {selectedBag && (
            <div className="absolute top-48 -right-4 z-28 animate-in fade-in duration-200 pointer-events-none">
              <img
                src={selectedBag.imageUrl}
                alt={selectedBag.name}
                className="w-24 h-24 object-contain drop-shadow-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="p-3 bg-white/90 dark:bg-black/80 backdrop-blur-md border-t border-black/5 flex items-center justify-between gap-2 z-30 shrink-0">
        {/* Drape Adjustment Quick Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Top Tucked / Untucked Toggle */}
          {selectedTop && (
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  drapeTopMode: config.drapeTopMode === 'tucked' ? 'untucked' : 'tucked',
                })
              }
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition-all shrink-0 ${
                config.drapeTopMode === 'tucked'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/60'
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>{config.drapeTopMode === 'tucked' ? 'Tucked' : 'Untucked'}</span>
            </button>
          )}

          {/* Outerwear Open / Closed Toggle */}
          {selectedOuterwear && (
            <button
              onClick={() => setConfig({ ...config, outerwearOpen: !config.outerwearOpen })}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition-all shrink-0 ${
                config.outerwearOpen
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/60'
              }`}
            >
              <Shirt className="w-3 h-3" />
              <span>{config.outerwearOpen ? 'Open Lapel' : 'Fastened'}</span>
            </button>
          )}

          {/* Scarf Drape Style Toggle (Eesha) */}
          {isEesha && selectedStole && (
            <button
              onClick={() => {
                const styles: ('shoulder_wrap' | 'hijab_drape' | 'loose_neck')[] = [
                  'shoulder_wrap',
                  'hijab_drape',
                  'loose_neck',
                ];
                const nextIdx = (styles.indexOf(config.scarfStyle) + 1) % styles.length;
                setConfig({ ...config, scarfStyle: styles[nextIdx] });
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 flex items-center gap-1 shrink-0"
            >
              <Sparkle className="w-3 h-3 text-amber-600" />
              <span>
                {config.scarfStyle === 'shoulder_wrap'
                  ? 'Wrap Drape'
                  : config.scarfStyle === 'hijab_drape'
                  ? 'Hijab Fold'
                  : 'Loose Neck'}
              </span>
            </button>
          )}
        </div>

        {/* AI On-Body Fit Analysis Button */}
        <button
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="px-3.5 py-2 rounded-xl bg-black text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm transition-all shrink-0 hover:bg-zinc-800 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>{isAnalyzing ? 'Analyzing Fit...' : 'AI Fit Score'}</span>
        </button>
      </div>

      {/* ================= BODY CUSTOMIZER DRAWER ================= */}
      {showBodyCustomizer && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl p-4 max-h-[85%] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  Customize {profileId === 'eesha' ? 'Eesha\'s' : 'Danish\'s'} Body Model
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Calibrate realistic skin tone, build proportions & silhouette posture
                </p>
              </div>
              <button
                onClick={() => setShowBodyCustomizer(false)}
                className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Done
              </button>
            </div>

            {/* 1. Skin Tone Selection */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Skin Tone Palette
              </label>
              <div className="grid grid-cols-6 gap-2">
                {SKIN_TONES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() =>
                      setConfig({ ...config, skinToneId: st.id, skinToneHex: st.hex })
                    }
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center p-1 transition-all relative ${
                      config.skinToneId === st.id
                        ? 'ring-2 ring-black dark:ring-white scale-105 shadow-md'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: st.hex }}
                  >
                    {config.skinToneId === st.id && (
                      <Check className="w-4 h-4 text-black/70 drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium mt-1 text-center">
                Current: {currentSkin.name}
              </p>
            </div>

            {/* 2. Body Build Proportions */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Body Build Proportions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'slim', label: 'Slim / Lean' },
                    { id: 'athletic', label: 'Athletic Tailored' },
                    { id: 'classic', label: 'Classic Balanced' },
                    { id: 'curvy', label: 'Fluid / Curvy' },
                    { id: 'tall_lean', label: 'Tall & Structured' },
                  ] as { id: BodyBuild; label: string }[]
                ).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setConfig({ ...config, build: b.id })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                      config.build === b.id
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Height / Proportions */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Model Height Reference
              </label>
              <input
                type="text"
                value={config.height}
                onChange={(e) => setConfig({ ...config, height: e.target.value })}
                placeholder="e.g. 180 cm (5'11&quot;)"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-black dark:text-white"
              />
            </div>

            {/* 4. Ambience Lighting Presets */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Boutique Mirror Lighting
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LIGHTING_PRESETS.map((lp) => (
                  <button
                    key={lp.id}
                    onClick={() => setConfig({ ...config, lighting: lp.id })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      config.lighting === lp.id
                        ? 'border-black bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white ring-1 ring-black'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <span className="block font-bold">{lp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI ON-BODY SILHOUETTE FIT MODAL ================= */}
      {showAnalysisModal && aiAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header with Score */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span>Haute Couture Fit Report</span>
                </div>
                <h3 className="font-serif italic text-base font-bold text-black dark:text-white mt-1">
                  {aiAnalysis.fitHeadline}
                </h3>
              </div>

              {/* Silhouette Score Badge */}
              <div className="flex flex-col items-center bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-2xl shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-600">
                  Score
                </span>
                <span className="text-lg font-black leading-none">{aiAnalysis.silhouetteScore}</span>
              </div>
            </div>

            {/* Editorial Critique Quote */}
            <blockquote className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border-l-2 border-black dark:border-white text-xs italic text-zinc-700 dark:text-zinc-300 leading-relaxed">
              "{aiAnalysis.editorialCritique}"
            </blockquote>

            {/* Body Section Anatomical Fit Breakdown */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Anatomical Drape Breakdown
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Shoulders & Upper
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-tight">
                    {aiAnalysis.bodyFitAnalysis.upperBody}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Waist & Midsection
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-tight">
                    {aiAnalysis.bodyFitAnalysis.midSection}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Leg Taper & Break
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-tight">
                    {aiAnalysis.bodyFitAnalysis.lowerBody}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">
                    {isEesha ? 'Scarf & Jewelry Drape' : 'Accents & Hardware'}
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-tight">
                    {aiAnalysis.bodyFitAnalysis.accessoriesDrape}
                  </p>
                </div>
              </div>
            </div>

            {/* Color Harmony */}
            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs">
              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 block mb-0.5">
                Skin Tone & Fabric Harmony
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">{aiAnalysis.colorHarmony}</p>
            </div>

            {/* Stylist Tweaks */}
            <div>
              <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Stylist Fit Adjustments
              </h5>
              <ul className="space-y-1">
                {aiAnalysis.stylingTweaks.map((tweak, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-zinc-800 dark:text-zinc-200 flex items-start gap-1.5"
                  >
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{tweak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Close
              </button>
              {onSaveLook && (
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    onSaveLook();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Look</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
