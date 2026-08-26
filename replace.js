const fs = require('fs');
let content = fs.readFileSync('src/store/useWardrobeStore.ts', 'utf8');

// Replace imports
content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { get, set } from 'idb-keyval';");

// Replace all localStorage.setItem calls with try/catch and idb-keyval calls
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.ACTIVE_PROFILE, activeProfileId\);/g, "localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId);\n    set(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.WARDROBE_ITEMS, JSON\.stringify\(items\)\);/g, "set(STORAGE_KEYS.WARDROBE_ITEMS, items).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.OUTFITS, JSON\.stringify\(outfits\)\);/g, "set(STORAGE_KEYS.OUTFITS, outfits).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.CALENDAR_PLANS, JSON\.stringify\(calendarPlans\)\);/g, "set(STORAGE_KEYS.CALENDAR_PLANS, calendarPlans).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.TRIPS, JSON\.stringify\(trips\)\);/g, "set(STORAGE_KEYS.TRIPS, trips).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.BUY_SKIP_SCANS, JSON\.stringify\(buySkipScans\)\);/g, "set(STORAGE_KEYS.BUY_SKIP_SCANS, buySkipScans).catch(console.error);");
content = content.replace(/localStorage\.setItem\(STORAGE_KEYS\.WEATHER, JSON\.stringify\(weather\)\);/g, "set(STORAGE_KEYS.WEATHER, weather).catch(console.error);");

// Now we need to modify the load sequence in a useEffect
const loadSequence = `
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const i = await get(STORAGE_KEYS.WARDROBE_ITEMS);
        if (i) setItems(i);
        const o = await get(STORAGE_KEYS.OUTFITS);
        if (o) setOutfits(o);
        const c = await get(STORAGE_KEYS.CALENDAR_PLANS);
        if (c) setCalendarPlans(c);
        const t = await get(STORAGE_KEYS.TRIPS);
        if (t) setTrips(t);
        const b = await get(STORAGE_KEYS.BUY_SKIP_SCANS);
        if (b) setBuySkipScans(b);
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

// Now for sync useEffects we need to add a check for isHydrated, wait I can't do that easily with regex.
// Instead I will just write a new file!
