"use client";

import React, { useState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";
import { Heart, Lock, Mail, User, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);

    if (res && res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-md border border-slate-100 space-y-6">
        {/* Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold font-serif text-slate-800">
            <Heart className="text-pink-600 fill-current" size={24} />
            <span>SuratDigital</span>
          </Link>
          <h2 className="text-2xl font-bold font-serif text-slate-900 mt-2">Daftar Akun Baru</h2>
          <p className="text-xs text-slate-500">Mulai buat undangan pernikahan digital Anda sendiri gratis</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                name="name"
                required
                placeholder="Budi Santoso"
                className="w-full border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="email" 
                name="email"
                required
                placeholder="nama@email.com"
                className="w-full border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="password" 
                name="password"
                required
                placeholder="Min. 6 Karakter"
                className="w-full border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Daftar Sekarang</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-pink-600 font-bold hover:underline">
            Masuk Di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}
