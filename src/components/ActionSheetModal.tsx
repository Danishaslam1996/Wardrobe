import React from 'react';
import { X, Shirt, Users, Layers, MessageSquare } from 'lucide-react';

interface ActionSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: 'add_clothes' | 'add_single_item' | 'create_outfit' | 'chat') => void;
}

export const ActionSheetModal: React.FC<ActionSheetModalProps> = ({ isOpen, onClose, onActionSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative bg-zinc-50 rounded-t-[32px] p-6 shadow-2xl pb-12 transition-transform transform translate-y-0">
        <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-6" />
        
        <div className="space-y-2">
          <button 
            onClick={() => { onActionSelect('add_clothes'); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <Layers className="w-6 h-6 text-black" />
              <span className="font-semibold text-[15px] text-black">Extract outfit items</span>
            </div>
            <span className="text-zinc-300">›</span>
          </button>
          
          <button 
            onClick={() => { onActionSelect('add_single_item'); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <Shirt className="w-6 h-6 text-black" />
              <span className="font-semibold text-[15px] text-black">Add single item</span>
            </div>
            <span className="text-zinc-300">›</span>
          </button>
          
          <button 
            onClick={() => { onActionSelect('create_outfit'); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <Layers className="w-6 h-6 text-black" />
              <span className="font-semibold text-[15px] text-black">Create outfit</span>
            </div>
            <span className="text-zinc-300">›</span>
          </button>
          
          <button 
            onClick={() => { onActionSelect('chat'); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-200">
                <img src="https://ui-avatars.com/api/?name=Noah&background=random" alt="Stylist" />
              </div>
              <span className="font-semibold text-[15px] text-black">Chat with AI stylist</span>
            </div>
            <span className="text-zinc-300">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};