'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast('Login berhasil', 'success');
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Login gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-16"
    >
      <div className="text-center mb-8">
        <div className="text-4xl">🚀</div>
        <h1 className="text-2xl font-extrabold mt-2">Malzz Nokos</h1>
        <p className="text-sm text-ink-muted">Masuk ke akunmu</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="kamu@email.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-sm text-ink-muted mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="text-brand-700 font-semibold">
          Daftar
        </Link>
      </p>
    </motion.main>
  );
}
