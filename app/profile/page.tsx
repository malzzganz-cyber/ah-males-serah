'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as sref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      // Private path — only this user can read (enforce via Storage Rules)
      const path = `users/${user.uid}/profile/${Date.now()}_${file.name}`;
      const r = sref(storage, path);
      await uploadBytes(r, file, { contentType: file.type });
      const url = await getDownloadURL(r);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      toast('Foto profil diperbarui', 'success');
    } catch (err: any) {
      toast(err.message || 'Upload gagal', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Header title="👤 Profil Saya" />
      <section className="px-4 mt-5 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full bg-brand-50 mx-auto flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white shadow-card"
          >
            {userData?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userData.photoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-brand-400">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M4 21c0-4 4-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            hidden
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-3 text-xs text-brand-700 font-semibold"
          >
            {uploading ? 'Mengunggah...' : '📷 Ganti Foto Profil'}
          </button>
          <div className="mt-4">
            <div className="text-xs text-ink-muted">Email</div>
            <div className="font-semibold text-sm">{user?.email}</div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-ink-muted">UID</div>
            <div className="font-mono text-[10px] text-ink-muted break-all">
              {user?.uid}
            </div>
          </div>
        </motion.div>

        <div className="card flex justify-between items-center">
          <div>
            <div className="text-xs text-ink-muted">Saldo</div>
            <div className="text-lg font-bold text-brand-700">
              Rp {(userData?.balance || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <button onClick={() => router.push('/deposit')} className="btn-ghost">
            Top Up
          </button>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.push('/login');
          }}
          className="btn-secondary"
        >
          🚪 Logout
        </button>

        <p className="text-center text-[10px] text-ink-dim">
          🔒 Foto profil bersifat privat. Hanya kamu yang bisa melihatnya.
        </p>
      </section>
    </>
  );
}
