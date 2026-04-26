'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';

interface Country {
  id: string | number;
  name: string;
  flag?: string;
}
interface Service {
  id: string | number;
  name: string;
}
interface Operator {
  id: string | number;
  name: string;
}
interface Order {
  id: string;
  number?: string;
  service?: string;
  status?: string;
  otp?: string;
  createdAt?: any;
  price?: number;
}

const fmtRp = (n: number | undefined | null) =>
  'Rp ' + (n ?? 0).toLocaleString('id-ID');

const flagFromCountry = (name: string) => {
  const map: Record<string, string> = {
    indonesia: '🇮🇩',
    malaysia: '🇲🇾',
    singapore: '🇸🇬',
    philippines: '🇵🇭',
    vietnam: '🇻🇳',
    thailand: '🇹🇭',
    india: '🇮🇳',
    china: '🇨🇳',
    russia: '🇷🇺',
    brazil: '🇧🇷',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    uk: '🇬🇧',
    'united kingdom': '🇬🇧',
  };
  return map[name?.toLowerCase()] || '🌐';
};

export default function Home() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const balance = userData?.balance ?? 0;

  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [country, setCountry] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrder: 0,
    success: 0,
    spend: 0,
  });

  // Load countries on mount
  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((d) => {
        const list: any[] = Array.isArray(d) ? d : d.data || d.countries || [];
        const mapped: Country[] = list.map((c: any) => ({
          id: c.id ?? c.code ?? c.name,
          name: c.name || c.country || String(c.id),
        }));
        setCountries(mapped.length ? mapped : [{ id: 'id', name: 'Indonesia' }]);
        if (mapped[0]) setCountry(String(mapped[0].id));
      })
      .catch(() => {
        setCountries([{ id: 'id', name: 'Indonesia' }]);
        setCountry('id');
      });
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        const list: any[] = Array.isArray(d) ? d : d.data || d.services || [];
        const mapped: Service[] = list.map((s: any) => ({
          id: s.id ?? s.code ?? s.name,
          name: s.name || s.service || String(s.id),
        }));
        setServices(
          mapped.length ? mapped : [{ id: 'wa', name: 'WhatsApp' }]
        );
        if (mapped[0]) setService(String(mapped[0].id));
      })
      .catch(() => {
        setServices([{ id: 'wa', name: 'WhatsApp' }]);
        setService('wa');
      });
  }, []);

  // Load operators when country changes
  useEffect(() => {
    if (!country) return;
    fetch(`/api/operators?country_id=${encodeURIComponent(country)}`)
      .then((r) => r.json())
      .then((d) => {
        const list: any[] = Array.isArray(d) ? d : d.data || d.operators || [];
        const mapped: Operator[] = list.map((o: any) => ({
          id: o.id ?? o.code ?? o.name,
          name: o.name || o.operator || String(o.id),
        }));
        setOperators(
          mapped.length ? mapped : [{ id: 'any', name: 'Any Provider' }]
        );
        setOperator(mapped[0] ? String(mapped[0].id) : 'any');
      })
      .catch(() => {
        setOperators([{ id: 'any', name: 'Any Provider' }]);
        setOperator('any');
      });
  }, [country]);

  // Live recent orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setStats({ totalOrder: 0, success: 0, spend: 0 });
      return;
    }
    const q = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Order[];
        setOrders(list);
        const total = list.length;
        const ok = list.filter((o) =>
          ['success', 'completed', 'done', 'received'].includes(
            (o.status || '').toLowerCase()
          )
        ).length;
        const spend = list.reduce(
          (a, o) =>
            a +
            (['success', 'completed', 'done', 'received'].includes(
              (o.status || '').toLowerCase()
            )
              ? o.price || 0
              : 0),
          0
        );
        setStats({ totalOrder: total, success: ok, spend });
      },
      () => {
        setOrders([]);
      }
    );
    return () => unsub();
  }, [user]);

  const successRate = useMemo(() => {
    if (!stats.totalOrder) return 0;
    return Math.round((stats.success / stats.totalOrder) * 1000) / 10;
  }, [stats]);

  const goOrder = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const params = new URLSearchParams({
      country,
      operator,
      service,
    });
    router.push('/order?' + params.toString());
  };

  return (
    <>
      <Header />

      {/* Saldo Card */}
      <section className="px-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-xs text-ink-muted">Saldo Anda</p>
              <p className="text-2xl font-extrabold tracking-tight mt-1 text-brand-400">
                {fmtRp(balance)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={user ? '/deposit' : '/login'}
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 transition flex items-center justify-center text-black shadow-glow"
                aria-label="Top up"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="none">
                  <path
                    d="M4 20V6l4 5 4-5 4 5 4-5v14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4 Stat Cards 2x2 */}
      <section className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M3 6h2l2 11h11l2-8H7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                  <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
                </svg>
              ),
              tile: 'bg-accent-blue/15 text-accent-blue',
              label: 'Total Order',
              value: stats.totalOrder.toLocaleString('id-ID'),
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 2l2.4 5 5.6.8-4 4 1 5.5L12 14.8 6.9 17.3l1-5.5-4-4 5.6-.8L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              ),
              tile: 'bg-accent-purple/15 text-accent-purple',
              label: 'Success Rate',
              value: `${successRate}%`,
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 1v22M5 5h11a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ),
              tile: 'bg-accent-orange/15 text-accent-orange',
              label: 'Total Spend',
              value: fmtRp(stats.spend),
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
              ),
              tile: 'bg-brand-500/15 text-brand-400',
              label: 'Total Balance',
              value: fmtRp(balance),
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.04 }}
              className="card !p-3"
            >
              <div className={`icon-tile ${s.tile}`}>{s.icon}</div>
              <p className="text-[11px] text-ink-muted mt-2">{s.label}</p>
              <p className="text-sm font-bold mt-0.5 truncate">{s.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Order */}
      <section className="px-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-brand-400">⚡</span>
            <h2 className="text-base font-bold">Quick Order</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Pilih Negara</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {flagFromCountry(c.name)} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pilih Provider</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="input"
              >
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pilih Layanan</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="input"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={goOrder} className="btn-primary">
              Order Sekarang
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path
                  d="M3 12l18-9-7 18-2-8-9-1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Recent Transactions */}
      <section className="px-4 mt-5">
        <div className="card !p-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-brand-400">
                <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M8 10h8M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Recent Transactions
            </h2>
            <Link href="/history" className="text-[11px] text-brand-400 font-semibold">
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-2">
            {orders.length === 0 && (
              <div className="text-center text-xs text-ink-muted py-6">
                Belum ada transaksi.
              </div>
            )}
            {orders.slice(0, 5).map((o, i) => {
              const status = (o.status || 'pending').toLowerCase();
              const ok = ['success', 'completed', 'done', 'received'].includes(
                status
              );
              const fail = ['failed', 'cancelled', 'canceled', 'expired'].includes(
                status
              );
              const badge = ok
                ? 'badge-success'
                : fail
                ? 'badge-failed'
                : 'badge-pending';
              const label = ok ? 'Success' : fail ? 'Failed' : 'Pending';
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="flex items-center gap-3 bg-card-soft border border-card-ring rounded-xl p-2.5"
                >
                  <div className={`icon-tile ${ok ? 'bg-brand-500/15 text-brand-400' : fail ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-orange/15 text-accent-orange'}`}>
                    <span className="text-xs font-bold">
                      #{(o.id || '').slice(-2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      #ORD-{(o.id || '').slice(-5).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {o.number || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={badge}>{label}</span>
                    <p className="text-[10px] text-ink-dim mt-1">
                      {o.createdAt?.toDate
                        ? o.createdAt.toDate().toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 mt-5 mb-2 text-center text-[11px] text-ink-dim">
        © {new Date().getFullYear()} Malzz Nokos · Built by{' '}
        <span className="text-brand-400 font-semibold">Malzz</span>
      </section>
    </>
  );
}
