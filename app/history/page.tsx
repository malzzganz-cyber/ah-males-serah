'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<'orders' | 'transactions'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q1 = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const q2 = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const u1 = onSnapshot(
      q1,
      (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
      () => {}
    );
    const u2 = onSnapshot(
      q2,
      (s) => setTxs(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
      () => {}
    );
    return () => {
      u1();
      u2();
    };
  }, [user]);

  return (
    <>
      <Header title="📜 Riwayat" subtitle="Order & transaksi kamu" />
      <section className="px-4 mt-5">
        <div className="flex bg-card-soft rounded-2xl p-1 mb-3">
          {(['orders', 'transactions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                tab === t ? 'bg-brand-500 text-black' : 'text-ink-muted'
              }`}
            >
              {t === 'orders' ? 'Orders' : 'Transaksi'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {tab === 'orders' &&
            (orders.length === 0 ? (
              <Empty text="Belum ada order" />
            ) : (
              orders.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="card !p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{o.service}</div>
                      <div className="text-[11px] text-ink-muted">
                        {o.country} · {o.operator}
                      </div>
                      <div className="text-xs text-brand-700 mt-1 font-mono">
                        {o.number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        Rp {(o.price || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-ink-dim">
                        {o.createdAt?.toDate?.().toLocaleString('id-ID') || ''}
                      </div>
                      <span
                        className={`chip mt-1 ${
                          o.status === 'received' || o.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.status === 'cancel'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {(o.status || 'waiting').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ))}

          {tab === 'transactions' &&
            (txs.length === 0 ? (
              <Empty text="Belum ada transaksi" />
            ) : (
              txs.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="card !p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-sm capitalize">{t.type}</div>
                    <div className="text-[10px] text-ink-dim">
                      {t.createdAt?.toDate?.().toLocaleString('id-ID') || ''}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      (t.amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(t.amount || 0) >= 0 ? '+' : ''}
                    Rp {Math.abs(t.amount || 0).toLocaleString('id-ID')}
                  </div>
                </motion.div>
              ))
            ))}
        </div>
      </section>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="card text-center text-sm text-ink-muted py-8">
      <div className="text-3xl mb-2">📭</div>
      {text}
    </div>
  );
}
