import { useEffect, useState, type CSSProperties } from 'react';

import logoUrl from '@/assets/snailracer-logo.svg';
import { cn } from '@/lib/cn';

/** Las letras empiezan a salir cuando el caracol ya frenó (sr-arrive dura 1.6s). */
const LETTERS_START_MS = 1500;
const LETTER_STEP_MS = 80;
/** Pausa extra entre "Snail" y "Racer". */
const WORD_GAP_MS = 160;

const WORDS = [
  { text: 'Snail', className: undefined },
  { text: 'Racer', className: 'text-primary' },
] as const;

/** Cada letra con su retraso de aparición, en orden a lo largo de las dos palabras. */
const BRAND_WORDS = WORDS.map((word, wordIndex) => {
  const lettersBefore = WORDS.slice(0, wordIndex).reduce((n, w) => n + w.text.length, 0);
  return {
    ...word,
    letters: [...word.text].map((char, i) => ({
      char,
      delayMs: LETTERS_START_MS + (lettersBefore + i) * LETTER_STEP_MS + wordIndex * WORD_GAP_MS,
    })),
  };
});

const SPEED_LINES = [
  { top: '34%', width: '55%' },
  { top: '50%', width: '80%' },
  { top: '66%', width: '45%' },
] as const;

const DUST_PUFFS = [
  { left: '18%', dx: '-34px', size: 'size-5' },
  { left: '34%', dx: '-16px', size: 'size-7' },
  { left: '62%', dx: '22px', size: 'size-4' },
] as const;

/**
 * La entrada corre una sola vez por carga de página: al ir de login a registro
 * (o volver tras cerrar sesión) la marca ya aparece en su lugar.
 */
let introPlayed = false;

/** Logo y nombre del panel de marca, con la entrada animada (styles.md §7). */
export function AnimatedBrand() {
  const [animate] = useState(() => !introPlayed);

  useEffect(() => {
    introPlayed = true;
  }, []);

  return (
    <>
      <div className="relative">
        <div className={cn('relative', animate && 'sr-arrive')}>
          {animate &&
            SPEED_LINES.map(({ top, width }) => (
              <span
                key={top}
                aria-hidden="true"
                className="sr-speed absolute right-full mr-2 h-1 bg-surface"
                style={{ top, width }}
              />
            ))}
          <img
            src={logoUrl}
            alt=""
            width={240}
            height={240}
            className="block size-[clamp(96px,18vw,240px)]"
          />
        </div>
        {animate &&
          DUST_PUFFS.map(({ left, dx, size }) => (
            <span
              key={left}
              aria-hidden="true"
              className={cn('sr-dust absolute bottom-0 rounded-full bg-surface', size)}
              style={{ left, '--sr-dx': dx } as CSSProperties}
            />
          ))}
      </div>

      <p className="font-display text-[clamp(48px,5.4vw,78px)] leading-none font-semibold tracking-[-0.02em]">
        <span className="sr-only">SnailRacer</span>
        <span aria-hidden="true">
          {BRAND_WORDS.map(({ text, className, letters }) => (
            <span key={text} className={className}>
              {letters.map(({ char, delayMs }) => (
                <span
                  key={delayMs}
                  className={cn(animate && 'sr-l')}
                  style={animate ? { animationDelay: `${delayMs}ms` } : undefined}
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </span>
      </p>
    </>
  );
}
