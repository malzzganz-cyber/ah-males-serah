'use client';

import { useEffect, useRef, useState } from 'react';
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

export default function DepositPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(10000);
  const [creating, setCreating] = useState(false);
  const [deposit, setDeposit] = useState<any>(null);
  const [status, setStatus] = useState<string>('pending');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  const create = async () => {
    if (amount < 2000) {
      toast('Minimal deposit Rp 2.000', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/deposit-create?amount=${amount}`);
      const data = await res.json();
      if (!res.ok || !data?.deposit_id) {
        throw new Error(data?.message || 'Gagal membuat QRIS');
      }
      setDeposit(data);
      setStatus('pending');
      // Save pending transaction
      if (user) {
        await addDoc(collection(db, 'transactions'), {
          uid: user.uid,
          type: 'deposit',
          amount,
          deposit_id: data.deposit_id,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }
      startPolling(data.deposit_id, amount);
    } catch (e: any) {
      toast(e.message || 'Gagal', 'error');
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (depositId: string, amt: number) => {
    setCountdown(60);
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          clearInterval(pollRef.current);
          setStatus((s) => (s === 'pending' ? 'expired' : s));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/deposit-status?deposit_id=${depositId}`);
        const d = await r.json();
        const st = (d?.status || d?.data?.status || '').toString().toLowerCase();
        if (st && st !== 'pending') {
          setStatus(st);
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          if (st === 'success' || st === 'paid' || st === 'settled') {
            await onSuccess(amt);
          }
        }
      } catch {}
    }, 5000);
  };

  const onSuccess = async (amt: number) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const cur = snap.exists() ? snap.data().balance || 0 : 0;
      await updateDoc(ref, { balance: cur + amt });
      toast(`Saldo +Rp ${amt.toLocaleString('id-ID')}`, 'success');
      try {
        const audio = new Audio('https://files.catbox.moe/dwjqgv.mp3');
        audio.play().catch(() => {});
      } catch {}
    } catch (e) {
      console.error(e);
    }
  };

  const cancel = async () => {
    if (!deposit?.deposit_id) return;
    try {
      await fetch(`/api/deposit-cancel?deposit_id=${deposit.deposit_id}`);
    } catch {}
    setDeposit(null);
    setStatus('pending');
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    toast('Deposit dibatalkan', 'info');
  };

  const qrisImg = deposit?.qris_image || deposit?.qr_image || deposit?.qris || deposit?.qr;

  return (
    <>
      <Header title="💰 Deposit" subtitle="Top up saldo via QRIS" />
      <section className="px-4 mt-5">
        {!deposit ? (
          <div className="card">
            <label className="label">Nominal Deposit (min Rp 2.000)</label>
            <input
              type="number"
              min={2000}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="input"
              placeholder="10000"
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[10000, 25000, 50000, 100000, 200000, 500000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`rounded-xl text-xs font-semibold py-2 transition ${
                    amount === v
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  {(v / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
            <button onClick={create} disabled={creating} className="btn-primary mt-4">
              {creating ? 'Membuat QRIS...' : 'Buat QRIS'}
            </button>
            <p className="text-[11px] text-ink-dim text-center mt-3">
              Pembayaran via QRIS · semua e-wallet & m-banking
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card text-center"
            >
              <div className="text-xs text-ink-muted">Bayar dalam</div>
              <div className="text-3xl font-bold text-brand-700 mt-1">
                Rp {amount.toLocaleString('id-ID')}
              </div>
              {qrisImg && (
                <div className="bg-white border border-card-ring rounded-2xl p-3 mt-3 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisImg}
                    alt="QRIS"
                    className="w-56 h-56 object-contain mx-auto"
                  />
                </div>
              )}
              <div className="mt-3">
                <span
                  className={`chip ${
                    status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : status === 'success' || status === 'paid' || status === 'settled'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  Status: {status.toUpperCase()}
                </span>
              </div>
              {status === 'pending' && (
                <p className="text-xs text-ink-muted mt-2">
                  Polling... {countdown}s
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={cancel} className="btn-secondary">
                  Batalkan
                </button>
                <button
                  onClick={() => {
                    setDeposit(null);
                    setStatus('pending');
                    clearInterval(timerRef.current);
                    clearInterval(pollRef.current);
                  }}
                  className="btn-primary"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </>
  );
}
