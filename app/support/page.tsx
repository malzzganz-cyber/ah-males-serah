'use client';

import Header from '@/components/Header';
import { motion } from 'framer-motion';

export default function SupportPage() {
  return (
    <>
      <Header title="🎧 Support" subtitle="Butuh bantuan? Hubungi kami" />
      <section className="px-4 mt-5 space-y-3">
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="https://wa.me/6288980873712"
          target="_blank"
          rel="noopener"
          className="card !p-4 flex items-center gap-3 hover:border-emerald-200 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl">
            💬
          </div>
          <div className="flex-1">
            <div className="font-semibold">Chat WhatsApp</div>
            <div className="text-xs text-ink-muted">+62 889-8087-3712</div>
          </div>
          <span className="text-ink-dim">›</span>
        </motion.a>

        <div className="card">
          <div className="font-semibold text-sm mb-2">❓ FAQ</div>
          <div className="space-y-3 text-sm text-ink-muted">
            <div>
              <div className="font-medium text-ink">
                Berapa minimal deposit?
              </div>
              <div className="text-xs">Minimal Rp 2.000 via QRIS.</div>
            </div>
            <div>
              <div className="font-medium text-ink">OTP tidak masuk?</div>
              <div className="text-xs">
                Kamu bisa membatalkan order, saldo akan dikembalikan otomatis.
              </div>
            </div>
            <div>
              <div className="font-medium text-ink">Berapa lama proses?</div>
              <div className="text-xs">
                Polling otomatis setiap 5 detik selama 60 detik.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
