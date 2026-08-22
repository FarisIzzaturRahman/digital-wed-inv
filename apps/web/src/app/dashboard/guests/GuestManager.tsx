"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addGuestAction, importGuestsAction, deleteGuestAction } from "./actions";
import { 
  Plus, Upload, Trash2, Search, Link as LinkIcon, Send, MessageSquare, CheckCircle, AlertCircle, Share2, Sparkles
} from "lucide-react";

export function GuestManager({
  invitation,
  guests,
  planInfo
}: {
  invitation: any;
  guests: any[];
  planInfo: any;
}) {
  const router = useRouter();
  const [appUrl, setAppUrl] = useState("");
  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Single Guest Input
  const [singleName, setSingleName] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [loading, setLoading] = useState(false);

  // CSV paste input
  const [csvContent, setCsvContent] = useState("");

  // WA Template
  const [waTemplate, setWaTemplate] = useState(
    `Kepada Yth. Bapak/Ibu/Saudara/i *{name}*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara pernikahan kami berdua. Detail undangan dapat diakses melalui link unik berikut:\n\n{link}\n\nMerupakan suatu kebahagiaan bagi kami jika Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`
  );

  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);
  const [selectedGuestForShare, setSelectedGuestForShare] = useState<any | null>(null);
  const [copiedModalLink, setCopiedModalLink] = useState(false);
  const [copiedModalCaption, setCopiedModalCaption] = useState(false);

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    setLoading(true);

    const res = await addGuestAction({
      name: singleName,
      phone: singlePhone,
      invitationId: invitation.id
    });

    setLoading(false);
    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Tamu "${singleName}" berhasil ditambahkan.` });
      setSingleName("");
      setSinglePhone("");
      setShowAddModal(false);
      router.refresh();
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;
    setLoading(true);

    // Parse CSV line-by-line
    // Format: name,phone OR just name
    const lines = csvContent.split("\n");
    const list: Array<{ name: string; phone?: string }> = [];

    for (const line of lines) {
      const parts = line.split(",");
      const name = parts[0]?.trim();
      const phone = parts[1]?.trim();
      
      if (name) {
        list.push({ name, phone });
      }
    }

    const res = await importGuestsAction(invitation.id, list);
    setLoading(false);

    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Berhasil mengimpor ${res.count} tamu.` });
      setCsvContent("");
      setShowImportModal(false);
      router.refresh();
    }
  };

  const handleDelete = async (guestId: string, name: string) => {
    if (!confirm(`Hapus tamu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await deleteGuestAction(guestId);
    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Tamu "${name}" berhasil dihapus.` });
      router.refresh();
    }
  };

  const copyInviteLink = (guestToken: string, index: number) => {
    const appUrl = window.location.origin;
    const link = `${appUrl}/${invitation.slug}/g/${guestToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkIndex(index);
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  const getWaLink = (name: string, guestToken: string, phone?: string | null) => {
    const link = `${appUrl}/${invitation.slug}/g/${guestToken}`;
    const text = waTemplate.replace("{name}", name).replace("{link}", link);
    
    // Normalize phone number (remove +, spaces, leading 0)
    let formattedPhone = phone || "";
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }
    
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
  };

  // Statistics & helper
  const getGuestStatus = (g: any) => {
    const r = g.rsvps?.[0]; // latest rsvp
    return {
      attendance: r ? r.attendance : "pending",
      headcount: r ? r.headcount : 0
    };
  };

  const countTotal = guests.length;
  const countYes = guests.filter((g) => getGuestStatus(g).attendance === "yes").length;
  const countMaybe = guests.filter((g) => getGuestStatus(g).attendance === "maybe").length;
  const countNo = guests.filter((g) => getGuestStatus(g).attendance === "no").length;
  const countPending = guests.filter((g) => getGuestStatus(g).attendance === "pending").length;

  // Filtered List
  const filteredGuests = guests.filter((g) => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLimitReached = guests.length >= planInfo.features.guestLimit;

  return (
    <div className="space-y-6">
      
      {/* Alert message */}
      {message && (
        <div className={`p-4 rounded-2xl flex justify-between items-center border text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Summary Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Tamu</span>
          <p className="text-xl font-bold text-slate-800">{countTotal}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Hadir (Yes)</span>
          <p className="text-xl font-bold text-emerald-700">{countYes}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] uppercase font-bold text-amber-500">Ragu (Maybe)</span>
          <p className="text-xl font-bold text-amber-600">{countMaybe}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] uppercase font-bold text-red-500">Absen (No)</span>
          <p className="text-xl font-bold text-red-600">{countNo}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500">Pending</span>
          <p className="text-xl font-bold text-slate-600">{countPending}</p>
        </div>
      </div>

      {/* Action Controls & Search */}
      {isLimitReached && (
        <div className="bg-[#FAF7F2] border border-[#6B8F71]/30 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-55 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block mb-1">
              Batas Kuota Tamu
            </span>
            <h4 className="text-xs font-bold text-slate-800">Kuota Tamu untuk Paket {planInfo.name} Telah Terpenuhi</h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              Anda telah menggunakan seluruh batas maksimal {planInfo.features.guestLimit} tamu pada paket Anda. Tingkatkan paket Anda ke Premium untuk menambahkan tamu tanpa batas.
            </p>
          </div>
          <Link href="/dashboard/upgrade" className="px-4 py-2 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-[10px] transition shrink-0 shadow-sm">
            Tingkatkan Ke Premium
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama tamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button 
            onClick={isLimitReached ? () => setShowPaywallModal(true) : () => setShowImportModal(true)}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition text-xs flex items-center gap-1.5"
          >
            <Upload size={14} /> Impor CSV
          </button>
          <button 
            onClick={isLimitReached ? () => setShowPaywallModal(true) : () => setShowAddModal(true)}
            className="px-4 py-2 bg-[#2E3A35] text-white hover:bg-slate-800 font-bold rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} /> Tambah Tamu
          </button>
        </div>
      </div>

      {/* WA Template Editor */}
      <details className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group">
        <summary className="text-xs font-bold text-slate-700 cursor-pointer list-none flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={16} className="text-pink-600" />
            Edit Draf Template WhatsApp Blast
          </span>
          <span className="text-[10px] text-slate-400 group-open:hidden">Klik untuk edit</span>
          <span className="text-[10px] text-slate-400 hidden group-open:block">Klik untuk sembunyikan</span>
        </summary>
        <div className="mt-4 space-y-2">
          <textarea 
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-pink-500 bg-slate-50"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            Variabel tersedia: <span className="font-bold text-pink-600">&#123;name&#125;</span> untuk nama tamu, dan <span className="font-bold text-pink-600">&#123;link&#125;</span> untuk tautan unik undangan.
          </p>
        </div>
      </details>

      {/* Guests Datatable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-250/50">
                <th className="p-4">Nama Tamu</th>
                <th className="p-4">No. Telp / HP</th>
                <th className="p-4">Status RSVP</th>
                <th className="p-4">Jumlah Tamu</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center italic text-slate-400">Tamu tidak ditemukan.</td>
                </tr>
              ) : (
                filteredGuests.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-800">{g.name}</td>
                    <td className="p-4 font-mono text-slate-500">{g.phone || "—"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        getGuestStatus(g).attendance === "yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        getGuestStatus(g).attendance === "no" ? "bg-red-50 text-red-700 border border-red-200" :
                        getGuestStatus(g).attendance === "maybe" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {getGuestStatus(g).attendance === "yes" ? "Hadir" : 
                         getGuestStatus(g).attendance === "no" ? "Absen" : 
                         getGuestStatus(g).attendance === "maybe" ? "Ragu" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold">{getGuestStatus(g).headcount} orang</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      
                      {/* Copy link */}
                      <button
                        onClick={() => copyInviteLink(g.slugToken, idx)}
                        title="Salin Link Undangan"
                        className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition"
                      >
                        {copiedLinkIndex === idx ? (
                          <span className="text-[10px] text-emerald-600 font-semibold px-1">Berhasil</span>
                        ) : (
                          <LinkIcon size={14} />
                        )}
                      </button>

                      {/* WhatsApp Blast */}
                      <a
                        href={getWaLink(g.name, g.slugToken, g.phone)}
                        target="_blank"
                        rel="noreferrer"
                        title="Kirim ke WhatsApp"
                        className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center justify-center"
                      >
                        <Send size={14} />
                      </a>

                      {/* Social & IG Story Share */}
                      <button
                        onClick={() => setSelectedGuestForShare(g)}
                        title="Bagikan ke Instagram Story / Medsos"
                        className="p-1.5 bg-pink-50 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-100 transition flex items-center justify-center"
                      >
                        <Share2 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(g.id, g.name)}
                        title="Hapus Tamu"
                        className="p-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add Guest Single */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>
            <h3 className="text-base font-bold font-serif text-slate-800 mb-4 flex items-center gap-1">
              <Plus size={16} /> Tambah Tamu Baru
            </h3>

            <form onSubmit={handleAddSingle} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Bapak/Ibu..."
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none bg-slate-50"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-700">No. WhatsApp (Format cth: 6281234567)</label>
                <input 
                  type="text" 
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  placeholder="628123456..."
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                {loading ? "Menambahkan..." : "Tambah Tamu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl relative">
            <button 
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>
            <h3 className="text-base font-bold font-serif text-slate-800 mb-2 flex items-center gap-1.5">
              <Upload size={16} /> Impor Tamu via CSV / Baris Teks
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 leading-normal">
              Masukkan daftar tamu dengan memisahkan Nama dan Nomor HP menggunakan tanda koma. Tulis satu tamu per baris.
            </p>

            <form onSubmit={handleImportCSV} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-700">Tempel Baris Teks CSV</label>
                <textarea 
                  required
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={6}
                  placeholder={`Bapak Joko,628123456789\nIbu Siti Herlina,62899998888\nBapak Budi Santoso`}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs font-mono focus:outline-none bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                {loading ? "Memproses Impor..." : "Mulai Impor Masal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Paywall Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl relative text-center space-y-4">
            <button 
              onClick={() => setShowPaywallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>
            <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold font-serif text-slate-800">
              Batas Kuota Tamu Terpenuhi
            </h3>
            <p className="text-xs text-slate-550 leading-normal">
              Saat ini Anda menggunakan paket **{planInfo.name}** dengan kuota maksimal **{planInfo.features.guestLimit}** tamu. Silakan tingkatkan paket Anda untuk menambahkan tamu tanpa batas.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/dashboard/upgrade"
                className="w-full py-2 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition block text-center"
              >
                Tingkatkan Ke Premium
              </Link>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="w-full py-2 border border-slate-200 text-slate-650 rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Guest Social & Story Share Card */}
      {selectedGuestForShare && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl relative text-left space-y-4 border border-slate-150">
            <button 
              onClick={() => setSelectedGuestForShare(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>
            
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-serif text-slate-800">
                  Bagikan Undangan Personal
                </h3>
                <p className="text-[11px] text-slate-500">Khusus untuk: <strong>{selectedGuestForShare.name}</strong></p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link Personal Tamu:</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`${appUrl}/${invitation.slug}/g/${selectedGuestForShare.slugToken}`}
                  className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 truncate"
                />
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`${appUrl}/${invitation.slug}/g/${selectedGuestForShare.slugToken}`);
                      setCopiedModalLink(true);
                      setTimeout(() => setCopiedModalLink(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-800 transition"
                >
                  {copiedModalLink ? "Tersalin!" : "Salin"}
                </button>
              </div>
            </div>

            <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">Teks Caption / Story:</span>
              <textarea 
                readOnly
                rows={3}
                value={`Kepada Yth. ${selectedGuestForShare.name}, kami mengundang Anda untuk merayakan hari bahagia pernikahan kami. Buka detail undangan: ${appUrl}/${invitation.slug}/g/${selectedGuestForShare.slugToken}`}
                className="w-full bg-white border border-pink-200 p-2.5 rounded-xl text-[11px] text-slate-700 resize-none font-sans"
              />
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`Kepada Yth. ${selectedGuestForShare.name}, kami mengundang Anda untuk merayakan hari bahagia pernikahan kami. Buka detail undangan: ${appUrl}/${invitation.slug}/g/${selectedGuestForShare.slugToken}`);
                    setCopiedModalCaption(true);
                    setTimeout(() => setCopiedModalCaption(false), 2000);
                  }
                }}
                className="w-full py-2 bg-white hover:bg-pink-50 border border-pink-200 text-pink-800 font-bold rounded-xl text-xs transition"
              >
                {copiedModalCaption ? "Caption Berhasil Disalin!" : "Salin Teks Caption"}
              </button>
            </div>

            <div className="pt-1 flex gap-2">
              <a
                href={getWaLink(selectedGuestForShare.name, selectedGuestForShare.slugToken, selectedGuestForShare.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Send size={14} /> Kirim WhatsApp
              </a>
              <button
                onClick={() => setSelectedGuestForShare(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
