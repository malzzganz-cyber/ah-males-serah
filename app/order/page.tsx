'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import RatingModal from '@/components/RatingModal';

type Step = 'service' | 'country' | 'operator' | 'order' | 'otp';

export default function OrderPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('service');

  const [services, setServices] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);

  const [selService, setSelService] = useState<any>(null);
  const [selCountry, setSelCountry] = useState<any>(null);
  const [selOperator, setSelOperator] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [order, setOrder] = useState<any>(null);
  const [otp, setOtp] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('waiting');
  const [countdown, setCountdown] = useState(0);

  const [loadingList, setLoadingList] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (step === 'service') loadServices();
  }, [step]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  const loadServices = async () => {
    setLoadingList(true);
    try {
      const r = await fetch('/api/services');
      const d = await r.json();
      const list = Array.isArray(d) ? d : d?.data || d?.services || [];
      setServices(list);
    } catch (e: any) {
      toast('Gagal memuat services', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const loadCountries = async (service: any) => {
    setSelService(service);
    setStep('country');
    setLoadingList(true);
    setCountries([]);
    try {
      const id = service.id || service.service_id || service.code;
      const r = await fetch(`/api/countries?service_id=${id}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d?.data || d?.countries || [];
      setCountries(list);
    } catch (e) {
      toast('Gagal memuat negara', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const loadOperators = async (country: any) => {
    setSelCountry(country);
    setStep('operator');
    setLoadingList(true);
    setOperators([]);
    try {
      const cName = country.name || country.country || country.country_name;
      const provider =
        country.provider_id || country.providerId || country.provider || '';
      const r = await fetch(
        `/api/operators?country=${encodeURIComponent(cName)}&provider_id=${provider}`
      );
      const d = await r.json();
      const list = Array.isArray(d) ? d : d?.data || d?.operators || [];
      setOperators(list);
    } catch (e) {
      toast('Gagal memuat operator', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const placeOrder = async (operator: any) => {
    setSelOperator(operator);
    setOrdering(true);
    try {
      const numberId =
        operator.number_id ||
        operator.numberId ||
        operator.id ||
        selCountry?.id ||
        selCountry?.number_id;
      const providerId =
        operator.provider_id ||
        selCountry?.provider_id ||
        operator.providerId ||
        '';
      const operatorId =
        operator.operator_id || operator.operatorId || operator.id || '';
      const isAny =
        (operator.name || operator.operator || '').toString().toLowerCase() ===
        'any';

      const params = new URLSearchParams();
      params.set('number_id', String(numberId || ''));
      params.set('provider_id', String(providerId || ''));
      if (!isAny && operatorId) params.set('operator_id', String(operatorId));

      const r = await fetch(`/api/order?${params.toString()}`);
      const d = await r.json();
      if (!r.ok || (!d?.order_id && !d?.data?.order_id)) {
        throw new Error(d?.message || d?.error || 'Order gagal');
      }
      const od = d.data || d;
      setOrder(od);
      setStep('otp');
      setOrderStatus('waiting');

      // Markup price calculation (display)
      const rawPrice = parseInt(operator.price || operator.cost || '0') || 0;
      const finalPrice = applyMarkup(rawPrice);

      // Save order
      if (user) {
        await addDoc(collection(db, 'orders'), {
          uid: user.uid,
          service: selService?.name || selService?.service || '',
          country: selCountry?.name || selCountry?.country || '',
          operator: operator.name || operator.operator || 'any',
          number: od.number || od.phone_number || od.phone || '',
          order_id: od.order_id,
          status: 'waiting',
          price: finalPrice,
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          uid: user.uid,
          type: 'order',
          amount: -finalPrice,
          order_id: od.order_id,
          createdAt: serverTimestamp(),
        });
        // Deduct balance
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const cur = snap.exists() ? snap.data().balance || 0 : 0;
        await updateDoc(ref, { balance: Math.max(0, cur - finalPrice) });
      }
      startPolling(od.order_id);
      setShowRating(true);
    } catch (e: any) {
      toast(e.message || 'Order gagal', 'error');
    } finally {
      setOrdering(false);
    }
  };

  const applyMarkup = (price: number) => {
    if (!price) return 0;
    return price <= 15000 ? price + 500 : price + 1000;
  };

  const startPolling = (orderId: string) => {
    setCountdown(60);
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/order-status?order_id=${orderId}`);
        const d = await r.json();
        const otpVal =
          d?.otp || d?.code || d?.sms || d?.data?.otp || d?.data?.code || d?.data?.sms;
        const st = (d?.status || d?.data?.status || '').toString().toLowerCase();
        if (otpVal) {
          setOtp(String(otpVal));
          setOrderStatus('received');
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
        } else if (st && st !== 'waiting' && st !== 'pending') {
          setOrderStatus(st);
        }
      } catch {}
    }, 5000);
  };

  const cancelOrder = async () => {
    if (!order?.order_id) return;
    try {
      await fetch(`/api/order-cancel?order_id=${order.order_id}`);
      toast('Order dibatalkan', 'info');
    } catch {}
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setOrder(null);
    setOtp('');
    setStep('service');
    setSelService(null);
    setSelCountry(null);
    setSelOperator(null);
  };

  const reset = () => {
    setOrder(null);
    setOtp('');
    setStep('service');
    setSelService(null);
    setSelCountry(null);
    setSelOperator(null);
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
  };

  const filtered = useMemo(() => {
    const arr =
      step === 'service' ? services : step === 'country' ? countries : operators;
    if (!search) return arr;
    return arr.filter((x: any) =>
      (x.name || x.country || x.operator || x.service || '')
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [step, services, countries, operators, search]);

  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mb-3 px-1 flex-wrap">
      <span className={step === 'service' ? 'text-brand-700 font-semibold' : ''}>
        Service
      </span>
      <span>›</span>
      <span className={step === 'country' ? 'text-brand-700 font-semibold' : ''}>
        Negara
      </span>
      <span>›</span>
      <span className={step === 'operator' ? 'text-brand-700 font-semibold' : ''}>
        Operator
      </span>
      <span>›</span>
      <span className={step === 'otp' ? 'text-brand-700 font-semibold' : ''}>OTP</span>
    </div>
  );

  return (
    <>
      <Header title="📱 Order Nomor" subtitle="Pilih service & negara" />
      <section className="px-4 mt-5">
        {step !== 'otp' && <Breadcrumb />}

        {step !== 'otp' && (
          <div className="card !p-3 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              placeholder={`Cari ${step}...`}
            />
            {step !== 'service' && (
              <button
                onClick={() => {
                  if (step === 'country') {
                    setStep('service');
                    setSelService(null);
                  } else if (step === 'operator') {
                    setStep('country');
                    setSelCountry(null);
                  }
                  setSearch('');
                }}
                className="text-xs text-brand-700 mt-2 font-semibold"
              >
                ← Kembali
              </button>
            )}
          </div>
        )}

        {step === 'otp' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="card">
              <div className="text-xs text-ink-muted">Detail Order</div>
              <div className="mt-2 space-y-1.5 text-sm">
                <Row label="Service" value={selService?.name || selService?.service} />
                <Row label="Negara" value={selCountry?.name || selCountry?.country} />
                <Row
                  label="Operator"
                  value={selOperator?.name || selOperator?.operator || 'Any'}
                />
                <Row
                  label="Nomor"
                  value={order?.number || order?.phone_number || order?.phone || '-'}
                  bold
                />
                <Row label="Status" value={orderStatus.toUpperCase()} />
              </div>
            </div>

            <div className="card text-center">
              <div className="text-xs text-ink-muted">OTP / Kode SMS</div>
              <AnimatePresence mode="wait">
                {otp ? (
                  <motion.div
                    key="otp"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="my-3"
                  >
                    <div className="text-4xl font-extrabold text-brand-700 tracking-wider">
                      {otp}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(otp);
                        toast('OTP disalin', 'success');
                      }}
                      className="btn-secondary mt-3"
                    >
                      📋 Copy OTP
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="wait"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="my-4"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-sm text-ink-muted">
                        Menunggu OTP... ({countdown}s)
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={cancelOrder} className="btn-secondary">
                Batalkan
              </button>
              <button onClick={reset} className="btn-primary">
                Selesai
              </button>
            </div>
          </motion.div>
        ) : loadingList ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-sm text-ink-muted">
            Tidak ada data
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it: any, i: number) => {
              const name = it.name || it.country || it.operator || it.service || '-';
              const price = parseInt(it.price || it.cost || '0') || 0;
              const finalPrice = price ? applyMarkup(price) : 0;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (step === 'service') loadCountries(it);
                    else if (step === 'country') loadOperators(it);
                    else placeOrder(it);
                  }}
                  disabled={ordering}
                  className="card !p-3 w-full text-left flex items-center justify-between hover:border-brand-200"
                >
                  <div>
                    <div className="font-semibold text-sm">{name}</div>
                    {it.code && (
                      <div className="text-[11px] text-ink-dim">{it.code}</div>
                    )}
                  </div>
                  <div className="text-right">
                    {finalPrice > 0 && (
                      <div className="text-sm font-bold text-brand-700">
                        Rp {finalPrice.toLocaleString('id-ID')}
                      </div>
                    )}
                    <div className="text-[10px] text-ink-dim">›</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <RatingModal open={showRating && !!otp} onClose={() => setShowRating(false)} />
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: any; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-ink-muted text-xs">{label}</span>
      <span className={`text-right text-sm ${bold ? 'font-bold text-brand-700' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}
