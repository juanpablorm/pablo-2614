import { LogOut } from 'lucide-react';

import logoUrl from '@/assets/snailracer-logo.svg';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { getBalanceCents } from '@/features/wallet/walletService';
import { formatCents } from '@/lib/money';

export function DashboardPage() {
  const { user, logout } = useAuth();
  // ProtectedRoute garantiza la sesión; esto solo satisface al tipo.
  if (!user) return null;

  const balanceCents = getBalanceCents(user.id);

  return (
    <div className="min-h-dvh">
      <title>Dashboard · SnailRacer</title>
      <header className="border-b-2 border-surface">
        <div className="mx-auto flex min-h-20 max-w-(--container-content) flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="" width={42} height={42} className="size-[42px]" />
            <span className="font-display text-2xl font-semibold">
              Snail<span className="text-primary">Racer</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-secondary font-display font-semibold text-bg"
              >
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="font-semibold">{user.fullName}</span>
            </span>
            <Button variant="secondary" onClick={logout}>
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-(--container-content) px-4 py-10">
        <h1 className="mb-8 text-[40px] font-semibold tracking-[-0.01em]">Hola, {user.fullName}</h1>
        <section aria-labelledby="balance-title" className="max-w-md bg-text p-8 text-bg">
          <h2
            id="balance-title"
            className="font-body text-sm font-bold tracking-[0.08em] text-surface uppercase"
          >
            Saldo disponible
          </h2>
          <p className="mt-3 font-display text-[56px] leading-none font-semibold tracking-[-0.02em]">
            {formatCents(balanceCents)}
          </p>
          <p className="mt-2 text-sm text-surface">MXN</p>
        </section>
      </main>
    </div>
  );
}
