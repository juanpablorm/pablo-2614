import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app/App';

describe('App', () => {
  it('muestra la marca como encabezado principal', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'SnailRacer' })).toBeInTheDocument();
  });

  it('trata el logo como decorativo', () => {
    const { container } = render(<App />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
