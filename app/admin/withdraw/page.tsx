'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminWithdrawPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [bank, setBank] = useState<string>('dana');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [productId, setProductId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const pollRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (!isAdmin) router.push('/');
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/h2h-product')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : d?.data || []))
      .catch(() => {});
    fetch('/api/h2h-list-rekening')
      .then((r) => r.json())
      .then((d) => setBanks(Array.isArray(d) ? d : d?.data || []))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(
    () => () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    },
    []
  );

  const checkAccount = async () => {
    if (!bank || !account) return toast('Isi bank & nomor rekening', 'error');
    setBusy(true);
    try {
      const r = await fetch(
        `/api/h2h-check-rekening?bank_code=${bank}&account_number=${account}`
      );
      const d = await r.json();
      const name = d?.account_name || d?.name || d?.data?.account_name;
      if (name) {
        setHolder(name);
        toast('Atas nama: ' + name, 'success');
      } else {
        toast('Rekening tidak ditemukan', 'error');
      }
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!productId) return toast('Pilih produk', 'error');
    if (!account) return toast('Isi nomor rekening', 'error');
    setBusy(true);
    try {
      const r = await fetch(
        `/api/h2h-create?target=${account}&id=${productId}`
      );
      const d = await r.json();
      const id = d?.transaksi_id || d?.id || d?.data?.transaksi_id;
      if (!r.ok || !id) throw new Error(d?.message || 'Gagal');
      setTx({ ...d, transaksi_id: id });
      setStatus('pending');
      await addDoc(collection(db, 'withdraws'), {
        uid: user!.uid,
        bank,
        account,
        holder,
        productId,
        transaksi_id: id,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      startPolling(id);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const startPolling = (id: string) => {
    setCountdown(60);
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/h2h-status?transaksi_id=${id}`);
        const d = await r.json();
        const st = (d?.status || d?.data?.status || '').toString().toLowerCase();
        if (st && st !== 'pending') {
          setStatus(st);
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
        }
      } catch {}
    }, 5000);
  };

  if (!isAdmin) return null;

  return (
    <>
      <Header title="💸 Withdraw (Admin)" subtitle="H2H Transaksi" />
      <section className="px-4 mt-5 space-y-3">
        <div className="card space-y-3">
          <div>
            <label className="label">Produk</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="input"
            >
              <option value="">— Pilih Produk —</option>
              {products.map((p, i) => (
                <option key={i} value={p.id || p.code || p.id_code}>
                  {(p.name || p.product_name || 'Produk') +
                    (p.price ? ` · Rp ${parseInt(p.price).toLocaleString('id-ID')}` : '')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bank / E-Wallet</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="input"
            >
              {banks.length === 0 && <option value="dana">DANA</option>}
              {banks.map((b, i) => (
                <option
                  key={i}
                  value={(b.code || b.bank_code || '').toString().toLowerCase()}
                >
                  {b.name || b.bank_name || b.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nomor Rekening / E-Wallet</label>
            <div className="flex gap-2">
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="input flex-1"
                placeholder="08xxxx atau no rekening"
              />
              <button onClick={checkAccount} disabled={busy} className="btn-ghost">
                Cek
              </button>
            </div>
            {holder && (
              <p className="text-xs text-emerald-700 mt-1.5">a/n {holder}</p>
            )}
          </div>
          <button onClick={create} disabled={busy} className="btn-primary">
            {busy ? 'Memproses...' : 'Buat Withdraw'}
          </button>
        </div>

        {tx && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="font-semibold mb-2">Status Withdraw</div>
            <div className="text-xs text-ink-muted">ID</div>
            <div className="font-mono text-sm break-all">{tx.transaksi_id}</div>
            <div className="mt-2">
              <span
                className={`chip ${
                  status === 'success' || status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : status === 'failed'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {(status || 'PENDING').toUpperCase()}
              </span>
            </div>
            {status === 'pending' && (
              <p className="text-xs text-ink-muted mt-2">Polling... {countdown}s</p>
            )}
          </motion.div>
        )}
      </section>
    </>
  );
}
