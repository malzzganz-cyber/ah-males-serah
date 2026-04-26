'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

export default function Header({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const { user, userData } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="px-4 pt-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="none">
              <path
                d="M4 20V6l4 5 4-5 4 5 4-5v14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-lg leading-none">
              Malzz <span className="text-brand-400">Nokos</span>
            </p>
            {title && (
              <p className="text-[11px] text-ink-muted mt-1">{title}</p>
            )}
          </div>
        </div>
        <Link
          href={user ? '/profile' : '/login'}
          className="relative w-10 h-10 rounded-full bg-card border border-card-ring flex items-center justify-center hover:bg-card-soft transition"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-ink">
            <path
              d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M10 18a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-400" />
        </Link>
      </div>
      {subtitle && (
        <p className="text-xs text-ink-muted mt-2 px-0.5">{subtitle}</p>
      )}
    </motion.header>
  );
}
