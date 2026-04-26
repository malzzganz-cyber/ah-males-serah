'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function RatingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        uid: user.uid,
        email: user.email,
        rating,
        comment: comment.trim() || 'Mantap!',
        createdAt: serverTimestamp(),
      });
      // Play audio
      try {
        const audio = new Audio('https://files.catbox.moe/dwjqgv.mp3');
        audio.play().catch(() => {});
      } catch {}
      onClose();
      setComment('');
      setRating(5);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-card-ring rounded-3xl w-full max-w-[400px] p-5 shadow-card"
          >
            <div className="text-center">
              <div className="text-3xl mb-1">🎉</div>
              <h3 className="text-lg font-bold">Order berhasil!</h3>
              <p className="text-sm text-ink-muted">
                Beri rating untuk pengalaman kamu
              </p>
            </div>
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="transition transform hover:scale-110"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={n <= rating ? '#facc15' : 'none'}
                    stroke="#facc15"
                    strokeWidth="2"
                    className="w-9 h-9"
                  >
                    <path d="M12 2l2.9 6.1 6.7.6-5.1 4.6 1.6 6.6L12 16.8 5.9 19.9l1.6-6.6L2.4 8.7l6.7-.6L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tulis komentar kamu..."
              className="input mt-4 min-h-[80px] resize-none"
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={onClose} className="btn-secondary">
                Nanti
              </button>
              <button onClick={submit} disabled={submitting} className="btn-primary">
                {submitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
