'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Item = { href: string; label: string; icon: JSX.Element };

const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path
      d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-9z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);
const OrderIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path
      d="M3 6h2l2 11h11l2-8H7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <circle cx="9" cy="20" r="1.4" fill="currentColor" />
    <circle cx="17" cy="20" r="1.4" fill="currentColor" />
  </svg>
);
const HistoryIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect
      x="4"
      y="5"
      width="16"
      height="15"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 10h8M8 14h8M8 17h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const DepositIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 10h18M8 15h3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const AkunIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 21c0-4 4-7 8-7s8 3 8 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const baseItems: Item[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/order', label: 'Order', icon: OrderIcon },
  { href: '/history', label: 'Orders', icon: HistoryIcon },
  { href: '/deposit', label: 'Deposit', icon: DepositIcon },
  { href: '/profile', label: 'Akun', icon: AkunIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register')
  )
    return null;

  const items = isAdmin
    ? [
        ...baseItems.slice(0, 4),
        {
          href: '/admin/withdraw',
          label: 'Admin',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path
                d="M12 3l8 4v5c0 5-3.4 8.5-8 9-4.6-.5-8-4-8-9V7l8-4z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          ),
        },
      ]
    : baseItems;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-[420px] px-3 pb-3 pointer-events-auto">
        <div className="bg-card/95 backdrop-blur-md border border-card-ring rounded-2xl flex justify-between px-2 py-2 shadow-card">
          {items.map((it) => {
            const active =
              it.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition ${
                  active ? 'text-brand-400' : 'text-ink-dim'
                }`}
              >
                {it.icon}
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
