import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Check,
  Layers,
  Scissors,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Tag,
  Palette,
  RotateCw,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { ProfileId, ClothingCategory, Vibe, Season, ExtractedOutfitPiece, WardrobeItem } from '../types';
import { requestExtractOutfitPieces, ExtractOutfitPiecesResponse } from '../lib/geminiClient';
import { extractRegionAndRemoveBackground, sanitizeImageDataUrl } from '../lib/backgroundRemover';
import { processSelectedFile } from '../lib/imageUtils';
import confetti from 'canvas-confetti';

interface OutfitDeconstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: ProfileId;
  existingItems?: WardrobeItem[];
  customApiKey?: string;
  onImportItems: (
    items: Array<{
      name: string;
      category: ClothingCategory;
      subcategory?: string;
      color: { primary: string; secondary?: string; hex: string };
      material: string[];
      vibe: Vibe[];
      season: Season[];
      imageUrl: string;
      originalImageUrl?: string;
      isLaundry: boolean;
      purchasePrice?: number;
      tags: string[];
    }>,
    createOutfitWithName?: string,
    existingMatchedItemIds?: string[]
  ) => void;
}

const CATEGORIES: { id: ClothingCategory; label: string }[] = [
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'stoles_scarves', label: 'Stoles & Scarves' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'bags', label: 'Bags' },
];

