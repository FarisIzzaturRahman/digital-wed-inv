import Link from "next/link";
import { Heart, CheckCircle, Smartphone, Paintbrush, DollarSign, Users, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between overflow-x-hidden">
      {/* Header */}
      <header className="px-6 py-4 max-w-7xl w-full mx-auto flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold font-serif text-slate-800">
          <Heart className="text-pink-600 fill-current" size={24} />
          <span>SuratDigital</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
            Masuk
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-full transition shadow-md"
          >
            Daftar Gratis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center py-20 px-6 max-w-7xl mx-auto w-full text-center space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="px-4 py-1.5 bg-pink-100 text-pink-700 font-bold uppercase text-[10px] tracking-widest rounded-full">
            Premium Wedding Invitation SaaS
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-serif text-slate-900 tracking-tight leading-tight">
            Buat Undangan Pernikahan <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-yellow-600">
              Digital Mewah & Interaktif
            </span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Platform pembuatan undangan digital multi-tenant yang sangat cepat (ISR-edge), responsif di HP, dan dilengkapi pemutar musik, peta lokasi, RSVP terintegrasi, serta amplop digital transaksional (QRIS & Virtual Account).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
          <Link 
            href="/demo-rina-dan-budi" 
            target="_blank"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg group text-sm"
          >
            Lihat Undangan Demo
            <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
          </Link>
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 font-bold rounded-full hover:bg-slate-100 transition flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            Buat Undangan Anda
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="py-20 w-full grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-pink-50 text-pink-600 rounded-full">
              <Paintbrush size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">Desain Premium & Animasi</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Pilihan template mewah (Classic Gold, Modern Minimal, Romantic Blush) dengan scroll reveal, autoplay musik, dan galeri prewedding yang cantik.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-yellow-50 text-yellow-600 rounded-full">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">Mobile-First & Ringan</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Dioptimalkan sepenuhnya untuk perangkat HP. Dimuat secepat kilat (skor Lighthouse ≥ 90) dengan dynamic static caching.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-full">
              <DollarSign size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">Amplop Digital Gateway</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Tamu dapat mengirim amplop digital secara online via QRIS atau Virtual Account. Dilengkapi ledger otomatis untuk payout ke rekening Anda.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-full">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">Manajemen Daftar Tamu</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Unggah file CSV daftar tamu, buat link personal per tamu (`/[slug]/g/[token]`), dan bagikan draft undangan personal via WhatsApp.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">RSVP & Moderasi Wishlist</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Pantau respon kehadiran tamu secara real-time dan moderasi ucapan buku tamu agar aman dari spam sebelum ditayangkan.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-150 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-full">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-serif">Isolasi Tenant Aman</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Arsitektur database multi-tenant yang aman. Seluruh data Anda terpisah dan terisolasi dengan filter database level tinggi.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 py-10 text-center text-slate-400 text-xs border-t border-slate-850">
        <p className="font-mono text-slate-500">PLATFORM SURATDIGITAL // MULTI-TENANT ARCHITECTURE</p>
        <p className="mt-2">© {new Date().getFullYear()} SuratDigital SaaS. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
