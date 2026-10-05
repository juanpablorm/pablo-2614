import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnimatedBrand } from '@/features/auth/components/AnimatedBrand';

const delayOf = (element: Element) => parseInt((element as HTMLElement).style.animationDelay, 10);

// El orden importa: la entrada se marca como vista en el primer montaje del archivo.
describe('AnimatedBrand', () => {
  it('en la primera carga anima el logo y luego las letras, en orden', () => {
    const { container, unmount } = render(<AnimatedBrand />);

    expect(container.querySelector('.sr-arrive img')).toHaveAttribute('alt', '');
    expect(container.querySelectorAll('.sr-speed')).toHaveLength(3);
    expect(container.querySelectorAll('.sr-dust')).toHaveLength(3);

    const letters = [...container.querySelectorAll('.sr-l')];
    expect(letters.map((letter) => letter.textContent).join('')).toBe('SnailRacer');

    const delays = letters.map(delayOf);
    // Las letras salen cuando el caracol ya frenó (la llegada dura 1.6s).
    expect(delays[0]).toBeGreaterThanOrEqual(1500);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1] ?? 0);
    }
    // Pausa extra antes de "Racer": el salto de la "l" a la "R" es mayor que entre letras.
    expect((delays[5] ?? 0) - (delays[4] ?? 0)).toBeGreaterThan(
      (delays[1] ?? 0) - (delays[0] ?? 0),
    );

    unmount();
  });

  it('el nombre se lee completo y las letras sueltas quedan ocultas al lector', () => {
    const { container } = render(<AnimatedBrand />);

    expect(screen.getByText('SnailRacer')).toHaveClass('sr-only');
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('no repite la entrada al volver a montarse en la misma carga de página', () => {
    const { container } = render(<AnimatedBrand />);

    expect(container.querySelector('.sr-arrive')).not.toBeInTheDocument();
    expect(container.querySelector('.sr-l')).not.toBeInTheDocument();
    expect(container.querySelector('.sr-dust')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
