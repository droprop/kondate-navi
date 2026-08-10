'use client';

import { MoreVertical, Share, Smartphone } from 'lucide-react';
import { useModalDialog } from '../lib/useModalDialog';

interface InstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceOS: 'ios' | 'android' | 'other';
}

export default function InstallDialog({ isOpen, onClose, deviceOS }: InstallDialogProps) {
  const { ref, handleLightDismiss } = useModalDialog(isOpen, onClose);

  return (
    <dialog
      ref={ref}
      closedby="any"
      onClose={onClose}
      onClick={handleLightDismiss}
      className="fixed bottom-4 left-0 right-0 w-[calc(100%-2rem)] max-w-md mx-auto bg-white rounded-[2rem] z-50 p-6 shadow-2xl border border-stone-100 flex flex-col"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-6">
        <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 mb-2">
          <Smartphone size={32} />
        </div>
        <h2 className="text-xl font-bold text-stone-800 tracking-tight">スマホにアプリとして追加</h2>
        <p className="text-sm text-stone-500 leading-relaxed font-medium">
          ホーム画面に追加すると、次回からアイコンをタップするだけで<strong>サクッと全画面</strong>で給食を確認できるようになります！
        </p>
      </div>

      <div className="bg-stone-50 rounded-2xl p-5 mb-6 border border-stone-100">
        {deviceOS === 'ios' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-600 font-bold shadow-sm shrink-0">1</div>
              <p className="text-sm font-medium text-stone-700 flex-1">
                画面下部のメニューから <Share size={16} className="inline text-blue-600 mx-1" /> <strong>共有ボタン</strong> をタップ
              </p>
            </div>
            <div className="w-px h-4 bg-stone-300 ml-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-600 font-bold shadow-sm shrink-0">2</div>
              <p className="text-sm font-medium text-stone-700 flex-1">
                少し下にスクロールして<br/><strong>「ホーム画面に追加」</strong>をタップ
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-600 font-bold shadow-sm shrink-0">1</div>
              <p className="text-sm font-medium text-stone-700 flex-1">
                画面右上（または右下）の <MoreVertical size={16} className="inline text-stone-600 mx-1" /> <strong>メニュー</strong> をタップ
              </p>
            </div>
            <div className="w-px h-4 bg-stone-300 ml-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-600 font-bold shadow-sm shrink-0">2</div>
              <p className="text-sm font-medium text-stone-700 flex-1">
                <strong>「ホーム画面に追加」</strong> または<br/><strong>「アプリをインストール」</strong> をタップ
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-3.5 bg-stone-800 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-md"
      >
        とじる
      </button>
    </dialog>
  );
}
