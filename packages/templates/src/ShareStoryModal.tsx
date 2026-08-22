import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Copy, Check, Share2, Sparkles, Heart, Calendar, MapPin
} from "lucide-react";
import { CoupleData, EventData, InvitationData } from "./types";

export const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: InvitationData;
  couple: CoupleData;
  event?: EventData;
  guestName?: string;
  guestToken?: string;
}

export const ShareStoryModal: React.FC<ShareStoryModalProps> = ({
  isOpen,
  onClose,
  invitation,
  couple,
  event,
  guestName,
  guestToken
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<"aesthetic" | "formal">("aesthetic");

  if (!isOpen) return null;

  // Prepare names and links
  const groomName = couple.groomNickname || couple.groomFullName.split(" ")[0];
  const brideName = couple.brideNickname || couple.brideFullName.split(" ")[0];
  const titleDisplay = couple.orderDisplay === "bride_first" 
    ? `${brideName} & ${groomName}` 
    : `${groomName} & ${brideName}`;

  // Current Origin URL fallback
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = guestToken 
    ? `${origin}/${invitation.slug}/g/${guestToken}` 
    : `${origin}/${invitation.slug}`;

  // Format date if event exists
  const eventDate = event?.startAt 
    ? new Date(event.startAt).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Save The Date";

  const aestheticCaption = `✨ The Digital Commitment & Wedding of ${titleDisplay} ✨\n\nKepada keluarga & sahabat tercinta, kami dengan penuh rasa syukur mengundang Anda untuk menjadi bagian dari hari bahagia kami.\n\n💌 Buka undangan digital lengkap via link di bio / sticker story:\n${publicUrl}\n\n#${groomName}${brideName}Wedding #SuratDigital #SaveTheDate`;

  const formalCaption = `Kepada Yth. Bapak/Ibu/Saudara/i,\n\nDengan memohon rahmat dan ridho Allah SWT / Tuhan YME, kami bermaksud menyelenggarakan acara pernikahan ${titleDisplay}.\n\nDetail informasi dan konfirmasi kehadiran (RSVP) dapat diakses melalui tautan undangan digital:\n${publicUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`;

  const currentCaption = captionStyle === "aesthetic" ? aestheticCaption : formalCaption;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCaption = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Undangan Digital: ${titleDisplay}`,
          text: currentCaption,
          url: publicUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // QR Code URL Generator using standard dynamic image API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}&color=2e3a35&bgcolor=ffffff&qzone=1`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-150 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-pink-50/80 via-white to-amber-50/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white shadow-sm flex items-center justify-center">
                <InstagramIcon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-serif">Instagram Story & Social Share</h3>
                <p className="text-[11px] text-slate-500">Bagikan surat digital estetik Anda ke media sosial</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content: 2 Column Layout (Story Card Preview + Share Actions) */}
          <div className="p-6 grid md:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: 9:16 Vertical Story Card Visual */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                Pratinjau Story Card (9:16)
              </span>
              
              <div className="w-full max-w-[260px] aspect-[9/16] rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between p-5 text-center text-white bg-slate-900 border-2 border-amber-200/40">
                {/* Background Overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-35 scale-105"
                  style={{ 
                    backgroundImage: `url(${invitation.coverImageUrl || couple.bridePhotoUrl || couple.groomPhotoUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"})` 
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90" />

                {/* Card Top */}
                <div className="relative z-10 space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                    <Sparkles size={10} /> Official Digital Letter
                  </span>
                  <p className="text-[10px] text-slate-300 tracking-wider font-light uppercase">The Wedding & Commitment Of</p>
                </div>

                {/* Card Middle: Couple Names */}
                <div className="relative z-10 space-y-2 py-2">
                  <h4 className="text-2xl font-serif font-bold text-amber-100 leading-tight drop-shadow-md">
                    {titleDisplay}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-200/90 font-medium">
                    <Heart size={12} className="text-pink-400 fill-current animate-pulse" />
                    <span>{eventDate}</span>
                  </div>
                  {event?.venueName && (
                    <p className="text-[10px] text-slate-300 flex items-center justify-center gap-1 max-w-[200px] mx-auto truncate">
                      <MapPin size={10} className="shrink-0 text-amber-400" />
                      <span className="truncate">{event.venueName}</span>
                    </p>
                  )}
                </div>

                {/* Card Bottom: QR Code + Sticker Prompt */}
                <div className="relative z-10 flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code Undangan" 
                    className="w-16 h-16 rounded-lg bg-white p-1 shadow-md"
                  />
                  <div className="text-[9px] text-slate-300 leading-tight">
                    <p className="font-semibold text-amber-200">Scan QR / Klik Tautan</p>
                    <p className="text-[8px] text-slate-400">surat-digital.id/{invitation.slug}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Copy Tools & Social Share */}
            <div className="space-y-4 text-left">
              
              {/* Step 1: Link IG Story Sticker */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <InstagramIcon size={14} className="text-pink-600" />
                    1. Link Sticker Instagram Story
                  </span>
                  <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded-full">
                    Rekomendasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Salin tautan ini, buka Instagram Story, pilih sticker <strong>&quot;LINK&quot;</strong>, lalu tempel URL:
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={publicUrl} 
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  >
                    {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    <span>{copiedLink ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Caption Generator */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    2. Caption Postingan / Story
                  </span>
                  <div className="flex gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button 
                      onClick={() => setCaptionStyle("aesthetic")}
                      className={`px-2 py-0.5 rounded-md transition ${captionStyle === "aesthetic" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                    >
                      Aesthetic (Gen Z)
                    </button>
                    <button 
                      onClick={() => setCaptionStyle("formal")}
                      className={`px-2 py-0.5 rounded-md transition ${captionStyle === "formal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                    >
                      Formal
                    </button>
                  </div>
                </div>

                <textarea 
                  readOnly 
                  rows={4}
                  value={currentCaption}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 font-sans resize-none leading-relaxed"
                />

                <button 
                  onClick={handleCopyCaption}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  {copiedCaption ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedCaption ? "Caption Berhasil Disalin!" : "Salin Teks Caption"}</span>
                </button>
              </div>

              {/* Direct Native Share */}
              <button 
                onClick={handleNativeShare}
                className="w-full py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Share2 size={16} />
                <span>Bagikan Sekarang (Share)</span>
              </button>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
