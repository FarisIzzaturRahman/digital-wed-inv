"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function calculateTimeLeft(weddingDate: string) {
  const target = new Date(weddingDate).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function WeddingCountdown({ weddingDate }: { weddingDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(weddingDate));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(weddingDate));
    const id = setInterval(
      () => setTimeLeft(calculateTimeLeft(weddingDate)),
      1000
    );
    return () => clearInterval(id);
  }, [weddingDate]);

  if (!timeLeft) {
    return (
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-5 flex items-center gap-3">
        <Clock size={18} className="text-pink-600 shrink-0" />
        <p className="text-sm font-bold text-pink-700">🎊 Hari Pernikahan Telah Tiba! Selamat Berbahagia!</p>
      </div>
    );
  }

  const units = [
    { label: "Hari", value: timeLeft.days },
    { label: "Jam", value: timeLeft.hours },
    { label: "Menit", value: timeLeft.minutes },
    { label: "Detik", value: timeLeft.seconds },
  ];

  return (
    <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-fuchsia-50 border border-pink-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <Clock size={18} className="text-pink-600" />
        <span className="text-xs font-bold text-pink-700 uppercase tracking-widest">Hitung Mundur Pernikahan</span>
      </div>
      <div className="flex gap-3">
        {units.map(({ label, value }) => (
          <div key={label} className="bg-white border border-pink-200 rounded-xl px-4 py-2 text-center shadow-sm min-w-[56px]">
            <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
