const fs = require('fs');

const content = `import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, wardrobeItemsCol, outfitsCol, calendarPlansCol, tripsCol, buySkipScansCol } from '../lib/firebase';
import {
  ProfileId,
  WardrobeItem,
  Outfit,
  CalendarDayPlan,
  TripCapsule,
  BuySkipScanResult,
  ClothingCategory,
} from '../types';
import {
  INITIAL_WARDROBE_ITEMS,
  INITIAL_OUTFITS,
  INITIAL_CALENDAR_PLANS,
  INITIAL_TRIPS,
  PROFILES,
} from '../data/seedData';

const STORAGE_KEYS = {
  ACTIVE_PROFILE: 'dailythreads_active_profile',
  CUSTOM_API_KEY: 'dailythreads_custom_gemini_key',
  WEATHER: 'dailythreads_weather',
};

export interface WeatherData {
  city: string;
  tempC: number;
  humidity: number;
  condition: string;
  isCustom: boolean;
}

const DEFAULT_WEATHER_DATA: WeatherData = {
  city: 'Abu Dhabi',
  tempC: 33,
  humidity: 60,
  condition: 'Warm & Sunny',
  isCustom: false,
};

// Helper to seed initial data to Firestore if empty
let seedInitiated = false;
async function seedInitialDataIfNeeded(collectionName, items) {
  if (seedInitiated) return;
  seedInitiated = true;
  // This is a simplified seeder. In production you'd check if the collection is empty first.
}

export function useWardrobeStore() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeProfileId, setActiveProfileIdState] = useState<ProfileId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
    return saved === 'eesha' ? 'eesha' : 'danish';
  });

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendarPlans, setCalendarPlans] = useState<CalendarDayPlan[]>([]);
  const [trips, setTrips] = useState<TripCapsule[]>([]);
  const [buySkipScans, setBuySkipScans] = useState<BuySkipScanResult[]>([]);

  const [customApiKey, setCustomApiKeyState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) || '';
  });

  const [weather, setWeather] = useState<WeatherData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEATHER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.city === 'string') return parsed;
      } catch (e) {
        console.error('Failed to parse saved weather', e);
      }
    }
    return DEFAULT_WEATHER_DATA;
  });

  useEffect(() => {
    const unsubItems = onSnapshot(wardrobeItemsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as WardrobeItem);
      // Seed if empty on first load (mock check for demo purposes)
      if (data.length === 0 && !seedInitiated) {
        seedInitiated = true;
        INITIAL_WARDROBE_ITEMS.forEach(item => {
          setDoc(doc(wardrobeItemsCol, item.id), item).catch(console.error);
        });
      }
      setItems(data);
    });

    const unsubOutfits = onSnapshot(outfitsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Outfit);
      if (data.length === 0 && seedInitiated) {
        INITIAL_OUTFITS.forEach(outfit => {
          setDoc(doc(outfitsCol, outfit.id), outfit).catch(console.error);
        });
      }
      setOutfits(data);
    });

    const unsubCalendar = onSnapshot(calendarPlansCol, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as CalendarDayPlan);
      setCalendarPlans(data);
    });

    const unsubTrips = onSnapshot(tripsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as TripCapsule);
      setTrips(data);
    });

    const unsubScans = onSnapshot(buySkipScansCol, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as BuySkipScanResult);
      setBuySkipScans(data);
    });

    // Assume hydrated once listeners attached
    setTimeout(() => setIsHydrated(true), 500);

    return () => {
      unsubItems();
      unsubOutfits();
      unsubCalendar();
      unsubTrips();
      unsubScans();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEATHER, JSON.stringify(weather));
  }, [weather]);

  const setCustomApiKey = (key: string) => {
    setCustomApiKeyState(key);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key);
  };

  const switchProfile = (profileId: ProfileId) => {
    setActiveProfileIdState(profileId);
  };

  // Profile-filtered items
  const activeProfile = PROFILES[activeProfileId];
  const profileItems = items.filter((item) => item.profileId === activeProfileId);
  const cleanProfileItems = profileItems.filter((item) => !item.isLaundry);
  const profileOutfits = outfits.filter((outfit) => outfit.profileId === activeProfileId);
  const profileCalendarPlans = calendarPlans.filter((plan) => plan.profileId === activeProfileId);
  const profileTrips = trips.filter((trip) => trip.profileId === activeProfileId);
  const profileScans = buySkipScans.filter((scan) => scan.profileId === activeProfileId);

  // Item Actions
  const addItem = async (itemData: Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>) => {
    const newItem: WardrobeItem = {
      ...itemData,
      id: \`item-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`,
      profileId: activeProfileId,
      wearCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(wardrobeItemsCol, newItem.id), newItem);
    return newItem;
  };

  const addMultipleItems = async (
    itemsData: Array<Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>>
  ) => {
    const createdItems: WardrobeItem[] = itemsData.map((data, index) => ({
      ...data,
      id: \`item-\${Date.now()}-\${index}-\${Math.random().toString(36).substr(2, 4)}\`,
      profileId: activeProfileId,
      wearCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await Promise.all(createdItems.map(item => setDoc(doc(wardrobeItemsCol, item.id), item)));
    return createdItems;
  };

  const updateItem = async (itemId: string, updates: Partial<WardrobeItem>) => {
    await updateDoc(doc(wardrobeItemsCol, itemId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteItem = async (itemId: string) => {
    await deleteDoc(doc(wardrobeItemsCol, itemId));
    // Also remove from outfits
    const affectedOutfits = outfits.filter(o => o.itemIds.includes(itemId));
    await Promise.all(affectedOutfits.map(o => 
      updateDoc(doc(outfitsCol, o.id), { itemIds: o.itemIds.filter(id => id !== itemId) })
    ));
  };

  const toggleLaundry = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      await updateDoc(doc(wardrobeItemsCol, itemId), {
        isLaundry: !item.isLaundry,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const incrementWearCount = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      await updateDoc(doc(wardrobeItemsCol, itemId), {
        wearCount: item.wearCount + 1,
        lastWornDate: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Outfit Actions
  const addOutfit = async (outfitData: Omit<Outfit, 'id' | 'profileId' | 'createdAt' | 'wearCount'>) => {
    const newOutfit: Outfit = {
      ...outfitData,
      id: \`outfit-\${Date.now()}\`,
      profileId: activeProfileId,
      wearCount: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(outfitsCol, newOutfit.id), newOutfit);
    return newOutfit;
  };

  const updateOutfit = async (outfitId: string, updates: Partial<Outfit>) => {
    await updateDoc(doc(outfitsCol, outfitId), updates);
  };

  const deleteOutfit = async (outfitId: string) => {
    await deleteDoc(doc(outfitsCol, outfitId));
  };

  const toggleFavoriteOutfit = async (outfitId: string) => {
    const outfit = outfits.find(o => o.id === outfitId);
    if (outfit) {
      await updateDoc(doc(outfitsCol, outfitId), { isFavorite: !outfit.isFavorite });
    }
  };

  // Calendar & OOTD Actions
  const setCalendarPlan = async (plan: Omit<CalendarDayPlan, 'profileId'>) => {
    const newPlan = { ...plan, profileId: activeProfileId };
    await setDoc(doc(calendarPlansCol, \`\${activeProfileId}_\${plan.date}\`), newPlan);
  };

  const logSelfieOotd = async (date: string, selfieUrl: string, drapeNotes?: string) => {
    const planId = \`\${activeProfileId}_\${date}\`;
    const existing = calendarPlans.find((p) => p.profileId === activeProfileId && p.date === date);
    
    if (existing) {
      await updateDoc(doc(calendarPlansCol, planId), {
        selfieOotdUrl: selfieUrl,
        ...(drapeNotes ? { customNotes: drapeNotes } : {}),
        selfieLoggedAt: new Date().toISOString()
      });
    } else {
      const newPlan: CalendarDayPlan = {
        id: date,
        profileId: activeProfileId,
        date,
        selfieOotdUrl: selfieUrl,
        customNotes: drapeNotes,
        selfieLoggedAt: new Date().toISOString(),
      };
      await setDoc(doc(calendarPlansCol, planId), newPlan);
    }
  };

  // Trip Capsule Actions
  const addTrip = async (tripData: Omit<TripCapsule, 'id' | 'profileId' | 'createdAt'>) => {
    const newTrip: TripCapsule = {
      ...tripData,
      id: \`trip-\${Date.now()}\`,
      profileId: activeProfileId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(tripsCol, newTrip.id), newTrip);
    return newTrip;
  };

  const updateTripChecklist = async (tripId: string, checklistId: string, isPacked: boolean) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const newChecklist = trip.packingChecklist.map(c => 
        c.id === checklistId ? { ...c, isPacked } : c
      );
      await updateDoc(doc(tripsCol, tripId), { packingChecklist: newChecklist });
    }
  };

  const addBuySkipScan = async (scan: Omit<BuySkipScanResult, 'id' | 'profileId' | 'scannedAt'>) => {
    const newScan: BuySkipScanResult = {
      ...scan,
      id: \`scan-\${Date.now()}\`,
      profileId: activeProfileId,
      scannedAt: new Date().toISOString(),
    };
    await setDoc(doc(buySkipScansCol, newScan.id), newScan);
    return newScan;
  };

  const resetToSeedData = async () => {
    // Only resets local state for visual effect, a true reset would require deleting all docs in Firestore
    INITIAL_WARDROBE_ITEMS.forEach(item => setDoc(doc(wardrobeItemsCol, item.id), item));
    INITIAL_OUTFITS.forEach(outfit => setDoc(doc(outfitsCol, outfit.id), outfit));
    INITIAL_CALENDAR_PLANS.forEach(plan => setDoc(doc(calendarPlansCol, plan.id), plan));
    INITIAL_TRIPS.forEach(trip => setDoc(doc(tripsCol, trip.id), trip));
  };

  return {
    activeProfileId,
    activeProfile,
    switchProfile,
    items,
    profileItems,
    cleanProfileItems,
    outfits,
    profileOutfits,
    calendarPlans,
    profileCalendarPlans,
    trips,
    profileTrips,
    buySkipScans,
    profileScans,
    customApiKey,
    setCustomApiKey,
    weather,
    setWeather,
    // Actions
    addItem,
    addMultipleItems,
    updateItem,
    deleteItem,
    toggleLaundry,
    incrementWearCount,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavoriteOutfit,
    setCalendarPlan,
    logSelfieOotd,
    addTrip,
    updateTripChecklist,
    addBuySkipScan,
    resetToSeedData,
  };
}
`;
fs.writeFileSync('src/store/useWardrobeStore.ts', content);
