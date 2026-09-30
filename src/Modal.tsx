import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const focus = document.activeElement as HTMLElement; ref.current?.showModal(); return () => { ref.current?.close(); focus?.focus(); }; }, []);
  return <dialog ref={ref} className={`course-modal ${className}`} aria-label={title} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}><div className="modal-inner"><button className="icon-button modal-close" aria-label="Kapat" onClick={onClose}><X size={20} /></button>{children}</div></dialog>;
}
