/**
 * Gemini API client helper for Daily Threads.
 * Communicates with server-side routes (/api/gemini/*).
 */

export interface AnalyzeItemResponse {
  name: string;
  category: string;
  subcategory?: string;
  color: { primary: string; secondary?: string; hex: string };
  material: string[];
  vibe: string[];
  season: string[];
  description: string;
  isDuplicate?: boolean;
  duplicateItemId?: string;
  duplicateReason?: string;
}

export interface DailyPickResponse {
  outfitName: string;
  vibeSummary: string;
  selectedItemIds: string[];
  stylingAdvice: string;
  missingPieceTip?: string;
}

export interface BuySkipResponse {
  detectedItem: {
    name: string;
    category: string;
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
}

export interface TripCapsuleResponse {
  capsuleItemIds: string[];
  rationale: string;
  dailyOutfits: {
    day: number;
    activity: string;
    itemIds: string[];
    notes: string;
  }[];
  packingChecklistItems: string[];
}

export interface VisualizeBodyResponse {
  silhouetteScore: number;
  fitHeadline: string;
  bodyFitAnalysis: {
    upperBody: string;
    midSection: string;
    lowerBody: string;
    accessoriesDrape: string;
  };
  colorHarmony: string;
  stylingTweaks: string[];
  editorialCritique: string;
}

export interface DetectedGarmentRaw {
  name: string;
  category: string;
  subcategory?: string;
  box2d: [number, number, number, number];
  color: { primary: string; secondary?: string; hex: string };
  material: string[];
  vibe: string[];
  season: string[];
  confidence: number;
  stylingNotes?: string;
  isAlreadyInWardrobe?: boolean;
  matchedWardrobeItemId?: string;
  matchedWardrobeItemName?: string;
  matchReason?: string;
  matchConfidence?: number;
}

export interface ExtractOutfitPiecesResponse {
  outfitName: string;
  outfitVibe: string;
  totalDetected: number;
  items: DetectedGarmentRaw[];
}

function getHeaders(customApiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customApiKey) {
    headers['x-gemini-key'] = customApiKey;
  }
  return headers;
}

export async function requestAnalyzeItem(
  imageBase64: string,
  profileId: string,
  existingItems: any[],
  customApiKey?: string
): Promise<AnalyzeItemResponse> {
  const res = await fetch('/api/gemini/analyze-item', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify({
      imageBase64,
      profileId,
      existingItems,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to auto-tag item with Gemini Vision');
  }
  return json.data;
}

export async function requestDailyPick(
  payload: {
    profileId: string;
    weather: any;
    context: any;
    availableItems: any[];
  },
  customApiKey?: string
): Promise<DailyPickResponse> {
  const res = await fetch('/api/gemini/daily-pick', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate Daily Pick');
  }
  return json.data;
}

export async function requestBuySkipAnalysis(
  payload: {
    imageBase64: string;
    profileId: string;
    currentWardrobe: any[];
  },
  customApiKey?: string
): Promise<BuySkipResponse> {
  const res = await fetch('/api/gemini/buy-skip', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to evaluate item');
  }
  return json.data;
}

export async function requestTripCapsule(
  payload: {
    profileId: string;
    destination: string;
    climate: string;
    days: number;
    tripType: string;
    availableItems: any[];
  },
  customApiKey?: string
): Promise<TripCapsuleResponse> {
  const res = await fetch('/api/gemini/trip-capsule', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate travel capsule');
  }
  return json.data;
}

export async function requestVisualizeBody(
  payload: {
    profileId: string;
    bodySettings: {
      skinTone: string;
      buildType: string;
      height: string;
      drapePreference?: string;
    };
    selectedItems: any[];
    lighting?: string;
  },
  customApiKey?: string
): Promise<VisualizeBodyResponse> {
  const res = await fetch('/api/gemini/visualize-body', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to analyze on-body visualization');
  }
  return json.data;
}

export async function requestExtractOutfitPieces(
  payload: {
    imageBase64: string;
    profileId: string;
    mimeType?: string;
    existingItems?: any[];
  },
  customApiKey?: string
): Promise<ExtractOutfitPiecesResponse> {
  const res = await fetch('/api/gemini/extract-outfit-pieces', {
    method: 'POST',
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to deconstruct outfit pieces with Gemini Flash');
  }
  return json.data;
}

