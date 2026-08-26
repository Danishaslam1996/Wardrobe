const fs = require('fs');
let content = fs.readFileSync('src/store/useWardrobeStore.ts', 'utf8');

content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { get, set } from 'idb-keyval';");

// Replace all localStorage.setItem calls inside useEffects
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.ACTIVE_PROFILE, activeProfileId\);/g, "localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId);\n    set(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.WARDROBE_ITEMS, JSON\.stringify\(items\)\);/g, "if (isHydrated) set(STORAGE_KEYS.WARDROBE_ITEMS, items).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.OUTFITS, JSON\.stringify\(outfits\)\);/g, "if (isHydrated) set(STORAGE_KEYS.OUTFITS, outfits).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.CALENDAR_PLANS, JSON\.stringify\(calendarPlans\)\);/g, "if (isHydrated) set(STORAGE_KEYS.CALENDAR_PLANS, calendarPlans).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.TRIPS, JSON\.stringify\(trips\)\);/g, "if (isHydrated) set(STORAGE_KEYS.TRIPS, trips).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.BUY_SKIP_SCANS, JSON\.stringify\(buySkipScans\)\);/g, "if (isHydrated) set(STORAGE_KEYS.BUY_SKIP_SCANS, buySkipScans).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.WEATHER, JSON\.stringify\(weather\)\);/g, "if (isHydrated) set(STORAGE_KEYS.WEATHER, weather).catch(console.error);");

const loadSequence = `
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const p = await get(STORAGE_KEYS.ACTIVE_PROFILE);
        if (p) setActiveProfileIdState(p);
        const i = await get(STORAGE_KEYS.WARDROBE_ITEMS);
        if (i && i.length > 0) setItems(i);
        const o = await get(STORAGE_KEYS.OUTFITS);
        if (o && o.length > 0) setOutfits(o);
        const c = await get(STORAGE_KEYS.CALENDAR_PLANS);
        if (c && c.length > 0) setCalendarPlans(c);
        const t = await get(STORAGE_KEYS.TRIPS);
        if (t && t.length > 0) setTrips(t);
        const b = await get(STORAGE_KEYS.BUY_SKIP_SCANS);
        if (b && b.length > 0) setBuySkipScans(b);
        const w = await get(STORAGE_KEYS.WEATHER);
        if (w) setWeather(w);
      } catch(e) {
        console.error(e);
      } finally {
        setIsHydrated(true);
      }
    }
    load();
  }, []);
`;
content = content.replace("export function useWardrobeStore() {", "export function useWardrobeStore() {" + loadSequence);

// Also add isHydrated to useEffect dependencies
content = content.replace(/\[items\]\);/g, "[items, isHydrated]);");
content = content.replace(/\[outfits\]\);/g, "[outfits, isHydrated]);");
content = content.replace(/\[calendarPlans\]\);/g, "[calendarPlans, isHydrated]);");
content = content.replace(/\[trips\]\);/g, "[trips, isHydrated]);");
content = content.replace(/\[buySkipScans\]\);/g, "[buySkipScans, isHydrated]);");
content = content.replace(/\[weather\]\);/g, "[weather, isHydrated]);");

fs.writeFileSync('src/store/useWardrobeStore.ts', content);
