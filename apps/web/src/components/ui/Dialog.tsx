import { X } from 'lucide-react';
import { useEffect, useRef, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusable = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id del título visible del modal. */
  labelledBy: string;
  describedBy?: string;
  /** "alertdialog" para resultados que requieren atención (rechazo, error). */
  role?: 'dialog' | 'alertdialog';
  /** false mientras no se debe cerrar (p. ej. procesando un pago): Esc no hace nada. */
  dismissible?: boolean;
  busy?: boolean;
  /** A dónde regresa el foco al cerrar. Por defecto, al elemento que tenía el foco al abrir. */
  finalFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

/**
 * Modal accesible sin dependencias: foco atrapado (Tab / Shift+Tab), Esc cierra,
 * el resto de la página queda inerte y el foco regresa al cerrar.
 * Al abrir enfoca el elemento con `data-autofocus` o, si no hay, el primero enfocable.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  dismissible = true,
  busy = false,
  finalFocusRef,
  className,
  children,
}: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Foco inicial, página inerte, scroll bloqueado y foco de regreso.
  useEffect(() => {
    const container = containerRef.current;
    const panel = panelRef.current;
    if (!open || !container || !panel) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initial = panel.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable(panel)[0];
    (initial ?? panel).focus();

    const madeInert = [...document.body.children].filter(
      (element) => element !== container && !element.hasAttribute('inert'),
    );
    madeInert.forEach((element) => element.setAttribute('inert', ''));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      madeInert.forEach((element) => element.removeAttribute('inert'));
      document.body.style.overflow = previousOverflow;
      // Se lee al cerrar a propósito: quien abre puede cambiar el destino mientras está abierto.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- valor vigente al cerrar
      (finalFocusRef?.current ?? previouslyFocused)?.focus();
    };
  }, [open, finalFocusRef]);

  // Teclado: Esc cierra y Tab no sale del modal. Escucha en document para cubrir el caso
  // en que el foco quedó fuera (p. ej. al deshabilitarse el botón que lo tenía).
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (dismissible) onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable(panel);
      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/80 p-4"
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-busy={busy}
        tabIndex={-1}
        className={cn(
          'max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto bg-bg p-[30px] text-text shadow-modal',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Botón de ícono para cerrar el modal (44×44, styles.md §4). */
export function DialogCloseButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label="Cerrar ventana"
      className={cn(
        'flex size-(--touch-min) shrink-0 cursor-pointer items-center justify-center bg-surface text-text disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      <X aria-hidden="true" className="size-[18px]" />
    </button>
  );
}
