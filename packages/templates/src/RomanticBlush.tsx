import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Calendar, MapPin, Gift, Clock, Copy, Music, VolumeX, Volume2, Send, CheckCircle, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateProps, WishData } from "./types";
import { normalizeMapsEmbedUrl } from "shared";
import { ShareStoryModal, InstagramIcon } from "./ShareStoryModal";

export const RomanticBlush: React.FC<TemplateProps> = ({
  invitation,
  couple,
  events,
  stories,
  gallery,
  gifts,
  wishes,
  guestName = "Tamu Undangan",
  guestToken,
  onRsvpSubmit,
  onWishSubmit,
  onLikeWish,
  onGiftCheckout,
  isDemo = false,
  showWatermark = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  // RSVP Form state
  const [rsvpName, setRsvpName] = useState(guestName);
  const [rsvpAttendance, setRsvpAttendance] = useState<"yes" | "no" | "maybe">("yes");
  const [rsvpHeadcount, setRsvpHeadcount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // Wish Form state
  const [wishName, setWishName] = useState(guestName);
  const [wishMessage, setWishMessage] = useState("");
  const [wishStatus, setWishStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [localWishes, setLocalWishes] = useState<WishData[]>(wishes);

  // Gift Modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState(100000);
  const [giftSender, setGiftSender] = useState(guestName);
  const [giftMessage, setGiftMessage] = useState("");
  const [giftStatus, setGiftStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync wishes from props
  useEffect(() => {
    setLocalWishes(wishes);
  }, [wishes]);

  // Set default values from theme variables
  const theme = invitation.theme;
  const styleVariables = {
    "--primary": theme.colorPrimary || "#db2777", // Blush Pink
    "--accent": theme.colorAccent || "#f472b6", // Soft Pink
    "--bg": theme.colorBg || "#fff5f5", // Soft pink warm bg
    "--text": theme.colorText || "#4c0519", // Deep pinkish burgundy
    "--radius": theme.radius || "24px", // Extra rounded corners
    fontFamily: theme.fontBody || "Inter",
  } as React.CSSProperties;

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const mainEventDateStr = events[0]?.startAt || new Date().toISOString();
  
  useEffect(() => {
    const target = new Date(mainEventDateStr).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mainEventDateStr]);

  const handleOpen = () => {
    setIsOpen(true);
    setAudioPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log("Audio autoplay failed or blocked:", err);
      });
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log(e));
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpStatus("submitting");
    try {
      const res = await onRsvpSubmit({
        name: rsvpName,
        attendance: rsvpAttendance,
        headcount: rsvpHeadcount,
        message: rsvpMessage
      });
      if (res.success) {
        setRsvpStatus("success");
      } else {
        setRsvpStatus("error");
      }
    } catch {
      setRsvpStatus("error");
    }
  };

  const handleWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim() || !wishName.trim()) return;
    setWishStatus("submitting");
    try {
      const res = await onWishSubmit({
        name: wishName,
        message: wishMessage
      });
      if (res.success) {
        if (res.newWish) {
          setLocalWishes((current) => [res.newWish!, ...current]);
        }
        setWishMessage("");
        setWishStatus("success");
        setTimeout(() => setWishStatus("idle"), 3000);
      } else {
        setWishStatus("error");
      }
    } catch {
      setWishStatus("error");
    }
  };

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftStatus("submitting");
    try {
      const res = await onGiftCheckout({
        amount: giftAmount,
        senderName: giftSender,
        message: giftMessage,
        giftId: gifts[0]?.id || "dynamic"
      });
      if (res.success && res.checkoutUrl) {
        setCheckoutUrl(res.checkoutUrl);
        setGiftStatus("success");
      } else {
        setGiftStatus("error");
      }
    } catch {
      setGiftStatus("error");
    }
  };

  const getQuote = () => {
    const rel = invitation.religion.toLowerCase();
    if (rel === "islam") {
      return {
        verse: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang.",
        source: "QS. Ar-Rum: 21"
      };
    }
    return {
      verse: "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong.",
      source: "1 Korintus 13: 4"
    };
  };

  const quote = getQuote();

  return (
    <div style={styleVariables} className="min-h-screen relative w-full text-pink-950 bg-[#fff5f5] overflow-x-hidden">
      {/* Background Music */}
      {invitation.musicUrl && (
        <audio
          ref={audioRef}
          src={invitation.musicUrl}
          loop
          preload="auto"
        />
      )}

      {/* Floating Share Button */}
      {isOpen && (
        <button
          onClick={() => setShowShareModal(true)}
          className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-full shadow-xl bg-pink-600 text-white hover:bg-pink-700 transition duration-300 flex items-center gap-2 text-xs font-bold border border-pink-300/40"
          title="Bagikan ke Instagram Story"
        >
          <InstagramIcon size={18} />
          <span className="hidden sm:inline">Bagikan Story</span>
        </button>
      )}

      {/* Floating Audio Button */}
      {isOpen && invitation.musicUrl && (
        <button
          onClick={toggleAudio}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg bg-pink-600 text-white hover:bg-pink-700 transition duration-300 flex items-center justify-center animate-pulse"
        >
          {audioPlaying ? <Volume2 size={22} className="animate-spin-slow" /> : <VolumeX size={22} />}
        </button>
      )}

      <ShareStoryModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        invitation={invitation}
        couple={couple}
        event={events[0]}
        guestName={guestName}
        guestToken={guestToken}
      />

      {/* Cover Gate */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 text-center text-pink-950 bg-pink-100"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(255, 245, 245, 0.8), rgba(255, 245, 245, 0.9)), url(${invitation.coverImageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <div className="mt-12 space-y-2">
              <span className="tracking-widest uppercase text-pink-600 font-bold text-xs bg-pink-200/50 px-3 py-1 rounded-full">Wedding Invitation</span>
              <h1 className="text-4xl md:text-6xl mt-4 font-serif font-bold italic text-pink-900">
                {couple.groomNickname} & {couple.brideNickname}
              </h1>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] border border-pink-200 shadow-xl max-w-sm w-full space-y-4">
              <p className="text-[10px] uppercase tracking-wider text-pink-700 font-bold">Teruntuk Bapak/Ibu/Saudara/i</p>
              <h2 className="text-3xl font-bold font-serif text-pink-900 italic">{guestName}</h2>
              <p className="text-xs text-pink-600">Kami mengundang Anda untuk merayakan hari kebahagiaan kami berdua.</p>
              
              <button 
                onClick={handleOpen}
                className="mt-6 px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition duration-300 flex items-center justify-center gap-2 mx-auto shadow-lg text-sm"
              >
                <Heart size={16} className="fill-current" />
                Buka Undangan
              </button>
            </div>

            <div className="mb-8 font-serif text-pink-800 italic">
              {events[0] ? new Date(events[0].startAt).toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          {/* Section 1: Hero */}
          <section className="min-h-screen w-full flex flex-col justify-center items-center p-6 text-center relative"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(255, 245, 245, 0.85), rgba(255, 245, 245, 0.95)), url(${invitation.coverImageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <div className="max-w-xl space-y-6">
              <span className="text-pink-600 uppercase tracking-widest text-xs font-bold">The Love Story of</span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-pink-900 my-4">
                {couple.groomNickname} & {couple.brideNickname}
              </h1>
              <div className="bg-white/40 p-6 rounded-[24px] border border-pink-200/50 backdrop-blur-sm">
                <p className="text-pink-850 text-sm leading-relaxed italic">
                  "{quote.verse}"
                </p>
                <span className="text-xs text-pink-600 font-bold mt-2 block">— {quote.source}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Profiles */}
          <section className="py-24 px-6 max-w-5xl w-full text-center space-y-16">
            <div className="space-y-3">
              <h2 className="text-4xl font-serif font-bold italic text-pink-900">Mempelai Pernikahan</h2>
              <p className="text-sm text-pink-600 max-w-md mx-auto leading-relaxed">Atas restu orang tua kami, kami bermaksud untuk mengikat janji suci pernikahan:</p>
            </div>

            <div className={`flex flex-col ${couple.orderDisplay === "groom_first" ? "lg:flex-row" : "lg:flex-row-reverse"} justify-center items-center gap-16`}>
              
              {/* Groom */}
              <div className="flex flex-col items-center max-w-sm bg-white p-8 rounded-[36px] border border-pink-100 shadow-sm relative w-full">
                <div className="w-48 h-48 rounded-[32px] overflow-hidden bg-pink-50 p-1 border border-pink-200 rotate-3 shadow-md hover:rotate-0 transition duration-500">
                  <img 
                    src={couple.groomPhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    alt="Groom" 
                    className="w-full h-full object-cover rounded-[28px]"
                  />
                </div>
                <h3 className="text-2xl font-serif font-bold italic text-pink-900 mt-6">{couple.groomFullName}</h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600 mt-1">{couple.groomChildOrder}</p>
                <p className="text-xs text-pink-800 mt-2 leading-relaxed">
                  Putra dari <span className="font-semibold">{couple.groomFather}</span> <br /> & <span className="font-semibold">{couple.groomMother}</span>
                </p>
                {couple.groomInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.groomInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-4 flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 transition font-bold"
                  >
                    <span>@{couple.groomInstagram}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="text-pink-400 font-serif text-5xl italic">&</div>

              {/* Bride */}
              <div className="flex flex-col items-center max-w-sm bg-white p-8 rounded-[36px] border border-pink-100 shadow-sm relative w-full">
                <div className="w-48 h-48 rounded-[32px] overflow-hidden bg-pink-50 p-1 border border-pink-200 -rotate-3 shadow-md hover:rotate-0 transition duration-500">
                  <img 
                    src={couple.bridePhotoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"} 
                    alt="Bride" 
                    className="w-full h-full object-cover rounded-[28px]"
                  />
                </div>
                <h3 className="text-2xl font-serif font-bold italic text-pink-900 mt-6">{couple.brideFullName}</h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600 mt-1">{couple.brideChildOrder}</p>
                <p className="text-xs text-pink-800 mt-2 leading-relaxed">
                  Putri dari <span className="font-semibold">{couple.brideFather}</span> <br /> & <span className="font-semibold">{couple.brideMother}</span>
                </p>
                {couple.brideInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.brideInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-4 flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 transition font-bold"
                  >
                    <span>@{couple.brideInstagram}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

            </div>
          </section>

          {/* Section 3: Events & Countdown */}
          <section className="py-24 px-6 w-full bg-[#fff0f0] flex flex-col items-center">
            <h2 className="text-4xl font-serif font-bold italic text-pink-900 text-center mb-12">Agenda Bahagia</h2>
            
            {/* Countdown */}
            <div className="flex gap-4 mb-16 bg-white px-8 py-4 rounded-[24px] shadow-sm border border-pink-200 max-w-sm w-full justify-around text-center text-pink-950 font-serif">
              <div>
                <span className="text-3xl font-bold">{timeLeft.days}</span>
                <p className="text-[10px] text-pink-600 uppercase tracking-widest mt-0.5">Hari</p>
              </div>
              <div className="text-pink-300 text-3xl font-bold">:</div>
              <div>
                <span className="text-3xl font-bold">{timeLeft.hours}</span>
                <p className="text-[10px] text-pink-600 uppercase tracking-widest mt-0.5">Jam</p>
              </div>
              <div className="text-pink-300 text-3xl font-bold">:</div>
              <div>
                <span className="text-3xl font-bold">{timeLeft.minutes}</span>
                <p className="text-[10px] text-pink-600 uppercase tracking-widest mt-0.5">Menit</p>
              </div>
              <div className="text-pink-300 text-3xl font-bold">:</div>
              <div>
                <span className="text-3xl font-bold">{timeLeft.seconds}</span>
                <p className="text-[10px] text-pink-600 uppercase tracking-widest mt-0.5">Detik</p>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
              {events.map((evt) => {
                const dateStart = new Date(evt.startAt);
                const dateEnd = new Date(evt.endAt);
                
                return (
                  <div key={evt.id} className="bg-white p-8 rounded-[36px] shadow-sm border border-pink-100 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between border-b border-pink-100 pb-4 mb-4">
                        <h3 className="text-2xl font-serif font-bold italic text-pink-900">{evt.title}</h3>
                        <Heart className="text-pink-600 fill-current" size={16} />
                      </div>
                      <div className="space-y-4 text-xs text-pink-900 leading-normal">
                        <div className="flex items-start gap-3">
                          <Calendar className="text-pink-600 shrink-0 mt-0.5" size={16} />
                          <div>
                            <p className="font-bold text-sm text-pink-950">
                              {dateStart.toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-pink-500">
                              {dateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dateEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="text-pink-600 shrink-0 mt-0.5" size={16} />
                          <div>
                            <p className="font-bold text-sm text-pink-950">{evt.venueName}</p>
                            <p className="text-[10px] text-pink-500 leading-relaxed">{evt.venueAddress}</p>
                          </div>
                        </div>
                        {evt.dressCode && (
                          <div className="text-[11px] bg-pink-50 text-pink-950 p-3 rounded-[16px] border border-pink-100">
                            <span className="font-bold">Dress Code:</span> {evt.dressCode}
                          </div>
                        )}
                        {evt.note && (
                          <p className="italic text-pink-400">Catatan: {evt.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {normalizeMapsEmbedUrl(evt.mapsEmbed) && (
                        <iframe
                          src={normalizeMapsEmbedUrl(evt.mapsEmbed)!}
                          title={`Peta ${evt.venueName}`}
                          className="w-full min-h-72 rounded-[20px] border border-pink-100"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                          allowFullScreen
                        />
                      )}
                      {evt.mapsUrl && (
                        <a 
                          href={evt.mapsUrl}
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full text-center block py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition text-xs shadow-sm"
                        >
                          Buka Peta Lokasi
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: Love Story */}
          {stories.length > 0 && (
            <section className="py-24 px-6 max-w-2xl w-full text-center">
              <h2 className="text-4xl font-serif font-bold italic text-pink-900 mb-12">Kisah Cinta Kami</h2>
              
              <div className="relative border-l border-pink-200 text-left pl-6 ml-4 space-y-12">
                {stories.map((story) => (
                  <div key={story.id} className="relative">
                    <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-pink-600" />
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-100 border border-pink-200 px-3 py-1 rounded-full uppercase">{story.date}</span>
                    <h3 className="text-lg font-serif font-bold italic text-pink-900 mt-3">{story.title}</h3>
                    <p className="text-pink-850 text-xs mt-2 leading-relaxed">{story.body}</p>
                    {story.imageUrl && (
                      <div className="mt-4 rounded-[20px] overflow-hidden max-h-48 max-w-xs shadow-sm border border-pink-100">
                        <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Gallery */}
          {gallery.length > 0 && (
            <section className="py-24 px-6 w-full bg-[#fff0f0] flex flex-col items-center">
              <h2 className="text-4xl font-serif font-bold italic text-pink-900 text-center mb-12">Kenangan Indah</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full">
                {gallery.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveImage(item.url)}
                    className="cursor-pointer overflow-hidden rounded-[24px] bg-white p-1.5 border border-pink-100 shadow-sm aspect-square relative group"
                  >
                    <img src={item.url} alt="Gallery" className="w-full h-full object-cover rounded-[18px]" />
                  </div>
                ))}
              </div>

              {activeImage && (
                <div 
                  className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => setActiveImage(null)}
                >
                  <img src={activeImage} alt="Large" className="max-h-[90vh] max-w-full object-contain rounded-[16px]" />
                </div>
              )}
            </section>
          )}

          {/* Section 6: RSVP */}
          <section className="py-24 px-6 max-w-lg w-full">
            <div className="bg-white p-8 rounded-[36px] shadow-lg border border-pink-100 text-center">
              <h2 className="text-3xl font-serif font-bold italic text-pink-900 mb-2">Konfirmasi Kehadiran</h2>
              <p className="text-[10px] text-pink-500 uppercase tracking-wider mb-8">Mohon konfirmasi kehadiran Anda di bawah ini:</p>

              {rsvpStatus === "success" ? (
                <div className="py-8 text-center flex flex-col items-center gap-3">
                  <CheckCircle size={44} className="text-pink-600" />
                  <h3 className="text-xl font-bold font-serif italic text-pink-900 mt-2">Terima Kasih!</h3>
                  <p className="text-xs text-pink-700 max-w-xs leading-relaxed">Konfirmasi kehadiran Anda telah berhasil disimpan di sistem.</p>
                </div>
              ) : (
                <form onSubmit={handleRsvp} className="text-left space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-pink-800 mb-1">NAMA LENGKAP</label>
                    <input 
                      type="text" 
                      required 
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-pink-800 mb-1">KEHADIRAN</label>
                    <select
                      value={rsvpAttendance}
                      onChange={(e) => setRsvpAttendance(e.target.value as any)}
                      className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs bg-white focus:outline-none focus:border-pink-500 bg-pink-50/50"
                    >
                      <option value="yes">Hadir</option>
                      <option value="maybe">Masih Ragu</option>
                      <option value="no">Tidak Bisa Hadir</option>
                    </select>
                  </div>
                  {rsvpAttendance !== "no" && (
                    <div>
                      <label className="block text-[10px] font-bold text-pink-800 mb-1">JUMLAH TAMU</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        required 
                        value={rsvpHeadcount}
                        onChange={(e) => setRsvpHeadcount(parseInt(e.target.value) || 1)}
                        className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/50"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-pink-800 mb-1">DOA / UCAPAN</label>
                    <textarea 
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      placeholder="Tuliskan ucapan selamat..."
                      rows={4}
                      className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/50"
                    />
                  </div>
                  {rsvpStatus === "error" && (
                    <p className="text-xs text-red-500">Terjadi kesalahan, harap ulangi.</p>
                  )}
                  <button
                    type="submit"
                    disabled={rsvpStatus === "submitting"}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition shadow-sm text-xs"
                  >
                    {rsvpStatus === "submitting" ? "Mengirim..." : "Kirim Konfirmasi"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Section 7: wishes */}
          <section className="py-24 px-6 max-w-2xl w-full bg-[#fff0f0] rounded-[48px] text-center">
            <h2 className="text-3xl font-serif font-bold italic text-pink-900 mb-2">Buku Doa</h2>
            <p className="text-[10px] text-pink-500 uppercase tracking-wider mb-8">Tinggalkan kenangan kata doa untuk kami berdua:</p>

            <form onSubmit={handleWish} className="text-left bg-white p-6 rounded-[24px] border border-pink-100 mb-8 space-y-4">
              <div>
                <input 
                  type="text" 
                  required 
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="Nama Pengirim..."
                  className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/50"
                />
              </div>
              <div>
                <textarea 
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Doa dan ucapan selamat..."
                  rows={3}
                  className="w-full border border-pink-100 px-4 py-2.5 rounded-[16px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/50"
                />
              </div>
              <button
                type="submit"
                disabled={wishStatus === "submitting"}
                className="py-2.5 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition text-xs flex items-center justify-center gap-2"
              >
                <Send size={12} />
                Kirim Doa
              </button>
            </form>

            <div className="space-y-4 text-left max-h-96 overflow-y-auto pr-2">
              {localWishes.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-[20px] border border-pink-50 shadow-sm">
                  <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                    <span className="font-bold text-pink-900 text-xs italic">{w.name}</span>
                    <span className="text-[9px] text-pink-400">
                      {new Date(w.createdAt).toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-pink-850 text-xs mt-2 leading-relaxed">{w.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8: Gifts */}
          <section className="py-24 px-6 max-w-xl w-full text-center">
            <h2 className="text-3xl font-serif font-bold italic text-pink-900 mb-2">Kado Pernikahan</h2>
            <p className="text-[10px] text-pink-500 uppercase tracking-wider mb-8">Kirimkan kado non-tunai Anda langsung ke rekening pengantin:</p>

            <div className="space-y-4">
              {gifts.map((gift, idx) => (
                <div key={gift.id} className="bg-white p-6 rounded-[28px] border border-pink-100 shadow-sm text-left flex flex-col justify-between md:flex-row md:items-center gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-pink-600 uppercase tracking-widest bg-pink-50 border border-pink-100 px-2.5 py-0.5 rounded-full">{gift.label}</span>
                    <h4 className="text-base font-bold text-pink-950 mt-2 font-serif italic">{gift.accountName}</h4>
                    <p className="text-xs font-mono text-pink-800 mt-1">{gift.accountNumber}</p>
                    {gift.addressText && (
                      <p className="text-[10px] text-pink-650 mt-2 leading-relaxed">{gift.addressText}</p>
                    )}
                  </div>
                  
                  {gift.type !== "physical_address" && (
                    <button
                      onClick={() => copyToClipboard(gift.accountNumber, idx)}
                      className="px-4 py-2 border border-pink-600 text-pink-600 font-bold rounded-full hover:bg-pink-50 transition text-[10px] flex items-center justify-center gap-1.5 self-start md:self-center shrink-0"
                    >
                      <Copy size={12} />
                      {copiedIndex === idx ? "Tersalin" : "Salin"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isDemo && (
              <div className="mt-8 bg-pink-50 p-6 rounded-[28px] border border-pink-200 max-w-md mx-auto">
                <Gift className="text-pink-600 mx-auto mb-2" size={24} />
                <h4 className="font-serif font-bold text-pink-900 text-base italic">Kirim Dompet Digital (Online)</h4>
                <p className="text-[10px] text-pink-500 mt-2 leading-relaxed">Kirim amplop langsung via QRIS/Transfer VA. Transaksi otomatis terverifikasi oleh server.</p>
                <button
                  onClick={() => {
                    setCheckoutUrl(null);
                    setShowGiftModal(true);
                  }}
                  className="mt-4 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition text-xs shadow-md"
                >
                  KIRIM AMPLOP ONLINE
                </button>
              </div>
            )}
          </section>

          {/* Dynamic Gift Dialog */}
          {showGiftModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-[32px] max-w-md w-full shadow-2xl text-left relative border border-pink-100">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ×
                </button>
                <h3 className="text-base font-bold font-serif italic text-pink-900 border-b border-pink-50 pb-3 mb-4 flex items-center gap-2">
                  <Gift size={16} />
                  Kirim Dompet Digital
                </h3>

                {checkoutUrl ? (
                  <div className="space-y-4 py-4 text-center">
                    <CheckCircle className="text-pink-600 mx-auto" size={44} />
                    <h4 className="font-bold text-pink-900 text-sm">CHECKOUT SIAP!</h4>
                    <p className="text-[10px] text-pink-500">Halaman checkout simulator telah aktif. Lakukan pembayaran simulasi.</p>
                    <a 
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 transition text-xs shadow-md"
                    >
                      Buka Simulator Pembayaran
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleGiftSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-pink-850 mb-1">NAMA PENGIRIM</label>
                      <input 
                        type="text" 
                        required 
                        value={giftSender}
                        onChange={(e) => setGiftSender(e.target.value)}
                        className="w-full border border-pink-100 px-4 py-2 rounded-[12px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-pink-850 mb-1">NOMINAL TRANSFER (IDR)</label>
                      <input 
                        type="number" 
                        required 
                        min={10000}
                        step={10000}
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        className="w-full border border-pink-100 px-4 py-2 rounded-[12px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-pink-850 mb-1">DOA & HARAPAN (OPSIONAL)</label>
                      <textarea 
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Tulis ucapan singkat..."
                        rows={3}
                        className="w-full border border-pink-100 px-4 py-2 rounded-[12px] text-xs focus:outline-none focus:border-pink-500 bg-pink-50/30"
                      />
                    </div>
                    {giftStatus === "error" && (
                      <p className="text-xs text-red-500 font-bold">Terjadi kesalahan membuat pembayaran.</p>
                    )}
                    <button
                      type="submit"
                      disabled={giftStatus === "submitting"}
                      className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition text-xs"
                    >
                      {giftStatus === "submitting" ? "Menyiapkan Transaksi..." : "Lanjutkan Pembayaran"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Section 9: Footer */}
          <footer className="w-full py-20 px-6 bg-pink-950 text-pink-200 text-center flex flex-col items-center">
            <Heart size={20} className="text-pink-400 fill-current mb-4" />
            <h4 className="text-xl font-serif font-bold italic text-white">{couple.groomNickname} & {couple.brideNickname}</h4>
            <p className="text-[10px] text-pink-300 mt-2 max-w-xs leading-normal">Kehadiran dan doa restu Anda adalah karunia yang sangat berharga bagi awal bahtera hidup kami.</p>
            <div className="mt-12 border-t border-pink-900 pt-8 w-full max-w-md text-[9px] text-pink-400">
              {showWatermark && <p>POWERED BY SURATDIGITAL</p>}
              <p className="mt-1">© {new Date().getFullYear()} {couple.groomNickname} & {couple.brideNickname}</p>
            </div>
          </footer>

        </motion.div>
      )}
    </div>
  );
};
