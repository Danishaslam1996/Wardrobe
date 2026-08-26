import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Check,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  RotateCw,
  Move,
  Heart,
  Calendar,
  Share2,
  User,
  Shuffle,
  BookOpen,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  WardrobeItem,
  Outfit,
  ProfileId,
  ClothingCategory,
  CanvasLayerItem,
  Vibe,
} from '../types';
import { BodyVisualizer } from './BodyVisualizer';
import { LookbookModal } from './LookbookModal';
import { soundService } from '../lib/soundHaptics';
import confetti from 'canvas-confetti';

interface StudioViewProps {
  profileId: ProfileId;
  cleanItems: WardrobeItem[];
  savedOutfits: Outfit[];
  customApiKey?: string;
  onSaveOutfit: (outfit: Omit<Outfit, 'id' | 'profileId' | 'createdAt' | 'wearCount'>) => void;
  onDeleteOutfit?: (outfitId: string) => void;
  onWearOutfit?: (outfit: Outfit) => void;
  preselectedItem?: WardrobeItem | null;
}

export const StudioView: React.FC<StudioViewProps> = ({
  profileId,
  cleanItems,
  savedOutfits,
  customApiKey,
  onSaveOutfit,
  onDeleteOutfit,
  onWearOutfit,
  preselectedItem,
}) => {
  const [studioMode, setStudioMode] = useState<'body_model' | 'dressing_room' | 'canvas' | 'saved_looks'>('body_model');
  const [showAvatarFeatures, setShowAvatarFeatures] = useState(true);

  // Dressing Room & Body Visualizer Selection State
  const [selectedTopId, setSelectedTopId] = useState<string>(() => {
    return cleanItems.find((i) => i.category === 'tops')?.id || '';
  });
  const [selectedBottomId, setSelectedBottomId] = useState<string>(() => {
    return cleanItems.find((i) => i.category === 'bottoms')?.id || '';
  });
  const [selectedOuterwearId, setSelectedOuterwearId] = useState<string>('');
  const [selectedStoleId, setSelectedStoleId] = useState<string>(() => {
    return cleanItems.find((i) => i.category === 'stoles_scarves')?.id || '';
  });
  const [selectedJewelryId, setSelectedJewelryId] = useState<string>(() => {
    return cleanItems.find((i) => i.category === 'jewelry')?.id || '';
  });
  const [selectedShoesId, setSelectedShoesId] = useState<string>(() => {
    return cleanItems.find((i) => i.category === 'shoes')?.id || '';
  });

  // Freeform Canvas State
  const [canvasLayers, setCanvasLayers] = useState<CanvasLayerItem[]>([
    {
      id: 'layer-1',
      itemId: cleanItems[0]?.id || '',
      x: 120,
      y: 60,
      scale: 1,
      rotation: 0,
      zIndex: 1,
    },
    {
      id: 'layer-2',
      itemId: cleanItems[1]?.id || '',
      x: 80,
      y: 180,
      scale: 1,
      rotation: -3,
      zIndex: 2,
    },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

  // Modal for saving
  const [outfitName, setOutfitName] = useState('');
  const [outfitVibe, setOutfitVibe] = useState<Vibe>('smart_casual');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Lookbook Modal state
  const [lookbookOutfit, setLookbookOutfit] = useState<Outfit | null>(null);

  // React to preselected item from wardrobe
  useEffect(() => {
    if (!preselectedItem) return;
    switch (preselectedItem.category) {
      case 'tops':
        setSelectedTopId(preselectedItem.id);
        break;
      case 'bottoms':
        setSelectedBottomId(preselectedItem.id);
        break;
      case 'outerwear':
        setSelectedOuterwearId(preselectedItem.id);
        break;
      case 'stoles_scarves':
        setSelectedStoleId(preselectedItem.id);
        break;
      case 'jewelry':
        setSelectedJewelryId(preselectedItem.id);
        break;
      case 'shoes':
        setSelectedShoesId(preselectedItem.id);
        break;
    }
  }, [preselectedItem]);

  // Helper category item lists
  const tops = cleanItems.filter((i) => i.category === 'tops');
  const bottoms = cleanItems.filter((i) => i.category === 'bottoms');
  const outerwears = cleanItems.filter((i) => i.category === 'outerwear');
  const stoles = cleanItems.filter((i) => i.category === 'stoles_scarves');
  const jewelry = cleanItems.filter((i) => i.category === 'jewelry');
  const shoes = cleanItems.filter((i) => i.category === 'shoes');

  // Selected item objects for dressing room and body visualizer
  const activeTop = cleanItems.find((i) => i.id === selectedTopId);
  const activeBottom = cleanItems.find((i) => i.id === selectedBottomId);
  const activeOuterwear = cleanItems.find((i) => i.id === selectedOuterwearId);
  const activeStole = cleanItems.find((i) => i.id === selectedStoleId);
  const activeJewelry = cleanItems.find((i) => i.id === selectedJewelryId);
  const activeShoes = cleanItems.find((i) => i.id === selectedShoesId);

  // Intelligent Synergy Shuffle
  const handleSynergyShuffle = () => {
    soundService.playChime();
    if (tops.length > 0) {
      const rTop = tops[Math.floor(Math.random() * tops.length)];
      setSelectedTopId(rTop.id);
    }
    if (bottoms.length > 0) {
      const rBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      setSelectedBottomId(rBottom.id);
    }
    if (outerwears.length > 0 && Math.random() > 0.3) {
      const rOut = outerwears[Math.floor(Math.random() * outerwears.length)];
      setSelectedOuterwearId(rOut.id);
    } else {
      setSelectedOuterwearId('');
    }
    if (shoes.length > 0) {
      const rShoe = shoes[Math.floor(Math.random() * shoes.length)];
      setSelectedShoesId(rShoe.id);
    }
    if (profileId === 'eesha') {
      if (stoles.length > 0) {
        const rStole = stoles[Math.floor(Math.random() * stoles.length)];
        setSelectedStoleId(rStole.id);
      }
      if (jewelry.length > 0) {
        const rJewel = jewelry[Math.floor(Math.random() * jewelry.length)];
        setSelectedJewelryId(rJewel.id);
      }
    }

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#000000', '#FFFFFF'],
    });
  };

  const handleSaveCurrentOutfit = () => {
    let itemIds: string[] = [];

    if (studioMode === 'body_model' || studioMode === 'dressing_room') {
      itemIds = [
        selectedTopId,
        selectedBottomId,
        selectedOuterwearId,
        selectedStoleId,
        selectedJewelryId,
        selectedShoesId,
      ].filter(Boolean);
    } else {
      itemIds = canvasLayers.map((l) => l.itemId).filter(Boolean);
    }

    if (itemIds.length === 0) return;

    soundService.playChime();
    onSaveOutfit({
      name: outfitName || `${profileId === 'eesha' ? 'Modest Luxe' : 'Tailored'} Edit`,
      type: studioMode === 'canvas' ? 'canvas' : 'dressing_room',
      itemIds,
      canvasState: studioMode === 'canvas' ? { layers: canvasLayers } : undefined,
      vibe: outfitVibe,
      isFavorite: true,
      stylingNotes: `Created in ${studioMode === 'body_model' ? 'Realistic Body Visualizer' : studioMode === 'dressing_room' ? 'Dressing Room' : 'Canvas Moodboard'}`,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#000000', '#D4AF37', '#9E7B7A', '#FFFFFF'],
    });

    setIsSaveModalOpen(false);
    setOutfitName('');
  };

  const handleOpenCurrentLookbook = () => {
    const currentItemIds = [
      selectedTopId,
      selectedBottomId,
      selectedOuterwearId,
      selectedStoleId,
      selectedJewelryId,
      selectedShoesId,
    ].filter(Boolean);

    if (currentItemIds.length === 0) return;

    setLookbookOutfit({
      id: 'current-active',
      profileId,
      name: `${profileId === 'eesha' ? 'Modest Luxe' : 'Tailored'} Curation`,
      type: 'dressing_room',
      itemIds: currentItemIds,
      vibe: 'smart_casual',
      isFavorite: true,
      createdAt: new Date().toISOString(),
      wearCount: 0,
      stylingNotes: 'Cohesive luxury curation created in Daily Threads Studio.',
    });
  };

  // Canvas Interactions
  const addLayerFromWardrobe = (item: WardrobeItem) => {
    soundService.playTap();
    const newLayer: CanvasLayerItem = {
      id: `layer-${Date.now()}`,
      itemId: item.id,
      x: 100 + (canvasLayers.length % 4) * 20,
      y: 100 + (canvasLayers.length % 4) * 20,
      scale: 0.9,
      rotation: (Math.random() - 0.5) * 10,
      zIndex: canvasLayers.length + 1,
    };
    setCanvasLayers([...canvasLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setIsItemDrawerOpen(false);
  };

  const updateSelectedLayer = (updates: Partial<CanvasLayerItem>) => {
    if (!selectedLayerId) return;
    setCanvasLayers(
      canvasLayers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l))
    );
  };

  const removeSelectedLayer = () => {
    soundService.playTap();
    if (!selectedLayerId) return;
    setCanvasLayers(canvasLayers.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const bringToFront = () => {
    soundService.playTap();
    if (!selectedLayerId) return;
    const maxZ = Math.max(...canvasLayers.map((l) => l.zIndex), 0);
    updateSelectedLayer({ zIndex: maxZ + 1 });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FBFBFB] relative select-none">
      {/* Studio Mode Selector (Body Model vs Mannequin vs Canvas vs Saved Looks) */}
      <div className="p-2.5 px-3 bg-white border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="bg-zinc-100 p-1 rounded-full flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              soundService.playTap();
              setStudioMode('body_model');
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition-all flex items-center gap-1 shrink-0 ${
              studioMode === 'body_model'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Body</span>
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setStudioMode('dressing_room');
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition-all shrink-0 ${
              studioMode === 'dressing_room'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            Mannequin
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setStudioMode('canvas');
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition-all shrink-0 ${
              studioMode === 'canvas'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setStudioMode('saved_looks');
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold tracking-tight transition-all flex items-center gap-1 shrink-0 ${
              studioMode === 'saved_looks'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Looks ({savedOutfits.length})</span>
          </button>
        </div>

        {/* Quick Shuffle & Save Look Actions */}
        <div className="flex items-center gap-1.5">
          {studioMode !== 'saved_looks' && (
            <>
              <button
                onClick={handleSynergyShuffle}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 flex items-center justify-center transition-all shadow-2xs"
                title="AI Synergy Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
              </button>

              <button
                onClick={handleOpenCurrentLookbook}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 flex items-center justify-center transition-all shadow-2xs"
                title="Preview Lookbook Card"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  soundService.playTap();
                  setIsSaveModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= MODE 1: REALISTIC BODY VISUALIZER ================= */}
      {studioMode === 'body_model' ? (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <BodyVisualizer
              profileId={profileId}
              selectedTop={activeTop}
              selectedBottom={activeBottom}
              selectedOuterwear={activeOuterwear}
              selectedStole={activeStole}
              selectedJewelry={activeJewelry}
              selectedShoes={activeShoes}
              customApiKey={customApiKey}
              onSaveLook={() => setIsSaveModalOpen(true)}
            />
          </div>

          {/* Bottom Swipeable Category Wardrobe Picker */}
          <div className="p-2.5 bg-white border-t border-zinc-100 space-y-2 max-h-48 overflow-y-auto no-scrollbar shrink-0 shadow-lg">
            {profileId === 'eesha' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                  <span>1. Stoles & Silk Wraps (Mandatory)</span>
                  <span className="text-zinc-400 font-normal lowercase">{stoles.length} available</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {stoles.map((st) => {
                    const isSelected = selectedStoleId === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          soundService.playTap();
                          setSelectedStoleId(isSelected ? '' : st.id);
                        }}
                        className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                        }`}
                      >
                        <img src={st.imageUrl} alt={st.name} className="max-h-11 max-w-full object-contain" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profileId === 'eesha' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                  <span>2. Fine Jewelry (Mandatory)</span>
                  <span className="text-zinc-400 font-normal lowercase">{jewelry.length} available</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {jewelry.map((jw) => {
                    const isSelected = selectedJewelryId === jw.id;
                    return (
                      <button
                        key={jw.id}
                        onClick={() => {
                          soundService.playTap();
                          setSelectedJewelryId(isSelected ? '' : jw.id);
                        }}
                        className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                        }`}
                      >
                        <img src={jw.imageUrl} alt={jw.name} className="max-h-11 max-w-full object-contain" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tops Carousel */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                <span>Tops & Blouses</span>
                <span className="text-zinc-400 font-normal lowercase">{tops.length} available</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {tops.map((tp) => {
                  const isSelected = selectedTopId === tp.id;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedTopId(isSelected ? '' : tp.id);
                      }}
                      className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                      }`}
                    >
                      <img src={tp.imageUrl} alt={tp.name} className="max-h-11 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottoms Carousel */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                <span>Bottoms & Trousers</span>
                <span className="text-zinc-400 font-normal lowercase">{bottoms.length} available</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {bottoms.map((bt) => {
                  const isSelected = selectedBottomId === bt.id;
                  return (
                    <button
                      key={bt.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedBottomId(isSelected ? '' : bt.id);
                      }}
                      className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                      }`}
                    >
                      <img src={bt.imageUrl} alt={bt.name} className="max-h-11 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outerwear Carousel */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                <span>Outerwear & Layers</span>
                <span className="text-zinc-400 font-normal lowercase">{outerwears.length} available</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {outerwears.map((ow) => {
                  const isSelected = selectedOuterwearId === ow.id;
                  return (
                    <button
                      key={ow.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedOuterwearId(isSelected ? '' : ow.id);
                      }}
                      className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                      }`}
                    >
                      <img src={ow.imageUrl} alt={ow.name} className="max-h-11 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shoes Carousel */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                <span>Footwear</span>
                <span className="text-zinc-400 font-normal lowercase">{shoes.length} available</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {shoes.map((sh) => {
                  const isSelected = selectedShoesId === sh.id;
                  return (
                    <button
                      key={sh.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedShoesId(isSelected ? '' : sh.id);
                      }}
                      className={`w-13 h-13 rounded-xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100 shadow-xs' : 'border-zinc-200'
                      }`}
                    >
                      <img src={sh.imageUrl} alt={sh.name} className="max-h-11 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : studioMode === 'dressing_room' ? (
        /* ================= MODE 2: FLAT MANNEQUIN ================= */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative flex items-center justify-center bg-gradient-to-b from-zinc-50 to-[#fafafa] overflow-hidden">
            <div className="absolute top-3 right-3 z-20 flex gap-2">
              <button
                onClick={() => {
                  soundService.playTap();
                  setShowAvatarFeatures(!showAvatarFeatures);
                }}
                className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5 shadow-sm"
              >
                {showAvatarFeatures ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{showAvatarFeatures ? 'Avatar: On' : 'Silhouette'}</span>
              </button>
            </div>

            {/* Mannequin Silhouette & Layer Stacks */}
            <div className="relative w-72 h-[380px] flex flex-col items-center justify-center">
              <div
                className={`w-14 h-16 rounded-full border border-dashed border-zinc-300/70 transition-opacity duration-300 absolute top-2 flex items-center justify-center ${
                  showAvatarFeatures ? 'opacity-90' : 'opacity-20'
                }`}
              >
                {showAvatarFeatures && <div className="w-10 h-10 rounded-full bg-zinc-200/50" />}
              </div>

              {activeStole && (
                <div className="absolute top-4 z-40 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                  <img src={activeStole.imageUrl} alt={activeStole.name} className="w-40 h-36 object-contain drop-shadow-md" />
                </div>
              )}

              {activeJewelry && (
                <div className="absolute top-16 z-35 animate-in fade-in duration-200 pointer-events-none">
                  <img src={activeJewelry.imageUrl} alt={activeJewelry.name} className="w-20 h-20 object-contain drop-shadow-sm" />
                </div>
              )}

              {activeOuterwear && (
                <div className="absolute top-14 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                  <img src={activeOuterwear.imageUrl} alt={activeOuterwear.name} className="w-60 h-64 object-contain drop-shadow-lg scale-105" />
                </div>
              )}

              {activeTop && (
                <div className="absolute top-16 z-20 animate-in fade-in duration-200 pointer-events-none">
                  <img src={activeTop.imageUrl} alt={activeTop.name} className="w-52 h-44 object-contain drop-shadow-md" />
                </div>
              )}

              {activeBottom && (
                <div className="absolute top-44 z-15 animate-in fade-in duration-200 pointer-events-none">
                  <img src={activeBottom.imageUrl} alt={activeBottom.name} className="w-52 h-56 object-contain drop-shadow-md" />
                </div>
              )}

              {activeShoes && (
                <div className="absolute bottom-0 z-25 animate-in fade-in duration-200 pointer-events-none">
                  <img src={activeShoes.imageUrl} alt={activeShoes.name} className="w-36 h-20 object-contain drop-shadow-md" />
                </div>
              )}

              {!activeTop && !activeBottom && !activeStole && (
                <p className="text-xs text-zinc-400 font-medium text-center">
                  Swipe through categories below to dress the mannequin
                </p>
              )}
            </div>
          </div>

          {/* Category Carousel below mannequin */}
          <div className="p-3 bg-white border-t border-zinc-100 space-y-2.5 max-h-56 overflow-y-auto no-scrollbar shrink-0">
            {profileId === 'eesha' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
                  <span>1. Stoles & Silk Wraps (Mandatory)</span>
                  <span className="text-zinc-400 font-normal">{stoles.length} available</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {stoles.map((st) => {
                    const isSelected = selectedStoleId === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          soundService.playTap();
                          setSelectedStoleId(isSelected ? '' : st.id);
                        }}
                        className={`w-14 h-14 rounded-2xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-black ring-2 ring-black bg-zinc-100' : 'border-zinc-200'
                        }`}
                      >
                        <img src={st.imageUrl} alt={st.name} className="max-h-12 max-w-full object-contain" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tops */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
                <span>Tops & Blouses</span>
                <span className="text-zinc-400 font-normal">{tops.length} available</span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {tops.map((tp) => {
                  const isSelected = selectedTopId === tp.id;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedTopId(isSelected ? '' : tp.id);
                      }}
                      className={`w-14 h-14 rounded-2xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100' : 'border-zinc-200'
                      }`}
                    >
                      <img src={tp.imageUrl} alt={tp.name} className="max-h-12 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottoms */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
                <span>Bottoms & Trousers</span>
                <span className="text-zinc-400 font-normal">{bottoms.length} available</span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {bottoms.map((bt) => {
                  const isSelected = selectedBottomId === bt.id;
                  return (
                    <button
                      key={bt.id}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedBottomId(isSelected ? '' : bt.id);
                      }}
                      className={`w-14 h-14 rounded-2xl p-1 bg-zinc-50 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-black ring-2 ring-black bg-zinc-100' : 'border-zinc-200'
                      }`}
                    >
                      <img src={bt.imageUrl} alt={bt.name} className="max-h-12 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : studioMode === 'canvas' ? (
        /* ================= MODE 3: FREEFORM 2D CANVAS MOODBOARD ================= */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 bg-[#F5F5F7] relative overflow-hidden flex items-center justify-center">
            <div className="relative w-full h-full p-4">
              {canvasLayers.map((layer) => {
                const item = cleanItems.find((i) => i.id === layer.itemId);
                if (!item) return null;
                const isSelected = selectedLayerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      soundService.playTap();
                      setSelectedLayerId(layer.id);
                    }}
                    style={{
                      transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                      zIndex: layer.zIndex,
                    }}
                    className={`absolute cursor-move transition-shadow duration-150 p-1.5 rounded-2xl ${
                      isSelected ? 'ring-2 ring-black bg-white/40 backdrop-blur-xs shadow-xl' : 'hover:scale-105'
                    }`}
                  >
                    <img src={item.imageUrl} alt={item.name} className="max-h-40 max-w-[160px] object-contain drop-shadow-md pointer-events-none" />
                  </div>
                );
              })}
            </div>

            {/* Canvas Floating Controls */}
            <div className="absolute top-3 left-3 z-20 flex gap-1.5">
              <button
                onClick={() => {
                  soundService.playTap();
                  setIsItemDrawerOpen(true);
                }}
                className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Garment</span>
              </button>
            </div>

            {selectedLayerId && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full border border-zinc-200 shadow-xl flex items-center gap-2">
                <button
                  onClick={() => updateSelectedLayer({ scale: Math.min(1.5, (canvasLayers.find((l) => l.id === selectedLayerId)?.scale || 1) + 0.1) })}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-700"
                  title="Scale Up"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedLayer({ scale: Math.max(0.6, (canvasLayers.find((l) => l.id === selectedLayerId)?.scale || 1) - 0.1) })}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-700"
                  title="Scale Down"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedLayer({ rotation: ((canvasLayers.find((l) => l.id === selectedLayerId)?.rotation || 0) + 15) % 360 })}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-700"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={bringToFront}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-700"
                  title="Bring to Front"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={removeSelectedLayer}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-full"
                  title="Delete Layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Drawer for Adding Items to Canvas */}
          {isItemDrawerOpen && (
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-zinc-200 shadow-2xl p-4 z-40 max-h-72 flex flex-col">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold uppercase text-zinc-400">Choose Garment to Place</span>
                <button onClick={() => setIsItemDrawerOpen(false)} className="text-xs font-bold text-black">
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 overflow-y-auto no-scrollbar p-1">
                {cleanItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => addLayerFromWardrobe(it)}
                    className="p-2 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-black flex flex-col items-center"
                  >
                    <img src={it.imageUrl} alt={it.name} className="h-14 object-contain" />
                    <span className="text-[10px] font-semibold text-black truncate w-full text-center mt-1">
                      {it.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= MODE 4: SAVED LOOKS & LOOKBOOK ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-serif font-bold text-black">
              {profileId === 'eesha' ? "Eesha's Saved Lookbooks" : "Danish's Saved Lookbooks"}
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              {savedOutfits.length} looks
            </span>
          </div>

          {savedOutfits.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-2">
              <BookOpen className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-black">No saved outfits yet</p>
              <p className="text-[11px] text-zinc-400 max-w-xs">
                Craft a silhouette in Body Model or Mannequin mode and tap "Save" to build your lookbook.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedOutfits.map((outfit) => {
                const outfitItems = outfit.itemIds
                  .map((id) => cleanItems.find((i) => i.id === id))
                  .filter(Boolean) as WardrobeItem[];

                return (
                  <div
                    key={outfit.id}
                    className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xs flex flex-col gap-3 group hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          {outfit.vibe?.replace('_', ' ') || 'Smart Casual'}
                        </span>
                        <h3 className="text-sm font-serif font-bold text-black mt-1">
                          {outfit.name}
                        </h3>
                        {outfit.stylingNotes && (
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {outfit.stylingNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            soundService.playTap();
                            setLookbookOutfit(outfit);
                          }}
                          className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-black text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Lookbook</span>
                        </button>
                        {onDeleteOutfit && (
                          <button
                            onClick={() => {
                              soundService.playTap();
                              if (confirm(`Delete "${outfit.name}"?`)) {
                                onDeleteOutfit(outfit.id);
                              }
                            }}
                            className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Item Thumbnails */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="w-16 h-16 rounded-2xl bg-zinc-50 p-1.5 border border-zinc-100 flex items-center justify-center shrink-0"
                          title={item.name}
                        >
                          <img src={item.imageUrl} alt={item.name} className="max-h-12 max-w-full object-contain" />
                        </div>
                      ))}
                    </div>

                    {/* Quick Wear Today button */}
                    {onWearOutfit && (
                      <button
                        onClick={() => {
                          soundService.playChime();
                          onWearOutfit(outfit);
                          confetti({ particleCount: 40, spread: 50 });
                        }}
                        className="w-full py-2 rounded-2xl bg-zinc-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black active:scale-95 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Wear Today</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Save Outfit Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif italic text-base font-bold text-black">
              Save Styled Look
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Outfit Name
              </label>
              <input
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="e.g. Silk Sage & Pearl Terrace Look"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Vibe Archetype
              </label>
              <select
                value={outfitVibe}
                onChange={(e) => setOutfitVibe(e.target.value as Vibe)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-black"
              >
                <option value="smart_casual">Smart Casual</option>
                <option value="formal">Formal</option>
                <option value="business">Business</option>
                <option value="festive">Festive / Occasion</option>
                <option value="minimalist">Minimalist</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentOutfit}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-semibold"
              >
                Save
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
          allWardrobeItems={cleanItems}
          profileId={profileId}
          onWearToday={() => {
            if (onWearOutfit && lookbookOutfit.id !== 'current-active') {
              onWearOutfit(lookbookOutfit);
            }
          }}
        />
      )}
    </div>
  );
};
