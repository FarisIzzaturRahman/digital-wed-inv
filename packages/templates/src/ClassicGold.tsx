import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Calendar, MapPin, Gift, Clock, Copy, Music, VolumeX, Volume2, Send, CheckCircle, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateProps, WishData } from "./types";
import { normalizeMapsEmbedUrl } from "shared";
import { ShareStoryModal, InstagramIcon } from "./ShareStoryModal";

export const ClassicGold: React.FC<TemplateProps> = ({
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
    "--primary": theme.colorPrimary,
    "--accent": theme.colorAccent,
    "--bg": theme.colorBg,
    "--text": theme.colorText,
    "--radius": theme.radius,
    fontFamily: theme.fontBody,
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
      // Find a physical bank gift if there is one or just use the first dynamic checkout
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

  // Get religious quotes based on configuration
  const getQuote = () => {
    const rel = invitation.religion.toLowerCase();
    const loc = invitation.locale.toLowerCase();
    
    if (rel === "islam") {
      if (loc === "en") {
        return {
          verse: "And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy. Indeed in that are signs for a people who give thought.",
          source: "QS. Ar-Rum: 21"
        };
      }
      return {
        verse: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berpikir.",
        source: "QS. Ar-Rum: 21"
      };
    } else if (rel === "kristen" || rel === "katolik") {
      return {
        verse: "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
        source: "Matius 19: 6"
      };
    } else if (rel === "hindu") {
      return {
        verse: "Ihaiva stam ma vi yaustam, visvam ayur vyasnuta, kridantau putrair naptrbhih, modamanau sve grhe.",
        source: "Rig Veda X.85.42"
      };
    } else if (rel === "buddha") {
      return {
        verse: "Bila dua orang memiliki keyakinan, kemurahan hati, dan pengendalian diri yang sama, mereka akan dapat hidup rukun satu sama lain.",
        source: "Samajivina Sutta"
      };
    }
    // Umum / default
    return {
      verse: "Cinta tidak terdiri dari saling memandang, tetapi sama-sama melihat ke satu arah yang sama.",
      source: "Antoine de Saint-Exupéry"
    };
  };

  const quote = getQuote();

  return (
    <div style={styleVariables} className="min-h-screen relative w-full text-slate-800 bg-[#fffdf9] overflow-x-hidden">
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
          className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white hover:opacity-95 transition duration-300 flex items-center gap-2 text-xs font-bold border border-white/20"
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
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg bg-yellow-600 text-white hover:bg-yellow-700 transition duration-300 flex items-center justify-center animate-bounce"
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
            exit={{ opacity: 0, y: "-100vh" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 text-center text-white bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url(${invitation.coverImageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"})` 
            }}
          >
            <div className="mt-12">
              <span className="tracking-widest uppercase text-yellow-400 font-semibold text-sm">Walimatul 'Urs</span>
              <h1 className="text-4xl md:text-6xl font-serif mt-4 font-bold tracking-wide">
                {couple.groomNickname} & {couple.brideNickname}
              </h1>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-sm p-6 rounded-xl border border-yellow-500/30 max-w-md w-full">
              <p className="text-xs uppercase tracking-wider text-slate-300">Kepada Yth. Bapak/Ibu/Saudara/i</p>
              <h2 className="text-2xl font-bold mt-2 font-serif text-yellow-300">{guestName}</h2>
              <p className="text-xs mt-3 text-slate-300 italic">Kami Mengundang Anda untuk Merayakan Kebersamaan Kami</p>
              <button 
                onClick={handleOpen}
                className="mt-6 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition duration-300 flex items-center justify-center gap-2 mx-auto shadow-md"
              >
                <Heart size={18} className="fill-current" />
                Buka Undangan
              </button>
            </div>

            <div className="mb-8">
              <p className="text-sm text-yellow-400 font-semibold">
                {events[0] ? new Date(events[0].startAt).toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full flex flex-col items-center"
        >
          {/* Section 1: Hero Header */}
          <section className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 text-center bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(255, 253, 249, 0.8), rgba(255, 253, 249, 0.95)), url(${invitation.coverImageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"})`
            }}
          >
            <div className="max-w-2xl flex flex-col items-center">
              <span className="text-yellow-600 uppercase tracking-widest text-sm font-semibold">The Wedding of</span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-yellow-800 my-6">
                {couple.groomNickname} & {couple.brideNickname}
              </h1>
              <p className="text-slate-600 max-w-lg italic">
                "{quote.verse}"
              </p>
              <span className="text-xs text-yellow-600 font-semibold mt-2 block">— {quote.source}</span>
            </div>
          </section>

          {/* Section 2: Mempelai / Profile */}
          <section className="py-20 px-6 max-w-5xl w-full text-center">
            <h2 className="text-3xl md:text-5xl font-serif text-yellow-800 font-bold mb-4">Mempelai</h2>
            <p className="text-slate-500 mb-12">Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.</p>

            <div className={`flex flex-col ${couple.orderDisplay === "groom_first" ? "md:flex-row" : "md:flex-row-reverse"} justify-center items-center gap-16`}>
              
              {/* Groom */}
              <div className="flex flex-col items-center max-w-sm">
                <div className="w-56 h-56 rounded-full border-4 border-yellow-500 p-2 overflow-hidden bg-slate-100 shadow-lg">
                  <img 
                    src={couple.groomPhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    alt="Groom Photo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-2xl font-serif text-yellow-800 font-bold mt-6">{couple.groomFullName}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-2">{couple.groomChildOrder}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Putra dari {couple.groomFather} <br /> & {couple.groomMother}
                </p>
                {couple.groomInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.groomInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-4 flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 transition"
                  >
                    <span>@{couple.groomInstagram}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="text-yellow-600 font-serif text-4xl">&</div>

              {/* Bride */}
              <div className="flex flex-col items-center max-w-sm">
                <div className="w-56 h-56 rounded-full border-4 border-yellow-500 p-2 overflow-hidden bg-slate-100 shadow-lg">
                  <img 
                    src={couple.bridePhotoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"} 
                    alt="Bride Photo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-2xl font-serif text-yellow-800 font-bold mt-6">{couple.brideFullName}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-2">{couple.brideChildOrder}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Putri dari {couple.brideFather} <br /> & {couple.brideMother}
                </p>
                {couple.brideInstagram && (
                  <a 
                    href={`https://instagram.com/${couple.brideInstagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-4 flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 transition"
                  >
                    <span>@{couple.brideInstagram}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

            </div>
          </section>

          {/* Section 3: Acara & Countdown */}
          <section className="py-20 px-6 w-full bg-[#fbf9f4] flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-serif text-yellow-800 font-bold text-center mb-12">Agenda Acara</h2>
            
            {/* Countdown timer */}
            <div className="flex gap-4 mb-12 bg-white px-6 py-4 rounded-xl shadow-sm border border-yellow-500/20 max-w-md w-full justify-around text-center">
              <div>
                <span className="text-3xl font-serif text-yellow-600 font-bold">{timeLeft.days}</span>
                <p className="text-xs uppercase text-slate-500">Hari</p>
              </div>
              <div className="text-yellow-400 text-3xl font-serif">:</div>
              <div>
                <span className="text-3xl font-serif text-yellow-600 font-bold">{timeLeft.hours}</span>
                <p className="text-xs uppercase text-slate-500">Jam</p>
              </div>
              <div className="text-yellow-400 text-3xl font-serif">:</div>
              <div>
                <span className="text-3xl font-serif text-yellow-600 font-bold">{timeLeft.minutes}</span>
                <p className="text-xs uppercase text-slate-500">Menit</p>
              </div>
              <div className="text-yellow-400 text-3xl font-serif">:</div>
              <div>
                <span className="text-3xl font-serif text-yellow-600 font-bold">{timeLeft.seconds}</span>
                <p className="text-xs uppercase text-slate-500">Detik</p>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
              {events.map((evt) => {
                const dateStart = new Date(evt.startAt);
                const dateEnd = new Date(evt.endAt);
                const formattedDate = dateStart.toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const formattedTime = `${dateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${dateEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${invitation.locale === "id" ? "WIB" : ""}`;
                
                return (
                  <div key={evt.id} className="bg-white p-8 rounded-2xl shadow-sm border border-yellow-500/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-yellow-500/10 pb-4">
                        <h3 className="text-2xl font-serif text-yellow-800 font-bold capitalize">{evt.title}</h3>
                        <Heart className="text-yellow-600 fill-current" size={18} />
                      </div>
                      <div className="space-y-3 text-slate-600 text-sm">
                        <div className="flex items-start gap-3">
                          <Calendar className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="font-semibold text-slate-800">{formattedDate}</p>
                            <p className="text-xs text-slate-500">{formattedTime}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="font-semibold text-slate-800">{evt.venueName}</p>
                            <p className="text-xs text-slate-500">{evt.venueAddress}</p>
                          </div>
                        </div>
                        {evt.dressCode && (
                          <div className="text-xs bg-yellow-500/5 text-yellow-800 border border-yellow-500/10 p-2.5 rounded-lg">
                            <span className="font-semibold">Dress Code:</span> {evt.dressCode}
                          </div>
                        )}
                        {evt.note && (
                          <p className="text-xs italic text-slate-400">Catatan: {evt.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-2">
                      {evt.mapsUrl && (
                        <a 
                          href={evt.mapsUrl}
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full text-center py-2.5 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                          <MapPin size={16} />
                          Buka Google Maps
                        </a>
                      )}
                      
                      {normalizeMapsEmbedUrl(evt.mapsEmbed) && (
                        <iframe
                          src={normalizeMapsEmbedUrl(evt.mapsEmbed)!}
                          title={`Peta ${evt.venueName}`}
                          className="mt-4 w-full min-h-72 rounded-xl border border-slate-200"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                          allowFullScreen
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: Love Story */}
          {stories.length > 0 && (
            <section className="py-20 px-6 max-w-3xl w-full text-center">
              <h2 className="text-3xl md:text-5xl font-serif text-yellow-800 font-bold mb-12">Perjalanan Cinta</h2>
              <div className="relative border-l-2 border-yellow-200 text-left pl-6 ml-4 space-y-12">
                {stories.map((story) => (
                  <div key={story.id} className="relative">
                    <span className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-yellow-600 border-4 border-white shadow-sm" />
                    <span className="text-xs uppercase tracking-widest text-yellow-600 font-bold bg-yellow-50 px-2.5 py-1 rounded border border-yellow-200">{story.date}</span>
                    <h3 className="text-xl font-serif font-bold text-yellow-800 mt-3">{story.title}</h3>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">{story.body}</p>
                    {story.imageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden max-h-48 max-w-sm">
                        <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Galeri */}
          {gallery.length > 0 && (
            <section className="py-20 px-6 w-full bg-[#fbf9f4] flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-serif text-yellow-800 font-bold text-center mb-12">Galeri Foto</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl w-full">
                {gallery.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveImage(item.url)}
                    className="cursor-pointer overflow-hidden rounded-xl bg-slate-100 shadow-sm aspect-square relative group"
                  >
                    <img 
                      src={item.url} 
                      alt="Gallery Item" 
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <ImageIcon className="text-white" size={24} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Lightbox Modal */}
              {activeImage && (
                <div 
                  className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => setActiveImage(null)}
                >
                  <div className="max-w-4xl max-h-full">
                    <img src={activeImage} alt="Large View" className="max-h-[90vh] max-w-full object-contain rounded" />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Section 6: RSVP */}
          <section className="py-20 px-6 max-w-xl w-full">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-yellow-500/10 text-center">
              <h2 className="text-3xl font-serif text-yellow-800 font-bold mb-2">Konfirmasi Kehadiran</h2>
              <p className="text-xs text-slate-400 mb-6">Harap isi form kehadiran di bawah ini untuk membantu kami mempersiapkan acara.</p>

              {rsvpStatus === "success" ? (
                <div className="py-8 text-center flex flex-col items-center gap-3">
                  <CheckCircle size={48} className="text-green-500" />
                  <h3 className="text-xl font-bold text-slate-800">Terima Kasih!</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Konfirmasi kehadiran Anda telah berhasil disimpan di database kami.</p>
                </div>
              ) : (
                <form onSubmit={handleRsvp} className="text-left space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required 
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="Nama Tamu"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kehadiran</label>
                    <select
                      value={rsvpAttendance}
                      onChange={(e) => setRsvpAttendance(e.target.value as any)}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-600"
                    >
                      <option value="yes">Hadir</option>
                      <option value="maybe">Masih Ragu</option>
                      <option value="no">Tidak Dapat Hadir</option>
                    </select>
                  </div>
                  {rsvpAttendance !== "no" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Tamu</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        required 
                        value={rsvpHeadcount}
                        onChange={(e) => setRsvpHeadcount(parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pesan / Doa Restu</label>
                    <textarea 
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      placeholder="Tuliskan ucapan selamat..."
                      rows={4}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                    />
                  </div>
                  {rsvpStatus === "error" && (
                    <p className="text-xs text-red-500">Terjadi kesalahan. Silakan coba lagi nanti.</p>
                  )}
                  <button
                    type="submit"
                    disabled={rsvpStatus === "submitting"}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition duration-200 shadow-sm text-sm"
                  >
                    {rsvpStatus === "submitting" ? "Mengirim..." : "Kirim Konfirmasi"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Section 7: Wishes / Guestbook */}
          <section className="py-20 px-6 max-w-2xl w-full bg-[#fbf9f4] rounded-t-3xl text-center">
            <h2 className="text-3xl font-serif text-yellow-800 font-bold mb-2">Buku Tamu</h2>
            <p className="text-xs text-slate-400 mb-8">Kirim doa dan harapan terbaik Anda untuk mempelai.</p>

            <form onSubmit={handleWish} className="text-left bg-white p-6 rounded-xl border border-yellow-500/10 mb-8 space-y-4">
              <div>
                <input 
                  type="text" 
                  required 
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                />
              </div>
              <div>
                <textarea 
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Tulis ucapan dan doa terbaik..."
                  rows={3}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                />
              </div>
              <button
                type="submit"
                disabled={wishStatus === "submitting"}
                className="py-2 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition text-sm flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Kirim Ucapan
              </button>
            </form>

            <div className="space-y-4 text-left max-h-96 overflow-y-auto pr-2">
              {localWishes.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-800 text-sm">{w.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(w.createdAt).toLocaleDateString(invitation.locale === "id" ? "id-ID" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">{w.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8: Wedding Gift / Kado */}
          <section className="py-20 px-6 max-w-xl w-full text-center">
            <h2 className="text-3xl font-serif text-yellow-800 font-bold mb-2">Tanda Kasih</h2>
            <p className="text-xs text-slate-400 mb-8">Bagi Anda yang ingin memberikan hadiah secara non-tunai, silakan transfer melalui pilihan berikut:</p>

            <div className="space-y-4">
              {gifts.map((gift, idx) => (
                <div key={gift.id} className="bg-white p-6 rounded-2xl border border-yellow-500/10 shadow-sm text-left flex flex-col justify-between md:flex-row md:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">{gift.label}</span>
                    <h4 className="text-lg font-bold text-slate-800 mt-2 font-serif">{gift.accountName}</h4>
                    <p className="text-sm font-mono text-slate-600 mt-1">{gift.accountNumber}</p>
                    {gift.addressText && (
                      <p className="text-xs text-slate-500 mt-2">{gift.addressText}</p>
                    )}
                  </div>
                  
                  {gift.type !== "physical_address" && (
                    <button
                      onClick={() => copyToClipboard(gift.accountNumber, idx)}
                      className="px-4 py-2 border border-yellow-600 text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 transition text-xs flex items-center justify-center gap-2 self-start md:self-center shrink-0"
                    >
                      <Copy size={14} />
                      {copiedIndex === idx ? "Berhasil disalin" : "Salin Rekening"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Dynamic Checkout Simulator Button */}
            {!isDemo && (
              <div className="mt-8 bg-yellow-50 p-6 rounded-2xl border border-yellow-500/20 max-w-md mx-auto">
                <Gift className="text-yellow-600 mx-auto mb-2" size={28} />
                <h4 className="font-serif font-bold text-yellow-800 text-lg">Kirim Amplop Digital (Online)</h4>
                <p className="text-xs text-slate-500 mt-1">Anda bisa mengirimkan amplop digital langsung via QRIS/Transfer VA. Pembayaran otomatis tercatat.</p>
                <button
                  onClick={() => {
                    setCheckoutUrl(null);
                    setShowGiftModal(true);
                  }}
                  className="mt-4 px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition text-xs shadow-md"
                >
                  Kirim Online Sekarang
                </button>
              </div>
            )}
          </section>

          {/* Dynamic Payout Dialog */}
          {showGiftModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl text-left relative">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ×
                </button>
                <h3 className="text-xl font-bold font-serif text-yellow-800 mb-4 flex items-center gap-2">
                  <Gift size={20} />
                  Kirim Amplop Digital
                </h3>

                {checkoutUrl ? (
                  <div className="space-y-4 py-4 text-center">
                    <CheckCircle className="text-green-500 mx-auto" size={48} />
                    <h4 className="font-bold text-slate-800 text-lg">Checkout Link Terbuat!</h4>
                    <p className="text-xs text-slate-500">Silakan buka halaman checkout simulator untuk melakukan pembayaran (QRIS/VA).</p>
                    <a 
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 transition text-sm shadow-md"
                    >
                      Buka Simulator Pembayaran
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleGiftSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pengirim</label>
                      <input 
                        type="text" 
                        required 
                        value={giftSender}
                        onChange={(e) => setGiftSender(e.target.value)}
                        className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rupiah)</label>
                      <input 
                        type="number" 
                        required 
                        min={10000}
                        step={10000}
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pesan Tambahan (Opsional)</label>
                      <textarea 
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Tulis ucapan singkat..."
                        rows={3}
                        className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                      />
                    </div>
                    {giftStatus === "error" && (
                      <p className="text-xs text-red-500">Terjadi kesalahan membuat pembayaran. Pastikan data benar.</p>
                    )}
                    <button
                      type="submit"
                      disabled={giftStatus === "submitting"}
                      className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition text-xs shadow-md"
                    >
                      {giftStatus === "submitting" ? "Menyiapkan Pembayaran..." : "Buat Transaksi"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Section 9: Penutup & Credit */}
          <footer className="w-full py-16 px-6 bg-slate-900 text-slate-400 text-center flex flex-col items-center">
            <Heart size={28} className="text-yellow-500 fill-current mb-4" />
            <h4 className="text-2xl font-serif text-white font-bold">Terima Kasih</h4>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">Merupakan kehormatan bagi kami sekalian apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan restu.</p>
            <div className="mt-8 border-t border-slate-800 pt-8 w-full max-w-md">
              {showWatermark && (
                <p className="text-xs">Dibuat dengan SuratDigital</p>
              )}
              <p className="text-[10px] text-slate-600 mt-1">© {new Date().getFullYear()} {couple.groomNickname} & {couple.brideNickname}</p>
            </div>
          </footer>

        </motion.div>
      )}
    </div>
  );
};
