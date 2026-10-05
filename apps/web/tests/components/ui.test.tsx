import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from '@/components/ui/FormField';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

describe('LoadingScreen', () => {
  it('anuncia la carga como estado', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });
});

describe('FormField', () => {
  it('liga ayuda y error al control con aria-describedby', () => {
    render(
      <FormField id="campo" label="Monto" hint="Mínimo $50.00" error="Ingresa un monto.">
        {(control) => <input {...control} />}
      </FormField>,
    );

    const input = screen.getByLabelText('Monto');
    expect(input).toHaveAttribute('aria-describedby', 'campo-hint campo-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Mínimo $50.00 Ingresa un monto.');
  });

  it('no agrega aria-describedby si no hay ayuda ni error', () => {
    render(
      <FormField id="campo" label="Monto">
        {(control) => <input {...control} />}
      </FormField>,
    );

    expect(screen.getByLabelText('Monto')).not.toHaveAttribute('aria-describedby');
  });
});
