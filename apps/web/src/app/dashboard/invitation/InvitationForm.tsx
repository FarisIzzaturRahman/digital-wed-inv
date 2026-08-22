"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInvitationAction } from "./actions";
import { 
  Settings, Users, Calendar, Image as ImageIcon, Gift, Save, Plus, Trash2, CheckCircle2, AlertCircle
} from "lucide-react";

export function InvitationForm({
  invitation,
  couple,
  events: initialEvents,
  stories: initialStories,
  gallery: initialGallery,
  gifts: initialGifts
}: {
  invitation: any;
  couple: any;
  events: any[];
  stories: any[];
  gallery: any[];
  gifts: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "couple" | "events" | "gallery" | "gifts">("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [slug, setSlug] = useState(invitation.slug);
  const [status, setStatus] = useState(invitation.status);
  const [religion, setReligion] = useState(invitation.religion);
  const [locale, setLocale] = useState(invitation.locale);
  const [isPrivate, setIsPrivate] = useState(Boolean(invitation.isPrivate));
  const [pin, setPin] = useState("");
  const [musicUrl, setMusicUrl] = useState(invitation.musicUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(invitation.coverImageUrl || "");
  const [themeId, setThemeId] = useState(invitation.templateId || "classic-gold");

  // Theme Config States
  const [themeColorPrimary, setThemeColorPrimary] = useState(invitation.theme?.colorPrimary || "#d4af37");
  const [themeColorAccent, setThemeColorAccent] = useState(invitation.theme?.colorAccent || "#b8860b");
  const [themeColorBg, setThemeColorBg] = useState(invitation.theme?.colorBg || "#fffdf9");
  const [themeColorText, setThemeColorText] = useState(invitation.theme?.colorText || "#2c2c2c");
  const [themeFontHeading, setThemeFontHeading] = useState(invitation.theme?.fontHeading || "Playfair Display");
  const [themeFontBody] = useState(invitation.theme?.fontBody || "Inter");
  const [themeRadius, setThemeRadius] = useState(invitation.theme?.radius || "8px");

  // Couple States
  const [groomFullName, setGroomFullName] = useState(couple.groomFullName || "");
  const [groomNickname, setGroomNickname] = useState(couple.groomNickname || "");
  const [groomFather, setGroomFather] = useState(couple.groomFather || "");
  const [groomMother, setGroomMother] = useState(couple.groomMother || "");
  const [groomChildOrder, setGroomChildOrder] = useState(couple.groomChildOrder || "");
  const [groomInstagram, setGroomInstagram] = useState(couple.groomInstagram || "");
  const [groomPhotoUrl, setGroomPhotoUrl] = useState(couple.groomPhotoUrl || "");

  const [brideFullName, setBrideFullName] = useState(couple.brideFullName || "");
  const [brideNickname, setBrideNickname] = useState(couple.brideNickname || "");
  const [brideFather, setBrideFather] = useState(couple.brideFather || "");
  const [brideMother, setBrideMother] = useState(couple.brideMother || "");
  const [brideChildOrder, setBrideChildOrder] = useState(couple.brideChildOrder || "");
  const [brideInstagram, setBrideInstagram] = useState(couple.brideInstagram || "");
  const [bridePhotoUrl, setBridePhotoUrl] = useState(couple.bridePhotoUrl || "");
  const [orderDisplay, setOrderDisplay] = useState(couple.orderDisplay || "groom_first");

  // Dynamic Lists States
  const [eventsList, setEventsList] = useState<any[]>(
    initialEvents.map(e => ({
      ...e,
      startAt: new Date(e.startAt).toISOString().slice(0, 16),
      endAt: new Date(e.endAt).toISOString().slice(0, 16)
    }))
  );
  const [storiesList, setStoriesList] = useState<any[]>(initialStories);
  const [galleryList, setGalleryList] = useState<any[]>(initialGallery);
  const [giftsList, setGiftsList] = useState<any[]>(initialGifts);

  const addEvent = () => {
    setEventsList([
      ...eventsList,
      {
        title: "Akad Nikah",
        type: "akad",
        startAt: new Date().toISOString().slice(0, 16),
        endAt: new Date().toISOString().slice(0, 16),
        venueName: "Masjid Agung",
        venueAddress: "Jl. Raya No. 1",
        mapsUrl: "",
        mapsEmbed: "",
        dressCode: "",
        note: ""
      }
    ]);
  };

  const removeEvent = (index: number) => {
    setEventsList(eventsList.filter((_, i) => i !== index));
  };

  const updateEventField = (index: number, field: string, value: string) => {
    const newList = [...eventsList];
    newList[index][field] = value;
    setEventsList(newList);
  };

  const addStory = () => {
    setStoriesList([
      ...storiesList,
      { title: "Pertama Bertemu", date: "Januari 2024", body: "Kami berkenalan...", imageUrl: "" }
    ]);
  };

  const removeStory = (index: number) => {
    setStoriesList(storiesList.filter((_, i) => i !== index));
  };

  const updateStoryField = (index: number, field: string, value: string) => {
    const newList = [...storiesList];
    newList[index][field] = value;
    setStoriesList(newList);
  };

  const addGalleryItem = () => {
    setGalleryList([...galleryList, { url: "", caption: "", sortOrder: galleryList.length }]);
  };

  const removeGalleryItem = (index: number) => {
    setGalleryList(galleryList.filter((_, i) => i !== index));
  };

  const updateGalleryField = (index: number, field: string, value: any) => {
    const newList = [...galleryList];
    newList[index][field] = value;
    setGalleryList(newList);
  };

  const addGift = () => {
    setGiftsList([
      ...giftsList,
      { type: "bank", label: "BCA", accountName: "", accountNumber: "", addressText: "" }
    ]);
  };

  const removeGift = (index: number) => {
    setGiftsList(giftsList.filter((_, i) => i !== index));
  };

  const updateGiftField = (index: number, field: string, value: string) => {
    const newList = [...giftsList];
    newList[index][field] = value;
    setGiftsList(newList);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      slug,
      status,
      religion,
      locale,
      isPrivate,
      pin,
      musicUrl,
      coverImageUrl,
      themeId,
      themeColorPrimary,
      themeColorAccent,
      themeColorBg,
      themeColorText,
      themeFontHeading,
      themeFontBody,
      themeRadius,
      groomFullName,
      groomNickname,
      groomFather,
      groomMother,
      groomChildOrder,
      groomInstagram,
      groomPhotoUrl,
      brideFullName,
      brideNickname,
      brideFather,
      brideMother,
      brideChildOrder,
      brideInstagram,
      bridePhotoUrl,
      orderDisplay,
      events: eventsList,
      stories: storiesList,
      gallery: galleryList,
      gifts: giftsList
    };

    const res = await updateInvitationAction(payload);
    setLoading(false);
    
    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Perubahan berhasil disimpan!" });
      router.refresh();
    }
  };

  // Sync theme preset values when changing theme dropdown
  const handleThemePresetChange = (themePreset: string) => {
    setThemeId(themePreset);
    if (themePreset === "classic-gold") {
      setThemeColorPrimary("#d4af37");
      setThemeColorAccent("#b8860b");
      setThemeColorBg("#fffdf9");
      setThemeColorText("#2c2c2c");
      setThemeFontHeading("Playfair Display");
      setThemeRadius("8px");
    } else if (themePreset === "modern-minimal") {
      setThemeColorPrimary("#3f3f46");
      setThemeColorAccent("#18181b");
      setThemeColorBg("#f4f4f5");
      setThemeColorText("#09090b");
      setThemeFontHeading("Space Grotesk");
      setThemeRadius("0px");
    } else if (themePreset === "romantic-blush") {
      setThemeColorPrimary("#db2777");
      setThemeColorAccent("#f472b6");
      setThemeColorBg("#fff5f5");
      setThemeColorText("#4c0519");
      setThemeFontHeading("Pinyon Script");
      setThemeRadius("24px");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Save Trigger Banner */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="flex gap-2 text-xs">
          <button 
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition ${activeTab === "general" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Settings size={14} /> Pengaturan
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("couple")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition ${activeTab === "couple" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Users size={14} /> Profil Mempelai
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition ${activeTab === "events" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Calendar size={14} /> Agenda Acara
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition ${activeTab === "gallery" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <ImageIcon size={14} /> Cerita & Galeri
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("gifts")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition ${activeTab === "gifts" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Gift size={14} /> Kado Digital
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition flex items-center gap-2 text-xs shadow-md shrink-0"
        >
          <Save size={16} />
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Contents */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Tab 1: General & Theme Settings */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-slate-800 border-b border-slate-100 pb-3">Pengaturan Dasar</h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">URL Slug Undangan</label>
                <input 
                  type="text" 
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50 font-mono"
                />
                <span className="text-[10px] text-slate-400">Contoh: &apos;rina-budi&apos; menghasilkan alamat &apos;/rina-budi&apos;</span>
              </div>

              <div className="space-y-2 sm:col-span-2 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <label className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(event) => setIsPrivate(event.target.checked)}
                    className="accent-slate-900"
                  />
                  Lindungi undangan dengan PIN
                </label>
                {isPrivate && (
                  <div className="space-y-1 max-w-xs">
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={pin}
                      onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                      placeholder={invitation.hasPin ? "Kosongkan untuk mempertahankan PIN" : "Masukkan 6 digit PIN"}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      {invitation.hasPin
                        ? "Isi hanya jika ingin mengganti PIN yang tersimpan."
                        : "PIN baru wajib terdiri dari tepat 6 digit."}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Status Publikasi</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-pink-500"
                >
                  <option value="draft">Draft (Hanya Pengelola)</option>
                  <option value="published">Published (Aktif & Publik)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Latar Belakang Agama (Doa/Quote)</label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-pink-500"
                >
                  <option value="islam">Islam</option>
                  <option value="kristen">Kristen / Protestan</option>
                  <option value="katolik">Katolik</option>
                  <option value="hindu">Hindu</option>
                  <option value="buddha">Buddha</option>
                  <option value="umum">Umum (Non-Religius)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Bahasa Halaman</label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-pink-500"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tautan Musik Latar (mp3)</label>
                <input 
                  type="text" 
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tautan Foto Cover</label>
                <input 
                  type="text" 
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                />
              </div>
            </div>

            <h3 className="text-lg font-serif font-bold text-slate-800 border-b border-slate-100 pt-6 pb-3">Pengaturan Tema Tampilan</h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Preset Tema Pilihan</label>
                <select
                  value={themeId}
                  onChange={(e) => handleThemePresetChange(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-pink-500 font-semibold text-pink-600"
                >
                  <option value="classic-gold">Classic Gold & Floral Elegant</option>
                  <option value="modern-minimal">Modern Minimalist Monochrome</option>
                  <option value="romantic-blush">Romantic Blush Soft Pink</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Border Radius (Ujung Kotak)</label>
                <input 
                  type="text" 
                  value={themeRadius}
                  onChange={(e) => setThemeRadius(e.target.value)}
                  placeholder="8px"
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Warna Utama (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={themeColorPrimary} 
                    onChange={(e) => setThemeColorPrimary(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={themeColorPrimary}
                    onChange={(e) => setThemeColorPrimary(e.target.value)}
                    className="flex-1 border border-slate-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Warna Aksen (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={themeColorAccent} 
                    onChange={(e) => setThemeColorAccent(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={themeColorAccent}
                    onChange={(e) => setThemeColorAccent(e.target.value)}
                    className="flex-1 border border-slate-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Warna Latar Belakang (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={themeColorBg} 
                    onChange={(e) => setThemeColorBg(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={themeColorBg}
                    onChange={(e) => setThemeColorBg(e.target.value)}
                    className="flex-1 border border-slate-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Warna Tulisan/Text (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={themeColorText} 
                    onChange={(e) => setThemeColorText(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={themeColorText}
                    onChange={(e) => setThemeColorText(e.target.value)}
                    className="flex-1 border border-slate-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Couple Profiles */}
        {activeTab === "couple" && (
          <div className="space-y-8">
            {/* Groom Section */}
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 border-b border-slate-100 pb-3">Profil Pengantin Pria</h3>
              <div className="grid sm:grid-cols-2 gap-6 mt-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={groomFullName}
                    onChange={(e) => setGroomFullName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Panggilan</label>
                  <input 
                    type="text" 
                    required
                    value={groomNickname}
                    onChange={(e) => setGroomNickname(e.target.value)}
                    placeholder="Budi"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Ayah</label>
                  <input 
                    type="text" 
                    value={groomFather}
                    onChange={(e) => setGroomFather(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Ibu</label>
                  <input 
                    type="text" 
                    value={groomMother}
                    onChange={(e) => setGroomMother(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Urutan Anak (Anak Keberapa)</label>
                  <input 
                    type="text" 
                    value={groomChildOrder}
                    onChange={(e) => setGroomChildOrder(e.target.value)}
                    placeholder="Putra pertama"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Username Instagram</label>
                  <input 
                    type="text" 
                    value={groomInstagram}
                    onChange={(e) => setGroomInstagram(e.target.value)}
                    placeholder="budisantoso"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Tautan Foto Pria</label>
                  <input 
                    type="text" 
                    value={groomPhotoUrl}
                    onChange={(e) => setGroomPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Bride Section */}
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 border-b border-slate-100 pt-6 pb-3">Profil Pengantin Wanita</h3>
              <div className="grid sm:grid-cols-2 gap-6 mt-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={brideFullName}
                    onChange={(e) => setBrideFullName(e.target.value)}
                    placeholder="Rina Herawati"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Panggilan</label>
                  <input 
                    type="text" 
                    required
                    value={brideNickname}
                    onChange={(e) => setBrideNickname(e.target.value)}
                    placeholder="Rina"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Ayah</label>
                  <input 
                    type="text" 
                    value={brideFather}
                    onChange={(e) => setBrideFather(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Ibu</label>
                  <input 
                    type="text" 
                    value={brideMother}
                    onChange={(e) => setBrideMother(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Urutan Anak (Anak Keberapa)</label>
                  <input 
                    type="text" 
                    value={brideChildOrder}
                    onChange={(e) => setBrideChildOrder(e.target.value)}
                    placeholder="Putri pertama"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Username Instagram</label>
                  <input 
                    type="text" 
                    value={brideInstagram}
                    onChange={(e) => setBrideInstagram(e.target.value)}
                    placeholder="rinaherawati"
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Tautan Foto Wanita</label>
                  <input 
                    type="text" 
                    value={bridePhotoUrl}
                    onChange={(e) => setBridePhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Urutan Tampilan Profil</label>
              <select
                value={orderDisplay}
                onChange={(e) => setOrderDisplay(e.target.value)}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none"
              >
                <option value="groom_first">Pria Dahulu, Kemudian Wanita</option>
                <option value="bride_first">Wanita Dahulu, Kemudian Pria</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 3: Agenda & Events */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-800">Agenda & Jadwal Acara</h3>
              <button 
                type="button"
                onClick={addEvent}
                className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Acara
              </button>
            </div>

            {eventsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic text-center">Belum ada acara ditambahkan. Klik tombol di atas untuk menambah.</p>
            ) : (
              <div className="space-y-8 divide-y divide-slate-100">
                {eventsList.map((evt, idx) => (
                  <div key={idx} className="pt-6 first:pt-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full">Acara #{idx + 1}</span>
                      <button 
                        type="button" 
                        onClick={() => removeEvent(idx)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-xs font-semibold"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Nama Acara</label>
                        <input 
                          type="text" 
                          required
                          value={evt.title}
                          onChange={(e) => updateEventField(idx, "title", e.target.value)}
                          placeholder="Akad Nikah / Resepsi Pernikahan"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Jenis Acara</label>
                        <select
                          value={evt.type}
                          onChange={(e) => updateEventField(idx, "type", e.target.value)}
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none"
                        >
                          <option value="akad">Akad Nikah / Pemberkatan</option>
                          <option value="resepsi">Resepsi Pernikahan</option>
                          <option value="custom">Undangan Intimate / Lainnya</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Waktu Mulai</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={evt.startAt}
                          onChange={(e) => updateEventField(idx, "startAt", e.target.value)}
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Waktu Selesai</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={evt.endAt}
                          onChange={(e) => updateEventField(idx, "endAt", e.target.value)}
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Nama Tempat (Gedung/Masjid)</label>
                        <input 
                          type="text" 
                          required
                          value={evt.venueName}
                          onChange={(e) => updateEventField(idx, "venueName", e.target.value)}
                          placeholder="Gedung Graha Utama"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Alamat Tempat</label>
                        <input 
                          type="text" 
                          value={evt.venueAddress}
                          onChange={(e) => updateEventField(idx, "venueAddress", e.target.value)}
                          placeholder="Jl. Merdeka No. 12, Bandung"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Tautan Share Google Maps</label>
                        <input 
                          type="text" 
                          value={evt.mapsUrl}
                          onChange={(e) => updateEventField(idx, "mapsUrl", e.target.value)}
                          placeholder="https://maps.app.goo.gl/..."
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">URL Google Maps Embed</label>
                        <textarea 
                          value={evt.mapsEmbed}
                          onChange={(e) => updateEventField(idx, "mapsEmbed", e.target.value)}
                          placeholder="https://www.google.com/maps/embed?pb=..."
                          rows={2}
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-[11px] font-mono focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Dress Code (Opsional)</label>
                        <input 
                          type="text" 
                          value={evt.dressCode}
                          onChange={(e) => updateEventField(idx, "dressCode", e.target.value)}
                          placeholder="Baju Adat Tradisional / Pastel Modern"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Catatan Khusus (Opsional)</label>
                        <input 
                          type="text" 
                          value={evt.note}
                          onChange={(e) => updateEventField(idx, "note", e.target.value)}
                          placeholder="Protokol kesehatan / Parkir khusus"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Love Stories & Gallery */}
        {activeTab === "gallery" && (
          <div className="space-y-8">
            {/* Love Stories */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-slate-800">Cerita Perjalanan Cinta</h3>
                <button 
                  type="button"
                  onClick={addStory}
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Cerita
                </button>
              </div>

              {storiesList.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 italic text-center">Belum ada cerita perjalanan cinta ditambahkan.</p>
              ) : (
                <div className="space-y-6 divide-y divide-slate-100">
                  {storiesList.map((story, idx) => (
                    <div key={idx} className="pt-6 first:pt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Kisah #{idx + 1}</span>
                        <button 
                          type="button" 
                          onClick={() => removeStory(idx)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-xs font-semibold"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Judul Cerita</label>
                          <input 
                            type="text" 
                            required
                            value={story.title}
                            onChange={(e) => updateStoryField(idx, "title", e.target.value)}
                            placeholder="Kencan Pertama / Pertunangan"
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Waktu / Tanggal Kejadian</label>
                          <input 
                            type="text" 
                            required
                            value={story.date}
                            onChange={(e) => updateStoryField(idx, "date", e.target.value)}
                            placeholder="Januari 2024"
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700">Tautan Foto Ilustrasi (Opsional)</label>
                          <input 
                            type="text" 
                            value={story.imageUrl || ""}
                            onChange={(e) => updateStoryField(idx, "imageUrl", e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-slate-50"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700">Isi Cerita</label>
                          <textarea 
                            required
                            value={story.body}
                            onChange={(e) => updateStoryField(idx, "body", e.target.value)}
                            rows={3}
                            placeholder="Tuliskan pengalaman bahagia Anda berdua..."
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-slate-800">Galeri Foto Prewedding</h3>
                <button 
                  type="button"
                  onClick={addGalleryItem}
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Foto
                </button>
              </div>

              {galleryList.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 italic text-center">Belum ada foto galeri prewedding.</p>
              ) : (
                <div className="space-y-4">
                  {galleryList.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex-1 grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Tautan URL Gambar</label>
                          <input 
                            type="text" 
                            required
                            value={item.url}
                            onChange={(e) => updateGalleryField(idx, "url", e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full border border-slate-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Keterangan Gambar (Caption)</label>
                          <input 
                            type="text" 
                            value={item.caption || ""}
                            onChange={(e) => updateGalleryField(idx, "caption", e.target.value)}
                            placeholder="Momen bahagia bersama"
                            className="w-full border border-slate-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => removeGalleryItem(idx)}
                        className="text-red-500 hover:text-red-700 shrink-0 self-end p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 5: Kado Digital Accounts */}
        {activeTab === "gifts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-800">Tanda Kasih / Rekening Hadiah</h3>
              <button 
                type="button"
                onClick={addGift}
                className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Akun
              </button>
            </div>

            {giftsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic text-center">Belum ada akun bank/rekening/alamat tanda kasih ditambahkan.</p>
            ) : (
              <div className="space-y-6">
                {giftsList.map((g, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-250/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Akun #{idx + 1}</span>
                      <button 
                        type="button" 
                        onClick={() => removeGift(idx)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-xs font-semibold"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Tipe Penerima</label>
                        <select
                          value={g.type}
                          onChange={(e) => updateGiftField(idx, "type", e.target.value)}
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none"
                        >
                          <option value="bank">Transfer Bank</option>
                          <option value="ewallet">E-Wallet (Gopay/OVO/etc)</option>
                          <option value="physical_address">Kirim Kado (Alamat Fisik)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Label Akun (cth: Bank BCA, Gopay)</label>
                        <input 
                          type="text" 
                          required
                          value={g.label}
                          onChange={(e) => updateGiftField(idx, "label", e.target.value)}
                          placeholder="Bank BCA"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Nama Pemilik Akun</label>
                        <input 
                          type="text" 
                          required
                          value={g.accountName}
                          onChange={(e) => updateGiftField(idx, "accountName", e.target.value)}
                          placeholder="Budi Santoso"
                          className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-white"
                        />
                      </div>

                      {g.type !== "physical_address" && (
                        <div className="space-y-1 sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-700">Nomor Rekening / E-Wallet</label>
                          <input 
                            type="text" 
                            required
                            value={g.accountNumber}
                            onChange={(e) => updateGiftField(idx, "accountNumber", e.target.value)}
                            placeholder="1234567890"
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-white font-mono"
                          />
                        </div>
                      )}

                      {g.type === "physical_address" && (
                        <div className="space-y-1 sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-700">Alamat Lengkap Pengiriman</label>
                          <textarea 
                            required
                            value={g.addressText || ""}
                            onChange={(e) => updateGiftField(idx, "addressText", e.target.value)}
                            placeholder="Tuliskan alamat lengkap pengiriman kado..."
                            rows={3}
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </form>
  );
}
