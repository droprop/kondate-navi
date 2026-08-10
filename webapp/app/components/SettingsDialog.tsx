'use client';

import { ChevronDown, School } from 'lucide-react';
import { SCHOOL_CATEGORIES } from '../lib/schools';
import { useModalDialog } from '../lib/useModalDialog';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchool: string;
  onSelectSchool: (name: string) => void;
}

export default function SettingsDialog({ isOpen, onClose, selectedSchool, onSelectSchool }: SettingsDialogProps) {
  const { ref, handleLightDismiss } = useModalDialog(isOpen, onClose);

  return (
    <dialog
      ref={ref}
      closedby="any"
      onClose={onClose}
      onClick={handleLightDismiss}
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3.5rem] z-50 pt-5 pb-6 px-4 sm:px-8 sm:pt-6 sm:pb-8 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] border-t border-stone-100 max-h-[85vh] flex flex-col"
    >
      <div className="w-14 h-1.5 bg-stone-100 rounded-full mx-auto mb-4 shrink-0 cursor-pointer hover:bg-stone-200 transition-colors" onClick={onClose} />
      <div className="space-y-4 pb-2 overflow-hidden flex flex-col min-h-0 w-full">
        <div className="flex items-center gap-4 shrink-0 px-2 pb-2">
          <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 shrink-0">
            <School size={24} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">学校の設定</h2>
            <p className="text-xs text-stone-500 font-medium mt-1">お子様が通っている学校を選んでください</p>
          </div>
        </div>
        <div className="space-y-5 overflow-y-auto flex-1 px-1 custom-scrollbar min-h-0">
          {(Object.keys(SCHOOL_CATEGORIES) as Array<keyof typeof SCHOOL_CATEGORIES>).map((catKey) => {
            const cat = SCHOOL_CATEGORIES[catKey];
            return (
              <div key={catKey} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">{cat.icon}</span>
                  <h3 className="text-sm font-bold text-stone-500 tracking-widest">{cat.label}</h3>
                </div>
                <div className={`${catKey === 'juniorHigh' ? 'flex' : 'grid grid-cols-2'} gap-2`}>
                  {cat.schools.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        onSelectSchool(s.name);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl text-sm font-bold text-left transition-all border flex-1 ${
                        selectedSchool === s.name
                          ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 active:scale-95'
                          : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100 active:bg-stone-200'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center shrink-0 pt-2 pb-0">
          <span className="flex items-center gap-1 text-stone-500 font-bold text-[11px] px-3 py-1 bg-stone-50 rounded-full">
            <ChevronDown size={14} /> リストを下へスクロールできます
          </span>
        </div>

        <p className="text-[11px] text-stone-500 font-medium leading-relaxed text-center mt-3 shrink-0 px-4">
          ※選択した学校の献立が次回から自動的に表示されます
        </p>

        <button
          onClick={onClose}
          className="w-full mt-2 pt-3 pb-1 text-stone-500 font-bold text-sm tracking-widest active:text-orange-500 transition shrink-0 hover:text-stone-800"
        >
          とじる
        </button>
      </div>
    </dialog>
  );
}
