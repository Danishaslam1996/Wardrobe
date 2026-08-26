import React, { useState } from 'react';
import { IPhoneFrame } from './components/IPhoneFrame';
import { Header } from './components/Header';
import { NavigationTray, TabId } from './components/NavigationTray';
import { HomeDashboardView } from './components/HomeDashboardView';
import { AIOutfitWizard } from './components/AIOutfitWizard';
import { ActionSheetModal } from './components/ActionSheetModal';
import { WardrobeView } from './components/WardrobeView';
import { StudioView } from './components/StudioView';
import { DailyPickView } from './components/DailyPickView';
import { BuySkipScannerView } from './components/BuySkipScannerView';
import { TravelAnalyticsView } from './components/TravelAnalyticsView';
import { ItemIngestionModal } from './components/ItemIngestionModal';
import { SingleItemIngestModal } from './components/SingleItemIngestModal';
import { SettingsModal } from './components/SettingsModal';
import { WeatherModal } from './components/WeatherModal';
import { useWardrobeStore } from './store/useWardrobeStore';
import { WardrobeItem, Outfit } from './types';
import { soundService } from './lib/soundHaptics';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestModalMode, setIngestModalMode] = useState<'single' | 'deconstruct'>('single');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [preselectedStudioItem, setPreselectedStudioItem] = useState<WardrobeItem | null>(null);

  const {
    activeProfileId,
    switchProfile,
    profileItems,
    cleanProfileItems,
    profileOutfits,
    profileCalendarPlans,
    profileTrips,
    profileScans,
    weather,
    customApiKey,
    setCustomApiKey,
    addItem,
    addMultipleItems,
    updateItem,
    deleteItem,
    toggleLaundry,
    incrementWearCount,
    addOutfit,
    deleteOutfit,
    setCalendarPlan,
    logSelfieOotd,
    addTrip,
    updateTripChecklist,
    addBuySkipScan,
    setWeather,
    resetToSeedData,
  } = useWardrobeStore();

  const handleOpenIngest = (mode: 'single' | 'deconstruct' = 'single') => {
    soundService.playTap();
    setIngestModalMode(mode);
    setIsIngestModalOpen(true);
  };

  const handleTabSelect = (tab: TabId) => {
    soundService.playTap();
    setActiveTab(tab);
  };

  const handleStyleWithItem = (item: WardrobeItem) => {
    soundService.playChime();
    setPreselectedStudioItem(item);
    setActiveTab('studio');
  };

  const handleWearOutfit = (outfit: Outfit) => {
    soundService.playChime();
    // Increment wear count for each garment in the outfit
    outfit.itemIds.forEach((id) => incrementWearCount(id));
    // Assign to today in calendar
    setCalendarPlan({
      date: '2026-08-24',
      outfitId: outfit.id,
      customNotes: outfit.name,
      weatherSnapshot: {
        tempC: weather.tempC,
        humidity: weather.humidity,
        condition: weather.condition,
        location: weather.city,
      },
    });
  };

  return (
    <IPhoneFrame>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white text-zinc-900 select-none">
        {/* iOS Native Status & Profile Switcher Header */}
        <Header
          activeProfileId={activeProfileId}
          onSwitchProfile={(pid) => {
            soundService.playTap();
            switchProfile(pid);
          }}
          weather={weather}
          hasApiKey={Boolean(customApiKey)}
          onOpenWeatherModal={() => {
            soundService.playTap();
            setIsWeatherModalOpen(true);
          }}
          onOpenSettings={() => {
            soundService.playTap();
            setIsSettingsOpen(true);
          }}
        />

        {/* Dynamic View based on Active Tab */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'home' && (
            <HomeDashboardView
              recentItems={profileItems}
              recentOutfits={profileOutfits}
              onActionClick={(action) => {
                soundService.playTap();
                if (action === 'daily_pick' || action === 'find_outfit') {
                  setIsWizardOpen(true);
                }
                else if (action === 'planner') setActiveTab('daily');
                else if (action === 'dressing_room') setActiveTab('studio');
                else if (action === 'ai_try_on') setActiveTab('studio');
                else if (action === 'selfie') setActiveTab('scan');
                else if (action === 'scanner') setActiveTab('scan');
                else if (action === 'travel') setActiveTab('travel');
              }}
              onOpenOutfits={() => {
                soundService.playTap();
                setActiveTab('studio');
              }}
              onOpenItem={(item) => {
                soundService.playTap();
                setActiveTab('wardrobe');
              }}
            />
          )}
          {activeTab === 'wardrobe' && (
            <WardrobeView
              profileId={activeProfileId}
              items={profileItems}
              onOpenIngestModal={handleOpenIngest}
              onToggleLaundry={toggleLaundry}
              onDeleteItem={deleteItem}
              onUpdateItem={updateItem}
              onStyleWithItem={handleStyleWithItem}
            />
          )}

          {activeTab === 'studio' && (
            <StudioView
              profileId={activeProfileId}
              cleanItems={cleanProfileItems}
              savedOutfits={profileOutfits}
              customApiKey={customApiKey}
              onSaveOutfit={(outfit) => addOutfit(outfit)}
              onDeleteOutfit={deleteOutfit}
              onWearOutfit={handleWearOutfit}
              preselectedItem={preselectedStudioItem}
            />
          )}

          {activeTab === 'daily' && (
            <DailyPickView
              profileId={activeProfileId}
              cleanItems={cleanProfileItems}
              savedOutfits={profileOutfits}
              calendarPlans={profileCalendarPlans}
              weather={weather}
              customApiKey={customApiKey}
              onSetCalendarPlan={(plan) => setCalendarPlan(plan)}
              onLogSelfieOotd={(date, url, notes) => logSelfieOotd(date, url, notes)}
              onSaveOutfit={(outfit) => addOutfit(outfit)}
            />
          )}

          {activeTab === 'scan' && (
            <BuySkipScannerView
              profileId={activeProfileId}
              wardrobe={profileItems}
              recentScans={profileScans}
              customApiKey={customApiKey}
              onSaveScanResult={(scan) => addBuySkipScan(scan)}
              onAddPurchasedItem={(itemData) => addItem(itemData)}
            />
          )}

          {activeTab === 'travel' && (
            <TravelAnalyticsView
              profileId={activeProfileId}
              wardrobe={profileItems}
              trips={profileTrips}
              customApiKey={customApiKey}
              onAddTrip={(trip) => addTrip(trip)}
              onUpdateTripChecklist={(tripId, chkId, isPacked) =>
                updateTripChecklist(tripId, chkId, isPacked)
              }
            />
          )}
        </main>

        {/* iOS Frosted Glass Navigation Bar */}
        <NavigationTray 
          activeTab={activeTab} 
          onSelectTab={handleTabSelect} 
          onOpenActionSheet={() => {
            soundService.playTap();
            setIsActionSheetOpen(true);
          }}
        />

        {/* Action Sheet Modal */}
        <ActionSheetModal
          isOpen={isActionSheetOpen}
          onClose={() => setIsActionSheetOpen(false)}
          onActionSelect={(action) => {
            soundService.playTap();
            if (action === 'add_clothes') {
              handleOpenIngest('deconstruct');
            } else if (action === 'add_single_item') {
              handleOpenIngest('single');
            } else if (action === 'create_outfit') {
              setActiveTab('studio');
            } else if (action === 'chat') {
              setIsWizardOpen(true);
            }
          }}
        />

        {/* Vision AI Clothing Ingestion Modal */}
        {/* Single Item Ingest Modal */}
        <SingleItemIngestModal
          isOpen={isIngestModalOpen && ingestModalMode === 'single'}
          onClose={() => setIsIngestModalOpen(false)}
          profileId={activeProfileId}
          customApiKey={customApiKey}
          onAddItem={(itemData) => addItem(itemData)}
        />

        <ItemIngestionModal
          isOpen={isIngestModalOpen && ingestModalMode === 'deconstruct'}
          onClose={() => setIsIngestModalOpen(false)}
          profileId={activeProfileId}
          existingItems={profileItems}
          customApiKey={customApiKey}
          initialMode={ingestModalMode}
          onAddItem={(itemData) => addItem(itemData)}
          onAddMultipleItems={(itemsData) => addMultipleItems(itemsData)}
          onSaveOutfit={(outfitData) => addOutfit(outfitData)}
        />

        {/* BYOK Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          customApiKey={customApiKey || ''}
          onSaveApiKey={(key) => setCustomApiKey(key)}
          onResetData={resetToSeedData}
        />

        {/* Weather Simulator Modal */}
        <WeatherModal
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          weather={weather}
          currentWeather={weather}
          onSaveWeather={(updatedWeather) => setWeather(updatedWeather)}
        />

        {/* AI Outfit Wizard Modal */}
        <AIOutfitWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          profileId={activeProfileId}
          wardrobe={profileItems}
          customApiKey={customApiKey}
          onSaveOutfit={(outfit) => {
            addOutfit(outfit);
            setActiveTab('studio');
          }}
        />
      </div>
    </IPhoneFrame>
  );
}
