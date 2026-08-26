import React from 'react';
import { WardrobeItem, ProfileId, Outfit, ClothingCategory, Vibe, Season } from '../types';
import { OutfitDeconstructorModal } from './OutfitDeconstructorModal';

interface ItemIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: ProfileId;
  existingItems?: WardrobeItem[];
  customApiKey?: string;
  onAddItem: (
    itemData: Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>
  ) => void;
  onAddMultipleItems?: (
    itemsData: Array<Omit<WardrobeItem, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'wearCount'>>
  ) => void;
  onSaveOutfit?: (
    outfitData: Omit<Outfit, 'id' | 'profileId' | 'createdAt' | 'wearCount'>
  ) => void;
  initialMode?: 'single' | 'deconstruct';
}

export const ItemIngestionModal: React.FC<ItemIngestionModalProps> = ({
  isOpen,
  onClose,
  profileId,
  existingItems = [],
  customApiKey,
  onAddItem,
  onAddMultipleItems,
  onSaveOutfit,
}) => {
  if (!isOpen) return null;

  const handleImport = (
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
  ) => {
    // 1. Add all new items
    if (items.length === 1 && onAddItem) {
      onAddItem(items[0]);
    } else if (items.length > 1 && onAddMultipleItems) {
      onAddMultipleItems(items);
    }

    // 2. Optionally create the outfit combining new and existing items
    if (createOutfitWithName && onSaveOutfit) {
      onSaveOutfit({
        name: createOutfitWithName,
        itemIds: existingMatchedItemIds || [],
        vibe: items[0]?.vibe?.[0] || 'casual',
      });
    }
  };

  return (
    <OutfitDeconstructorModal
      isOpen={isOpen}
      onClose={onClose}
      profileId={profileId}
      existingItems={existingItems}
      customApiKey={customApiKey}
      onImportItems={handleImport}
    />
  );
};