export const OutfitDeconstructorModal: React.FC<OutfitDeconstructorModalProps> = ({
  isOpen,
  onClose,
  profileId,
  existingItems = [],
  customApiKey,
  onImportItems,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [extractedPieces, setExtractedPieces] = useState<ExtractedOutfitPiece[]>([]);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [alsoSaveOutfit, setAlsoSaveOutfit] = useState(true);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'new' | 'existing'>('all');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toleranceMap, setToleranceMap] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');
    setIsAnalyzing(true);
    setAnalysisStep('Loading image...');
    try {
      let base64 = await processSelectedFile(file);
      base64 = await sanitizeImageDataUrl(base64);
      setPhotoDataUrl(base64);
      processPhotoWithGemini(base64, 'image/jpeg');
    } catch (err) {
      console.error('Could not load image', err);
      setIsAnalyzing(false);
      setErrorMsg('Failed to process uploaded image.');
    }
  };

  const processPhotoWithGemini = async (imageBase64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setAnalysisStep('Scanning outfit pieces and checking wardrobe inventory...');
    setErrorMsg('');

    try {
      // 1. Call Gemini 3.7 Flash with existing items to isolate pieces and check duplicates
      const result: ExtractOutfitPiecesResponse = await requestExtractOutfitPieces(
        {
          imageBase64,
          profileId,
          mimeType,
          existingItems,
        },
        customApiKey
      );

      if (!result.items || result.items.length === 0) {
        throw new Error('No individual clothing pieces could be detected in this photo. Please try a clearer photo.');
      }

      setOutfitTitle(result.outfitName || 'Curated Outfit Look');
      setAnalysisStep(`Isolating ${result.items.length} pieces & removing backgrounds...`);

      // 2. Perform client-side sub-region cropping and background cutouts for each piece
      const piecesWithCutouts: ExtractedOutfitPiece[] = await Promise.all(
        result.items.map(async (item, idx) => {
          const pieceId = `piece-${Date.now()}-${idx}`;
          let cutoutImageUrl = '';
          let croppedOriginalUrl = '';

          try {
            const cutout = await extractRegionAndRemoveBackground(
              imageBase64,
              item.box2d,
              { tolerance: 48, paddingRatio: 0.15 }
            );
            cutoutImageUrl = cutout.cutoutDataUrl;
            croppedOriginalUrl = cutout.croppedOriginalUrl;
          } catch (cropErr) {
            console.warn('Fallback cutout for piece:', item.name, cropErr);
            cutoutImageUrl = imageBase64;
            croppedOriginalUrl = imageBase64;
          }

          const isAlreadyInWardrobe = Boolean(item.isAlreadyInWardrobe);

          return {
            id: pieceId,
            name: item.name,
            category: (item.category as ClothingCategory) || 'tops',
            subcategory: item.subcategory,
            box2d: item.box2d,
            color: item.color,
            material: item.material || ['Fine Fabric'],
            vibe: (item.vibe as Vibe[]) || ['smart_casual'],
            season: (item.season as Season[]) || ['all_year'],
            confidence: item.confidence || 90,
            stylingNotes: item.stylingNotes,
            cutoutImageUrl,
            croppedOriginalUrl,
            isAlreadyInWardrobe,
            matchedWardrobeItemId: item.matchedWardrobeItemId,
            matchedWardrobeItemName: item.matchedWardrobeItemName,
            matchReason: item.matchReason,
            matchConfidence: item.matchConfidence,
            // CRITICAL RULE: If piece is already in wardrobe, do NOT select it to add again by default!
            selected: !isAlreadyInWardrobe,
          };
        })
      );

      setExtractedPieces(piecesWithCutouts);
    } catch (err: any) {
      console.error('Error deconstructing photo:', err);
      setErrorMsg(err.message || 'Failed to detect clothes in photo with Gemini Flash.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleToggleSelect = (id: string) => {
    setExtractedPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdatePiece = (id: string, updates: Partial<ExtractedOutfitPiece>) => {
    setExtractedPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleReCutout = async (piece: ExtractedOutfitPiece, customTolerance: number) => {
    try {
      const cutout = await extractRegionAndRemoveBackground(
        photoDataUrl,
        piece.box2d,
        { tolerance: customTolerance, paddingRatio: 0.15 }
      );
      handleUpdatePiece(piece.id, { cutoutImageUrl: cutout.cutoutDataUrl });
      setToleranceMap((prev) => ({ ...prev, [piece.id]: customTolerance }));
    } catch (e) {
      console.error('Failed to recutout:', e);
    }
  };

  const handleSelectNewOnly = () => {
    setExtractedPieces((prev) =>
      prev.map((p) => ({ ...p, selected: !p.isAlreadyInWardrobe }))
    );
  };

  const handleImport = () => {
    const selectedNewPieces = extractedPieces.filter((p) => p.selected);
    const existingMatchedIds = extractedPieces
      .filter((p) => p.isAlreadyInWardrobe && p.matchedWardrobeItemId)
      .map((p) => p.matchedWardrobeItemId as string);

    if (selectedNewPieces.length === 0 && !alsoSaveOutfit) {
      return;
    }

    const itemsToImport = selectedNewPieces.map((p) => ({
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      color: p.color,
      material: p.material,
      vibe: p.vibe,
      season: p.season,
      imageUrl: p.cutoutImageUrl || p.croppedOriginalUrl || photoDataUrl,
      originalImageUrl: p.croppedOriginalUrl || photoDataUrl,
      isLaundry: false,
      tags: [p.subcategory || '', p.material[0] || '', profileId].filter(Boolean),
    }));

    onImportItems(
      itemsToImport,
      alsoSaveOutfit ? outfitTitle : undefined,
      existingMatchedIds
    );

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  // Sample curated outfit photos for instant demonstration
  const handleLoadSample = (sampleUrl: string) => {
    setPhotoDataUrl(sampleUrl);
    processPhotoWithGemini(sampleUrl, 'image/jpeg');
  };

  const newPieces = extractedPieces.filter((p) => !p.isAlreadyInWardrobe);
  const existingPieces = extractedPieces.filter((p) => p.isAlreadyInWardrobe);
  const selectedCount = extractedPieces.filter((p) => p.selected).length;

  const displayedPieces = extractedPieces.filter((p) => {
    if (filterView === 'new') return !p.isAlreadyInWardrobe;
    if (filterView === 'existing') return p.isAlreadyInWardrobe;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center">
      <div className="w-full max-w-2xl h-[94vh] sm:h-[88vh] bg-white rounded-t-[36px] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-6 border border-zinc-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic font-bold text-base text-black">
                  Extract Clothes from Photo of Myself
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-amber-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Isolates pieces, checks for wardrobe duplicates & auto-tags new items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-5">
          {/* STEP 1: Upload or Choose Photo if not selected */}
          {!photoDataUrl && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-black rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-50 hover:bg-zinc-100/80 group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-black mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-sm text-black">
                  Upload Photo (Outfit or Single Garment)
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Upload a photo. Gemini isolates each piece, removes the background automatically, labels it, and checks if it's already in your wardrobe.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-full bg-zinc-200 hover:bg-zinc-300 text-xs font-semibold text-zinc-900 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Live Camera Snap
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Browse Photos
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Sample Demonstrations */}
              <div className="pt-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Or Test with Sample Outfit Looks:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      handleLoadSample(
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="p-2.5 rounded-2xl border border-zinc-200 hover:border-black bg-zinc-50 hover:bg-white text-left flex items-center gap-2.5 transition-all group"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80"
                      alt="Sample Look 1"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-black group-hover:underline">
                        Tailored Knit & Trousers
                      </p>
                      <p className="text-[10px] text-zinc-400">Sweater + Pleated Pants + Boots</p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleLoadSample(
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="p-2.5 rounded-2xl border border-zinc-200 hover:border-black bg-zinc-50 hover:bg-white text-left flex items-center gap-2.5 transition-all group"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80"
                      alt="Sample Look 2"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-black group-hover:underline">
                        Urban Street Tailoring
                      </p>
                      <p className="text-[10px] text-zinc-400">Jacket + Denim + Accessories</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading / Analyzing State */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-28 h-36 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner">
                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="Scanning"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                {/* Laser scan line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-bold text-black flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-zinc-600" />
                  Deconstructing Outfit with Gemini 3.7 Flash...
                </p>
                <p className="text-xs text-zinc-400 mt-1">{analysisStep}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
              <button
                onClick={() => {
                  setPhotoDataUrl('');
                  setErrorMsg('');
                }}
                className="ml-auto underline font-bold"
              >
                Try Another Photo
              </button>
            </div>
          )}

          {/* STEP 2: Results Display with Wardrobe Deduplication Matching */}
          {extractedPieces.length > 0 && !isAnalyzing && (
            <div className="space-y-5">
              {/* Top Overview Bar with Title */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs text-black uppercase tracking-wider">
                      Outfit Deconstructed ({extractedPieces.length} Pieces Found)
                    </h4>
                  </div>
                  <input
                    type="text"
                    value={outfitTitle}
                    onChange={(e) => setOutfitTitle(e.target.value)}
                    placeholder="Outfit Look Name"
                    className="text-sm font-serif italic font-bold text-zinc-900 bg-transparent border-b border-zinc-300 focus:border-black focus:outline-none mt-1 w-full max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPhotoDataUrl('');
                      setExtractedPieces([]);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-black"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Deduplication Status Alert Banner */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                existingPieces.length > 0
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
              }`}>
                {existingPieces.length > 0 ? (
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-bold">
                    {existingPieces.length > 0
                      ? `Smart Deduplication: ${newPieces.length} new piece${newPieces.length === 1 ? '' : 's'} to add, ${existingPieces.length} already in your closet.`
                      : `All ${newPieces.length} detected pieces are brand new to your wardrobe!`}
                  </p>
                  <p className="text-[11px] opacity-80 leading-normal">
                    {existingPieces.length > 0
                      ? `Items already in your wardrobe are automatically unselected so they won't be added again as duplicates. You can review and toggle each piece below.`
                      : `All pieces have been segmented with transparent background cutouts and selected for import.`}
                  </p>
                </div>
              </div>

              {/* Layout: Interactive Photo Preview (Left/Top) + Extracted Cards (Right/Bottom) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Photo with Bounding Box Overlay (5 cols) */}
                <div className="md:col-span-5 flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Detected Garments on You:
                  </p>
                  <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-black/5 shadow-md">
                    <img
                      src={photoDataUrl}
                      alt="My Outfit"
                      className="w-full h-auto max-h-[380px] object-contain mx-auto"
                    />

                    {/* Render Interactive Bounding Boxes */}
                    {extractedPieces.map((piece) => {
                      const [ymin, xmin, ymax, xmax] = piece.box2d.map((val) =>
                        val > 1 ? val / 1000 : val
                      );
                      const isHovered = activeHoverId === piece.id;

                      return (
                        <div
                          key={piece.id}
                          onMouseEnter={() => setActiveHoverId(piece.id)}
                          onMouseLeave={() => setActiveHoverId(null)}
                          onClick={() => handleToggleSelect(piece.id)}
                          style={{
                            position: 'absolute',
                            top: `${ymin * 100}%`,
                            left: `${xmin * 100}%`,
                            width: `${(xmax - xmin) * 100}%`,
                            height: `${(ymax - ymin) * 100}%`,
                          }}
                          className={`border-2 rounded-lg cursor-pointer transition-all ${
                            isHovered
                              ? 'border-amber-400 bg-amber-400/25 ring-2 ring-amber-300 z-30'
                              : piece.isAlreadyInWardrobe
                              ? 'border-emerald-600 bg-emerald-500/15 z-10'
                              : piece.selected
                              ? 'border-black bg-black/15 z-10'
                              : 'border-zinc-400/50 bg-zinc-500/10 opacity-40 z-0'
                          }`}
                        >
                          <span className={`absolute -top-5 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm flex items-center gap-1 ${
                            piece.isAlreadyInWardrobe
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-black text-white'
                          }`}>
                            {piece.isAlreadyInWardrobe && <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />}
                            {piece.category.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-400 text-center">
                    Hover/tap boxes to highlight corresponding pieces
                  </p>
                </div>

                {/* Extracted Pieces List (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  {/* Filter Pills and Quick Selection */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-xl">
                      <button
                        onClick={() => setFilterView('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          filterView === 'all'
                            ? 'bg-white text-black shadow-xs font-bold'
                            : 'text-zinc-500 hover:text-black'
                        }`}
                      >
                        All ({extractedPieces.length})
                      </button>
                      <button
                        onClick={() => setFilterView('new')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                          filterView === 'new'
                            ? 'bg-black text-white shadow-xs font-bold'
                            : 'text-zinc-500 hover:text-black'
                        }`}
                      >
                        <span>New</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-amber-300 text-[9px]">
                          {newPieces.length}
                        </span>
                      </button>
                      {existingPieces.length > 0 && (
                        <button
                          onClick={() => setFilterView('existing')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            filterView === 'existing'
                              ? 'bg-emerald-700 text-white shadow-xs font-bold'
                              : 'text-zinc-500 hover:text-black'
                          }`}
                        >
                          <span>In Closet</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-200 text-[9px]">
                            {existingPieces.length}
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleSelectNewOnly}
                      className="text-xs font-semibold text-zinc-600 hover:text-black underline shrink-0"
                    >
                      Select New Only
                    </button>
                  </div>

                  {/* Garment Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6 px-1 max-h-[460px] overflow-y-auto no-scrollbar pb-12">
                      {displayedPieces.map((piece) => {
                        return (
                          <div
                            key={piece.id}
                            onMouseEnter={() => setActiveHoverId(piece.id)}
                            onMouseLeave={() => setActiveHoverId(null)}
                            className={`relative flex flex-col bg-white rounded-[24px] border border-zinc-200 overflow-hidden shadow-sm transition-all ${
                               activeHoverId === piece.id ? 'ring-2 ring-black' : ''
                            }`}
                          >
                            <div className="relative w-full aspect-square bg-zinc-50 flex items-center justify-center p-3">
                              <img
                                src={piece.cutoutImageUrl || piece.croppedOriginalUrl}
                                alt={piece.name}
                                className="max-h-full max-w-full object-contain drop-shadow-sm "
                              />
                              <button
                                onClick={() => handleToggleSelect(piece.id)}
                                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm z-10 ${
                                  piece.selected
                                    ? 'bg-black text-white'
                                    : 'bg-white border-2 border-zinc-200 text-transparent'
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                              
                              {piece.isAlreadyInWardrobe && (
                                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full shadow-sm text-zinc-600">
                                  In Closet
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white text-center">
                               <input
                                  type="text"
                                  value={piece.name}
                                  onChange={(e) =>
                                    handleUpdatePiece(piece.id, { name: e.target.value })
                                  }
                                  className="text-[12px] font-bold text-black border-b border-transparent hover:border-zinc-300 focus:border-black focus:outline-none w-full bg-transparent text-center"
                                />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              {/* Bottom Ingestion Controls */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 flex justify-center z-20 pointer-events-none">
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="pointer-events-auto w-full max-w-sm px-6 py-4 rounded-full bg-black text-white text-base font-bold flex items-center justify-center gap-2 shadow-2xl disabled:opacity-40 active:scale-95 transition-all"
                >
                  <span>Import {selectedCount} clothes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
