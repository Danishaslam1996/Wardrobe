export type ProfileId = 'danish' | 'eesha';

export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'outerwear'
  | 'dresses'
  | 'shoes'
  | 'stoles_scarves'
  | 'jewelry'
  | 'accessories'
  | 'bags';

export type Vibe = 'casual' | 'formal' | 'smart_casual' | 'festive' | 'business' | 'minimalist' | 'athletic';

export type Season = 'all_year' | 'summer' | 'winter' | 'spring' | 'fall';

export interface WardrobeItem {
  id: string;
  profileId: ProfileId;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  brand?: string;
  notes?: string;
  color: {
    primary: string;
    secondary?: string;
    hex: string;
  };
  material: string[];
  vibe: Vibe[];
  season: Season[];
  imageUrl: string;          // Cutout transparent PNG
  originalImageUrl?: string;
  isLaundry: boolean;        // If true, omitted from AI pick & dressing room
  purchasePrice?: number;
  wearCount: number;
  lastWornDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CanvasLayerItem {
  id: string;
  itemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface Outfit {
  id: string;
  profileId: ProfileId;
  name: string;
  type: 'dressing_room' | 'canvas';
  itemIds: string[];
  canvasState?: {
    layers: CanvasLayerItem[];
    snapshotUrl?: string;
  };
  vibe: Vibe;
  season?: Season;
  occasion?: string;
  isFavorite: boolean;
  wearCount: number;
  lastWornDate?: string;
  stylingNotes?: string;
  createdAt: string;
}

export interface CalendarDayPlan {
  id?: string;                // YYYY-MM-DD
  profileId: ProfileId;
  date: string;              // YYYY-MM-DD
  outfitId?: string;
  customNotes?: string;
  weatherSnapshot?: {
    tempC: number;
    humidity: number;
    condition: string;
    location: string;
  };
  context?: {
    occasion: string;
    meetingWith: string;
    locationType: string;
  };
  selfieOotdUrl?: string;    // Reality drape snap
  selfieLoggedAt?: string;
}

export interface TripCapsule {
  id: string;
  profileId: ProfileId;
  title: string;
  destination: string;
  climate: 'hot_humid' | 'mild' | 'cold' | 'tropical';
  startDate: string;
  endDate: string;
  days: number;
  rationale?: string;
  wardrobeItemIds: string[];
  dailyOutfits: {
    day: number;
    activity: string;
    itemIds: string[];
    notes?: string;
  }[];
  packingChecklist: {
    id: string;
    title: string;
    isPacked: boolean;
    isCustomItem?: boolean;
  }[];
  createdAt: string;
}

export interface BuySkipScanResult {
  id: string;
  profileId: ProfileId;
  imageUrl: string;
  detectedItem: {
    name: string;
    category: ClothingCategory;
    color: string;
    material: string;
    estimatedVibe: string;
  };
  verdict: 'BUY' | 'SKIP';
  confidenceScore: number;
  headline: string;
  redundancyAnalysis: {
    isRedundant: boolean;
    similarOwnedItemIds: string[];
    explanation: string;
  };
  styleCombinations: {
    title: string;
    ownedItemIds: string[];
    stylingTip: string;
  }[];
  scannedAt: string;
}

export interface ProfileConfig {
  id: ProfileId;
  name: string;
  avatarUrl: string;
  subtitle: string;
  stylingDirectives: string;
  accentColor: string;
  defaultCategories: ClothingCategory[];
}

export type BodyBuild = 'slim' | 'athletic' | 'classic' | 'curvy' | 'tall_lean';
export type BodyPose = 'standing_front' | 'editorial_angle' | 'casual_stride';
export type LightingPreset = 'studio' | 'golden_hour' | 'boutique' | 'minimal_noir';

export interface BodyModelConfig {
  skinToneId: string;        // 'fair' | 'warm_beige' | 'olive' | 'caramel' | 'deep_bronze' | 'espresso'
  skinToneHex: string;
  build: BodyBuild;
  height: string;
  pose: BodyPose;
  lighting: LightingPreset;
  drapeTopMode: 'tucked' | 'untucked';
  outerwearOpen: boolean;
  scarfStyle: 'shoulder_wrap' | 'hijab_drape' | 'loose_neck';
}

export interface ExtractedOutfitPiece {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
  color: {
    primary: string;
    secondary?: string;
    hex: string;
  };
  material: string[];
  vibe: Vibe[];
  season: Season[];
  confidence: number;
  stylingNotes?: string;
  cutoutImageUrl?: string;
  croppedOriginalUrl?: string;
  selected?: boolean;
  isAlreadyInWardrobe?: boolean;
  matchedWardrobeItemId?: string;
  matchedWardrobeItemName?: string;
  matchReason?: string;
  matchConfidence?: number;
}

