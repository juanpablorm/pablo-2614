import type { ChargeRequest, ChargeResponse } from '@snailracer/shared';
import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readSession } from '@/lib/storage';

import { registerAndOpenDashboard } from '../../utils/registerAndOpenDashboard';
import { chargeResponse, rejectedResponse } from './fixtures';

type FetchArgs = [url: string, init: RequestInit];

/** fetch simulado: responde con `build(request)` y el código indicado. */
function stubSnailpay(status: number, build: (request: ChargeRequest) => ChargeResponse) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const request = JSON.parse(init.body as string) as ChargeRequest;
    return Response.json(build(request), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const echo = (request: ChargeRequest) => ({
  payer_id: request.payer_id,
  payer_email: request.payer_email,
  card_number: request.card_number,
  cvv: request.cvv,
  transaction_amount: request.amount,
});

const balanceRegion = () => screen.getByRole('region', { name: 'Saldo disponible' });
const historyRegion = () => screen.getByRole('region', { name: 'Historial de recargas' });

async function openTopUp(user: UserEvent) {
  await user.click(within(balanceRegion()).getByRole('button', { name: 'Recargar' }));
  return screen.findByRole('dialog', { name: 'Recargar saldo' });
}

async function fillForm(user: UserEvent, dialog: HTMLElement, card: string, amount = '250.50') {
  const scope = within(dialog);
  await user.type(scope.getByLabelText('Número de tarjeta'), card);
  await user.type(scope.getByLabelText('Vencimiento'), '1226');
  await user.type(scope.getByLabelText('CVV'), '543');
  await user.type(scope.getByLabelText('Monto (MXN)'), amount);
}

describe('recarga de saldo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('aprobada: actualiza el saldo y muestra el código de autorización', async () => {
    const fetchMock = stubSnailpay(201, (request) => chargeResponse(echo(request)));
    const user = await registerAndOpenDashboard();
    expect(within(historyRegion()).getByText('Aún no tienes recargas.')).toBeInTheDocument();

    const dialog = await openTopUp(user);
    await fillForm(user, dialog, '1234123412341234');

    // Máscaras y nombre prellenado desde la sesión.
    expect(within(dialog).getByLabelText('Número de tarjeta')).toHaveValue('1234 1234 1234 1234');
    expect(within(dialog).getByLabelText('Vencimiento')).toHaveValue('12/26');
    expect(within(dialog).getByLabelText('Nombre en la tarjeta')).toHaveValue('Arturo Torres');

    await user.click(within(dialog).getByRole('button', { name: 'Recargar $250.50' }));

    const approved = await screen.findByRole('dialog', { name: '¡Recarga aprobada!' });
    expect(approved).toHaveTextContent('Se agregaron $250.50 a tu saldo.');
    expect(approved).toHaveTextContent('Código de autorización: A7K2Q9.');
    expect(within(balanceRegion()).getByText('$250.50')).toBeInTheDocument();

    // payer_id y payer_email salen de la sesión, no del formulario.
    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;
    expect(url).toBe('/api/snailpay/v1/charges');
    expect(JSON.parse(init.body as string)).toEqual({
      card_number: '1234123412341234',
      expiration_date: '12/26',
      cvv: '543',
      cardholder_name: 'Arturo Torres',
      amount: 250.5,
      payer_id: readSession()?.userId,
      payer_email: 'art@example.com',
    });

    await user.click(within(approved).getByRole('button', { name: 'Listo' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const history = historyRegion();
    expect(within(history).getByText('•••• 1234')).toBeInTheDocument();
    expect(within(history).getByText('Aprobada')).toBeInTheDocument();
    expect(history).not.toHaveTextContent('543');
    expect(history).not.toHaveTextContent('1234123412341234');
  });

  it('rechazada: muestra el mensaje y el saldo sigue igual', async () => {
    stubSnailpay(402, (request) => rejectedResponse(echo(request)));
    const user = await registerAndOpenDashboard();

    const dialog = await openTopUp(user);
    await fillForm(user, dialog, '4000000000000002');
    await user.click(within(dialog).getByRole('button', { name: 'Recargar $250.50' }));

    const rejected = await screen.findByRole('alertdialog', { name: 'Tarjeta rechazada' });
    expect(rejected).toHaveTextContent(
      'La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.',
    );
    expect(rejected).toHaveTextContent('No se hizo ningún cobro.');
    expect(within(balanceRegion()).getByText('$0.00')).toBeInTheDocument();

    await user.click(within(rejected).getByRole('button', { name: 'Cerrar' }));
    expect(within(historyRegion()).getByText('Rechazada')).toBeInTheDocument();
    expect(within(historyRegion()).getByText('•••• 0002')).toBeInTheDocument();
    expect(within(balanceRegion()).getByText('$0.00')).toBeInTheDocument();
  });

  it('deshabilita el botón mientras procesa: un doble clic cobra una sola vez', async () => {
    let respond: (response: Response) => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (respond = resolve)));
    vi.stubGlobal('fetch', fetchMock);
    const user = await registerAndOpenDashboard();

    const dialog = await openTopUp(user);
    await fillForm(user, dialog, '1234123412341234');
    await user.dblClick(within(dialog).getByRole('button', { name: 'Recargar $250.50' }));

    const processing = await within(dialog).findByRole('button', { name: /Procesando pago/ });
    expect(processing).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cerrar ventana' })).toBeDisabled();
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Esc no cierra mientras procesa.
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    respond(Response.json(chargeResponse(), { status: 201 }));
    await screen.findByRole('dialog', { name: '¡Recarga aprobada!' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('atrapa el foco, Esc cierra y el foco vuelve a Recargar', async () => {
    const user = await registerAndOpenDashboard();
    const trigger = within(balanceRegion()).getByRole('button', { name: 'Recargar' });

    const dialog = await openTopUp(user);
    const cardInput = within(dialog).getByLabelText('Número de tarjeta');
    const closeButton = within(dialog).getByRole('button', { name: 'Cerrar ventana' });
    const submitButton = within(dialog).getByRole('button', { name: 'Recargar' });
    expect(cardInput).toHaveFocus();

    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(submitButton).toHaveFocus(); // salta al último, no sale del modal
    await user.tab();
    expect(closeButton).toHaveFocus(); // y del último vuelve al primero

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
