'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';

export default function AdminBalancePage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [bal, setBal] = useState<any>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (!isAdmin) router.push('/');
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin-balance')
      .then((r) => r.json())
      .then((d) => setBal(d))
      .catch(() => setBal(null))
      .finally(() => setBusy(false));
  }, [isAdmin]);

  if (!isAdmin) return null;

  const balance = bal?.balance ?? bal?.data?.balance ?? bal?.saldo ?? 0;

  return (
    <>
      <Header title="💼 Admin Balance" subtitle="Saldo RumahOTP" />
      <section className="px-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="text-xs text-ink-muted">Saldo Vendor</div>
          {busy ? (
            <div className="skeleton h-9 w-40 mx-auto mt-2" />
          ) : (
            <div className="text-3xl font-extrabold text-brand-700 mt-1">
              Rp {Number(balance || 0).toLocaleString('id-ID')}
            </div>
          )}
          <button
            onClick={() => {
              setBusy(true);
              fetch('/api/admin-balance')
                .then((r) => r.json())
                .then((d) => setBal(d))
                .finally(() => setBusy(false));
            }}
            className="btn-secondary mt-4"
          >
            🔄 Refresh
          </button>
        </motion.div>
      </section>
    </>
  );
}
