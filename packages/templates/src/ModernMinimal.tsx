import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Calendar, MapPin, Gift, Clock, Copy, Music, VolumeX, Volume2, Send, CheckCircle, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateProps, WishData } from "./types";
import { normalizeMapsEmbedUrl } from "shared";
import { ShareStoryModal, InstagramIcon } from "./ShareStoryModal";

export const ModernMinimal: React.FC<TemplateProps> = ({
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
    "--primary": theme.colorPrimary || "#3f3f46", // Dark Zinc
    "--accent": theme.colorAccent || "#18181b", // Deep Black Zinc
    "--bg": theme.colorBg || "#f4f4f5", // Light cool grey
    "--text": theme.colorText || "#09090b", // Near black
    "--radius": theme.radius || "0px", // Sharp edges
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
        verse: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya...",
        source: "QS. Ar-Rum: 21"
      };
    }
    return {
      verse: "Cinta itu sabar; cinta itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungan diri sendiri.",
      source: "1 Korintus 13: 4-5"
    };
  };

  const quote = getQuote();

  return (
    <div style={styleVariables} className="min-h-screen relative w-full text-zinc-900 bg-zinc-50 overflow-x-hidden font-sans">
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
          className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-none shadow-xl bg-zinc-950 text-white hover:bg-zinc-800 transition duration-300 flex items-center gap-2 text-xs font-mono border border-zinc-700"
          title="Share to Instagram Story"
        >
          <InstagramIcon size={16} />
          <span className="hidden sm:inline">SHARE STORY</span>
        </button>
      )}

      {/* Floating Audio Button */}
      {isOpen && invitation.musicUrl && (
        <button
          onClick={toggleAudio}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-none shadow-md bg-zinc-950 text-white hover:bg-zinc-800 transition duration-300 flex items-center justify-center border border-white/25"
        >
          {audioPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
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
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-8 bg-zinc-950 text-white"
          >
            <div className="flex justify-between items-start border-b border-zinc-800 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">M01 // THE WEDDING OF</p>
                <h1 className="text-3xl font-mono uppercase font-bold mt-1 tracking-tight">
                  {couple.groomNickname} + {couple.brideNickname}
                </h1>
              </div>
              <span className="text-xs font-mono text-zinc-500">2026 // CO.</span>
            </div>

            <div className="max-w-xl self-start space-y-6">
              <p className="text-xs uppercase tracking-widest text-zinc-400">Selamat datang, kami mengundang Anda:</p>
              <h2 className="text-5xl font-semibold tracking-tight uppercase leading-none">{guestName}</h2>
              <p className="text-sm text-zinc-400 max-w-sm">Kami memohon doa restu Bapak/Ibu/Saudara/i untuk melangsungkan ibadah suci pernikahan kami.</p>
              
              <button 
                onClick={handleOpen}
                className="mt-4 px-6 py-4 bg-white text-zinc-950 font-mono text-xs uppercase hover:bg-zinc-200 transition duration-300 flex items-center gap-4 shadow-lg"
              >
                <span>OPEN INVITATION</span>
                <Heart size={14} className="fill-current" />
              </button>
            </div>

            <div className="flex justify-between items-end border-t border-zinc-800 pt-6 text-[10px] font-mono text-zinc-500">
              <span>EST. 2026</span>
              <span>SCROLL DOWN AFTER UNLOCK</span>
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
          {/* Section 1: Hero Header */}
          <section className="min-h-screen w-full flex flex-col justify-center items-start p-8 md:p-20 bg-zinc-950 text-white relative">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">01 // INTRODUCTION</span>
            <h1 className="text-6xl md:text-8xl font-bold uppercase mt-6 tracking-tighter leading-none">
              {couple.groomNickname} <br /> & {couple.brideNickname}
            </h1>
            <div className="mt-12 max-w-md border-l border-zinc-700 pl-6 space-y-4">
              <p className="text-zinc-400 text-sm italic">
                "{quote.verse}"
              </p>
              <span className="text-xs font-mono text-zinc-500 block">— {quote.source}</span>
            </div>
          </section>

          {/* Section 2: Mempelai */}
          <section className="py-24 px-8 max-w-5xl w-full">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">02 // THE COUPLE</span>
            <h2 className="text-4xl font-bold uppercase tracking-tight mt-2 mb-16">The Groom & The Bride</h2>

            <div className="grid md:grid-cols-2 gap-16 border-t border-zinc-200 pt-16">
              
              {/* Groom */}
              <div className="space-y-6">
                <div className="w-full aspect-[4/5] overflow-hidden bg-zinc-100 border border-zinc-200">
                  <img 
                    src={couple.groomPhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    alt="Groom Photo" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight">{couple.groomFullName}</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-mono">{couple.groomChildOrder}</p>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Putra tercinta dari pasangan suami istri <span className="font-semibold text-zinc-950">{couple.groomFather}</span> dan <span className="font-semibold text-zinc-950">{couple.groomMother}</span>.
                </p>
                {couple.groomInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.groomInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition"
                  >
                    <span>IG: @{couple.groomInstagram}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Bride */}
              <div className="space-y-6">
                <div className="w-full aspect-[4/5] overflow-hidden bg-zinc-100 border border-zinc-200">
                  <img 
                    src={couple.bridePhotoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"} 
                    alt="Bride Photo" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight">{couple.brideFullName}</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-mono">{couple.brideChildOrder}</p>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Putri tercinta dari pasangan suami istri <span className="font-semibold text-zinc-950">{couple.brideFather}</span> dan <span className="font-semibold text-zinc-950">{couple.brideMother}</span>.
                </p>
                {couple.brideInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.brideInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition"
                  >
                    <span>IG: @{couple.brideInstagram}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

            </div>
          </section>

          {/* Section 3: Agenda Acara */}
          <section className="py-24 px-8 w-full bg-zinc-100 flex flex-col items-center">
            <div className="max-w-5xl w-full">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">03 // AGENDA</span>
              <h2 className="text-4xl font-bold uppercase tracking-tight mt-2 mb-12">Wedding Schedules</h2>

              {/* Countdown */}
              <div className="grid grid-cols-4 gap-4 max-w-sm mb-16 font-mono text-zinc-900">
                <div className="bg-zinc-200 p-4 text-center">
                  <span className="text-2xl font-bold block">{timeLeft.days}</span>
                  <span className="text-[9px] text-zinc-500">DAYS</span>
                </div>
                <div className="bg-zinc-200 p-4 text-center">
                  <span className="text-2xl font-bold block">{timeLeft.hours}</span>
                  <span className="text-[9px] text-zinc-500">HRS</span>
                </div>
                <div className="bg-zinc-200 p-4 text-center">
                  <span className="text-2xl font-bold block">{timeLeft.minutes}</span>
                  <span className="text-[9px] text-zinc-500">MINS</span>
                </div>
                <div className="bg-zinc-200 p-4 text-center">
                  <span className="text-2xl font-bold block">{timeLeft.seconds}</span>
                  <span className="text-[9px] text-zinc-500">SECS</span>
                </div>
              </div>

              {/* Event Cards */}
              <div className="grid md:grid-cols-2 gap-8 border-t border-zinc-200 pt-16">
                {events.map((evt) => {
                  const dateStart = new Date(evt.startAt);
                  const dateEnd = new Date(evt.endAt);
                  
                  return (
                    <div key={evt.id} className="bg-white p-8 border border-zinc-200 flex flex-col justify-between space-y-8">
                      <div className="space-y-4">
                        <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                          <h3 className="text-lg font-bold uppercase tracking-widest font-mono text-zinc-700">{evt.title}</h3>
                          <span className="text-[10px] uppercase font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5">{evt.type}</span>
                        </div>
                        <div className="space-y-2 text-sm text-zinc-600">
                          <p className="font-semibold text-zinc-900 font-mono">
                            {dateStart.toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="font-mono text-xs">
                            {dateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dateEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-zinc-800 mt-2 font-semibold">{evt.venueName}</p>
                          <p className="text-xs text-zinc-500 leading-normal">{evt.venueAddress}</p>
                          {evt.dressCode && (
                            <p className="text-xs text-zinc-500 mt-2"><span className="font-mono text-zinc-900 font-bold">DRESSCODE:</span> {evt.dressCode}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {normalizeMapsEmbedUrl(evt.mapsEmbed) && (
                          <iframe
                            src={normalizeMapsEmbedUrl(evt.mapsEmbed)!}
                            title={`Map for ${evt.venueName}`}
                            className="w-full aspect-[16/9] border border-zinc-200"
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
                            className="w-full block text-center py-3 bg-zinc-950 text-white font-mono text-xs uppercase hover:bg-zinc-800 transition shadow-md"
                          >
                            GOOGLE MAPS DIRECTIONS
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 4: Timeline */}
          {stories.length > 0 && (
            <section className="py-24 px-8 max-w-4xl w-full">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">04 // STORY</span>
              <h2 className="text-4xl font-bold uppercase tracking-tight mt-2 mb-16">Love Timeline</h2>

              <div className="space-y-12">
                {stories.map((story) => (
                  <div key={story.id} className="grid md:grid-cols-4 gap-6 border-b border-zinc-100 pb-12">
                    <div className="md:col-span-1">
                      <span className="text-lg font-mono font-bold text-zinc-400 uppercase">{story.date}</span>
                    </div>
                    <div className="md:col-span-3 space-y-4">
                      <h3 className="text-xl font-bold uppercase tracking-tight text-zinc-900">{story.title}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">{story.body}</p>
                      {story.imageUrl && (
                        <div className="rounded-none overflow-hidden max-h-64 border border-zinc-200">
                          <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover grayscale" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Gallery */}
          {gallery.length > 0 && (
            <section className="py-24 px-8 w-full bg-zinc-100 flex flex-col items-center">
              <div className="max-w-5xl w-full">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">05 // GALLERY</span>
                <h2 className="text-4xl font-bold uppercase tracking-tight mt-2 mb-12">Prewedding Capture</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {gallery.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveImage(item.url)}
                      className="cursor-pointer overflow-hidden border border-zinc-200 aspect-[3/4] bg-zinc-200 hover:opacity-95 transition"
                    >
                      <img src={item.url} alt="Gallery" className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-500" />
                    </div>
                  ))}
                </div>
              </div>

              {activeImage && (
                <div 
                  className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => setActiveImage(null)}
                >
                  <img src={activeImage} alt="Large" className="max-h-[90vh] max-w-full object-contain" />
                </div>
              )}
            </section>
          )}

          {/* Section 6: RSVP */}
          <section className="py-24 px-8 max-w-xl w-full">
            <div className="border border-zinc-200 p-8 bg-white">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-center mb-2">RSVP</h2>
              <p className="text-xs text-zinc-400 text-center uppercase tracking-widest font-mono mb-8">// CONFIRM ATTENDANCE</p>

              {rsvpStatus === "success" ? (
                <div className="py-8 text-center flex flex-col items-center gap-3">
                  <CheckCircle size={40} className="text-zinc-900" />
                  <h3 className="text-lg font-bold uppercase font-mono mt-2">CONFIRMED</h3>
                  <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">Thank you, your attendance response has been securely filed in our database.</p>
                </div>
              ) : (
                <form onSubmit={handleRsvp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">YOUR NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full border border-zinc-200 px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">ATTENDANCE</label>
                    <select
                      value={rsvpAttendance}
                      onChange={(e) => setRsvpAttendance(e.target.value as any)}
                      className="w-full border border-zinc-200 px-4 py-3 text-xs bg-zinc-50 focus:outline-none focus:border-zinc-900 font-mono"
                    >
                      <option value="yes">ATTENDING</option>
                      <option value="maybe">MAYBE</option>
                      <option value="no">UNABLE TO ATTEND</option>
                    </select>
                  </div>
                  {rsvpAttendance !== "no" && (
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">GUEST NUMBER</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        required 
                        value={rsvpHeadcount}
                        onChange={(e) => setRsvpHeadcount(parseInt(e.target.value) || 1)}
                        className="w-full border border-zinc-200 px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50 font-mono"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">SHORT MESSAGE</label>
                    <textarea 
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      placeholder="WISHES..."
                      rows={4}
                      className="w-full border border-zinc-200 px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50 font-mono"
                    />
                  </div>
                  {rsvpStatus === "error" && (
                    <p className="text-xs text-red-500 font-mono uppercase">ERROR IN RECORDING. PLEASE RETRY.</p>
                  )}
                  <button
                    type="submit"
                    disabled={rsvpStatus === "submitting"}
                    className="w-full py-4 bg-zinc-950 text-white font-mono text-xs uppercase hover:bg-zinc-800 transition"
                  >
                    {rsvpStatus === "submitting" ? "TRANSMITTING..." : "SUBMIT RESPONSE"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Section 7: Wishes */}
          <section className="py-24 px-8 max-w-2xl w-full bg-zinc-100 text-center">
            <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Guest Wishes</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-8">// BARKALLAH / CONGRATS</p>

            <form onSubmit={handleWish} className="text-left bg-white p-6 border border-zinc-200 mb-8 space-y-4">
              <div>
                <input 
                  type="text" 
                  required 
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="NAME..."
                  className="w-full border border-zinc-200 px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50 font-mono"
                />
              </div>
              <div>
                <textarea 
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="MESSAGE..."
                  rows={3}
                  className="w-full border border-zinc-200 px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={wishStatus === "submitting"}
                className="py-3 px-6 bg-zinc-950 text-white font-mono text-xs uppercase hover:bg-zinc-800 transition flex items-center justify-center gap-2"
              >
                <Send size={12} />
                SEND WISH
              </button>
            </form>

            <div className="space-y-4 text-left max-h-96 overflow-y-auto pr-2 font-mono">
              {localWishes.map((w) => (
                <div key={w.id} className="bg-white p-4 border border-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="font-bold text-zinc-900 text-xs">{w.name}</span>
                    <span className="text-[9px] text-zinc-400">
                      {new Date(w.createdAt).toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed">{w.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8: Wedding Gift */}
          <section className="py-24 px-8 max-w-xl w-full text-center">
            <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Digital Gifts</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-8">// ENVELOPE & PHYSICAL PRESENTS</p>

            <div className="space-y-4 font-mono">
              {gifts.map((gift, idx) => (
                <div key={gift.id} className="bg-white p-6 border border-zinc-200 text-left flex flex-col justify-between md:flex-row md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white bg-zinc-900 px-2 py-0.5 uppercase">{gift.label}</span>
                    <h4 className="text-sm font-bold text-zinc-900 mt-2">{gift.accountName}</h4>
                    <p className="text-xs text-zinc-600">{gift.accountNumber}</p>
                    {gift.addressText && (
                      <p className="text-[10px] text-zinc-400 mt-2 leading-normal">{gift.addressText}</p>
                    )}
                  </div>
                  
                  {gift.type !== "physical_address" && (
                    <button
                      onClick={() => copyToClipboard(gift.accountNumber, idx)}
                      className="px-4 py-2 border border-zinc-900 text-zinc-900 font-mono text-[10px] uppercase hover:bg-zinc-100 transition self-start md:self-center shrink-0"
                    >
                      {copiedIndex === idx ? "COPIED" : "COPY DETAILS"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isDemo && (
              <div className="mt-8 bg-zinc-100 p-6 border border-zinc-300 max-w-md mx-auto font-mono">
                <Gift className="text-zinc-900 mx-auto mb-2" size={24} />
                <h4 className="font-bold text-zinc-900 text-sm uppercase">ONLINE DIGITAL ENVELOPE</h4>
                <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">Direct transfer via dynamic QRIS or Virtual Account with instant ledger synchronization.</p>
                <button
                  onClick={() => {
                    setCheckoutUrl(null);
                    setShowGiftModal(true);
                  }}
                  className="mt-4 px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs uppercase transition shadow-md"
                >
                  SEND DIGITAL GIFT
                </button>
              </div>
            )}
          </section>

          {/* Dynamic Gift Dialog */}
          {showGiftModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
              <div className="bg-white border border-zinc-200 p-6 max-w-md w-full shadow-2xl text-left relative font-mono">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 text-lg font-bold"
                >
                  ×
                </button>
                <h3 className="text-sm font-bold uppercase border-b border-zinc-100 pb-3 text-zinc-900 mb-4 flex items-center gap-2">
                  <Gift size={16} />
                  SEND DIGITAL ENVELOPE
                </h3>

                {checkoutUrl ? (
                  <div className="space-y-4 py-4 text-center">
                    <CheckCircle className="text-zinc-900 mx-auto" size={40} />
                    <h4 className="font-bold text-zinc-900 text-sm uppercase">CHECKOUT GENERATED</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">Open the payment gateway simulator to verify standard transaction behavior.</p>
                    <a 
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white font-bold hover:bg-zinc-800 transition text-xs shadow-md"
                    >
                      OPEN SIMULATOR
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleGiftSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">YOUR NAME</label>
                      <input 
                        type="text" 
                        required 
                        value={giftSender}
                        onChange={(e) => setGiftSender(e.target.value)}
                        className="w-full border border-zinc-200 px-4 py-2 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">AMOUNT (IDR)</label>
                      <input 
                        type="number" 
                        required 
                        min={10000}
                        step={10000}
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        className="w-full border border-zinc-200 px-4 py-2 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">MESSAGE (OPTIONAL)</label>
                      <textarea 
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="WISHES..."
                        rows={3}
                        className="w-full border border-zinc-200 px-4 py-2 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                    {giftStatus === "error" && (
                      <p className="text-xs text-red-500 uppercase">TRANSACTION INITIATION ERROR.</p>
                    )}
                    <button
                      type="submit"
                      disabled={giftStatus === "submitting"}
                      className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase transition"
                    >
                      {giftStatus === "submitting" ? "PROVISING BILL..." : "INITIALIZE PAYMENT"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Section 9: Footer */}
          <footer className="w-full py-20 px-8 bg-zinc-950 text-zinc-500 text-center flex flex-col items-center font-mono">
            <Heart size={20} className="text-white fill-current mb-4" />
            <h4 className="text-lg font-bold uppercase text-white tracking-widest">{couple.groomNickname} + {couple.brideNickname}</h4>
            <p className="text-[9px] uppercase tracking-widest mt-2 max-w-xs">We value your warm support and sincere blessings for our marital journey.</p>
            <div className="mt-12 border-t border-zinc-900 pt-8 w-full max-w-md text-[9px]">
              {showWatermark && <p>POWERED BY SURATDIGITAL</p>}
              <p className="mt-1">© {new Date().getFullYear()} {couple.groomNickname} & {couple.brideNickname}</p>
            </div>
          </footer>

        </motion.div>
      )}
    </div>
  );
};
