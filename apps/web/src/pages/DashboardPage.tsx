import { LogOut } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import logoUrl from '@/assets/snailracer-logo.svg';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import type { PublicUser } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/useAuth';
import { BetsDonutChart } from '@/features/stats/components/BetsDonutChart';
import { RaceResultsList } from '@/features/stats/components/RaceResultsList';
import { SnailWinsBarChart } from '@/features/stats/components/SnailWinsBarChart';
import { generateRaceDay, toLocalDateSeed } from '@/features/stats/mockRaceDay';
import { BalanceCard } from '@/features/wallet/components/BalanceCard';
import { ChargeHistory } from '@/features/wallet/components/ChargeHistory';
import { TopUpDialog } from '@/features/wallet/components/TopUpDialog';
import { useWallet } from '@/features/wallet/useWallet';

export function DashboardPage() {
  const { user, logout, refreshSession } = useAuth();
  // ProtectedRoute garantiza la sesión; esto solo satisface al tipo.
  if (!user) return null;
  // key: si otra pestaña inicia sesión con otra cuenta, el saldo se vuelve a leer desde cero.
  return (
    <Dashboard key={user.id} user={user} onLogout={logout} onCorruptData={refreshSession} />
  );
}

interface DashboardProps {
  user: PublicUser;
  onLogout: () => void;
  /** Datos guardados ilegibles: revalidar la sesión, que manda a /login con aviso. */
  onCorruptData: () => void;
}

function Dashboard({ user, onLogout, onCorruptData }: DashboardProps) {
  // La semilla es la fecha local: los datos no cambian al recargar durante el día.
  const raceDay = useMemo(() => generateRaceDay(toLocalDateSeed()), []);
  const wallet = useWallet(user.id, onCorruptData);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const topUpButtonRef = useRef<HTMLButtonElement>(null);
  const historyTitleRef = useRef<HTMLHeadingElement>(null);
  // A dónde regresa el foco al cerrar el modal: Recargar, o el historial con "Ver historial".
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function openTopUp() {
    returnFocusRef.current = topUpButtonRef.current;
    setTopUpOpen(true);
  }

  function showHistory() {
    returnFocusRef.current = historyTitleRef.current;
    setTopUpOpen(false);
  }

  return (
    <div className="min-h-dvh">
      <title>Inicio SnailRacer</title>
      <header className="border-b-2 border-surface">
        <div className="mx-auto flex min-h-20 max-w-(--container-content) flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="" width={42} height={42} className="size-[42px]" />
            {/* "Racer" en óxido: el naranja no da contraste sobre el fondo claro. */}
            <span className="font-display text-2xl font-semibold">
              Snail<span className="text-accent">Racer</span>
            </span>
          </div>
          {/* En celular solo avatar y botón de ícono: el nombre ya está en el saludo. */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-semibold text-bg"
              >
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 font-semibold break-words sm:inline">
                {user.fullName}
              </span>
            </span>
            <Button variant="secondary" onClick={onLogout} className="shrink-0 px-3 sm:px-4">
              <LogOut aria-hidden="true" className="size-4" />
              <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-(--container-content) px-4 py-8 sm:py-10">
        <h1 className="mb-6 text-[28px] leading-tight font-semibold tracking-[-0.01em] break-words sm:mb-8 sm:text-[40px]">
          Hola, {user.fullName}
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <BalanceCard
            balanceCents={wallet.balanceCents}
            onTopUp={openTopUp}
            topUpButtonRef={topUpButtonRef}
          />

          <Card aria-labelledby="wins-title" className="lg:col-span-2">
            <CardTitle id="wins-title" className="mb-5">
              Victorias por caracol
            </CardTitle>
            <SnailWinsBarChart winsBySnail={raceDay.winsBySnail} />
          </Card>

          <Card aria-labelledby="bets-title">
            <CardTitle id="bets-title" className="mb-5">
              Apuestas del día
            </CardTitle>
            <BetsDonutChart summary={raceDay.betsSummary} />
          </Card>

          <Card aria-labelledby="races-title" className="lg:col-span-2">
            <CardTitle id="races-title" className="mb-5">
              Resultados de las carreras
            </CardTitle>
            <RaceResultsList races={raceDay.races} bets={raceDay.bets} />
          </Card>

          <Card aria-labelledby="history-title" className="lg:col-span-3">
            <CardTitle id="history-title" ref={historyTitleRef} tabIndex={-1} className="mb-5">
              Historial de recargas
            </CardTitle>
            <ChargeHistory history={wallet.history} />
          </Card>
        </div>
      </main>

      {/* Se monta solo al abrir: cada recarga empieza con el formulario limpio. */}
      {topUpOpen && (
        <TopUpDialog
          user={user}
          onClose={() => setTopUpOpen(false)}
          onResult={wallet.apply}
          onShowHistory={showHistory}
          finalFocusRef={returnFocusRef}
        />
      )}
    </div>
  );
}
