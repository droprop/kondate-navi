'use client';

import { useEffect, useRef } from 'react';

/**
 * ネイティブ <dialog> の開閉制御と light dismiss（背景クリックで閉じる）をまとめたフック。
 * closedBy 属性をサポートするブラウザではネイティブの挙動に任せ、
 * 未サポートのブラウザのみクリック座標判定でフォールバックする。
 */
export function useModalDialog(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleLightDismiss = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) return;
    const dialog = ref.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      onClose();
    }
  };

  return { ref, handleLightDismiss };
}
