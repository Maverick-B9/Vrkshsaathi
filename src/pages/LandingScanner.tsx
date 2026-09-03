import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";

// ─── Falling Leaf ─────────────────────────────────────────────────
interface Leaf {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  emoji: string;
}

const LEAF_EMOJIS = ["🍃", "🍂", "🌿", "🍁", "🌱"];

function useLeaves(count = 14) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  useEffect(() => {
    setLeaves(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 16 + Math.random() * 20,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 10,
        rotation: Math.random() * 360,
        emoji: LEAF_EMOJIS[Math.floor(Math.random() * LEAF_EMOJIS.length)],
      }))
    );
  }, [count]);
  return leaves;
}

// ─── Core jsQR scanner hook ───────────────────────────────────────
function useJsQrScanner(onDetected: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(true);
  // Stable ref so the tick loop never needs to re-mount when parent re-renders
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;

  useEffect(() => {
    activeRef.current = true;

    function tick() {
      if (!activeRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) { rafRef.current = requestAnimationFrame(tick); return; }
      if (video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // "attemptBoth" handles both light-on-dark and dark-on-light QR codes
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code?.data) {
        callbackRef.current(code.data);
        return; // stop the loop — navigation will unmount this component
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video || !activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        video.play()
          .then(() => { rafRef.current = requestAnimationFrame(tick); })
          .catch(console.error);
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
      });

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // ← empty deps: runs once only, no camera restarts

  return { videoRef, canvasRef };
}


// ─── Main Component ───────────────────────────────────────────────
export default function LandingScanner() {
  const navigate = useNavigate();
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leaves = useLeaves(14);

  const routeQR = useCallback(
    (raw: string) => {
      if (!raw) return false;
      if (raw.includes("/tree/")) {
        const treeId = raw.split("/tree/")[1];
        navigate(`/tree/${treeId}`);
        return true;
      }
      if (raw.startsWith("http")) {
        window.location.href = raw;
        return true;
      }
      return false;
    },
    [navigate]
  );

  const handleDetected = useCallback(
    (raw: string) => {
      if (hasScanned) return;
      setHasScanned(true);
      const ok = routeQR(raw);
      if (!ok) {
        setScanError(true);
        setTimeout(() => {
          setHasScanned(false);
          setScanError(false);
        }, 2500);
      }
    },
    [hasScanned, routeQR]
  );

  const { videoRef, canvasRef } = useJsQrScanner(handleDetected);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleDetected(code.data);
          } else {
            alert("No QR code found in this image. Please try another photo.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden flex flex-col items-center justify-between bg-[#f4f8f0]">

      {/* ── Hidden canvas used by jsQR for frame analysis ─────────── */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Camera Video Background ──────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ opacity: 0.4, filter: "saturate(0.55)" }}
        />
        {/* Parchment wash */}
        <div className="absolute inset-0 bg-[#f4f8f0]/60 pointer-events-none" />
      </div>

      {/* ── Falling Leaves ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {leaves.map((leaf) => (
          <motion.span
            key={leaf.id}
            className="absolute select-none"
            style={{
              left: `${leaf.x}%`,
              top: "-60px",
              fontSize: leaf.size,
            }}
            animate={{
              y: ["0vh", "110vh"],
              rotate: [leaf.rotation, leaf.rotation + 360],
              x: [0, Math.sin(leaf.id) * 60],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: leaf.duration,
              delay: leaf.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {leaf.emoji}
          </motion.span>
        ))}
      </div>

      {/* ── Top Header ───────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-full flex flex-col items-center pt-16 pb-4 px-6 pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full border-4 border-moss-canopy bg-white shadow-[0_6px_30px_rgba(75,107,58,0.3)] overflow-hidden mb-5"
        >
          <img src="/logo.jpg" alt="VrkshSaathi" className="w-full h-full object-cover" />
        </motion.div>

        <h1 className="font-display text-4xl text-moss-canopy tracking-widest uppercase drop-shadow-sm">
          VrkshSaathi
        </h1>

        <p className="font-sans text-sm text-slate-bark mt-2 text-center max-w-[280px] leading-relaxed">
          Align the QR tag within the frame to view a tree's life record.
        </p>
      </motion.div>

      {/* ── Scanner Viewfinder ───────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="relative z-20 flex flex-col items-center gap-6 px-6 mb-auto mt-auto pointer-events-none"
      >
        {/* Frame */}
        <div className="relative w-[270px] aspect-square">
          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-[3px] bg-moss-canopy shadow-[0_0_14px_rgba(75,107,58,0.9)] z-20"
            animate={{ top: ["2%", "97%", "2%"] }}
            transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
          />

          {/* Corner brackets */}
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-[28px]",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-[28px]",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[28px]",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-[28px]",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-14 h-14 border-moss-canopy ${cls} z-10`} />
          ))}

          {/* Glass inner */}
          <div className="absolute inset-0 rounded-[28px] overflow-hidden bg-white/10 backdrop-blur-[1px] ring-1 ring-moss-canopy/20" />
        </div>

        {/* Tagline pill */}
        <AnimatePresence mode="wait">
          {!hasScanned ? (
            <motion.div
              key="tagline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl opacity-80">🌿</span>
              <span className="bg-moss-canopy text-white font-display text-lg tracking-[0.22em] uppercase px-7 py-2.5 rounded-full shadow-[0_6px_24px_rgba(75,107,58,0.35)]">
                Scan to Save
              </span>
              <span className="text-2xl opacity-80">🌿</span>
            </motion.div>
          ) : scanError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500 text-white font-sans text-sm font-semibold px-7 py-2.5 rounded-full shadow-lg"
            >
              ✗ Invalid QR — try again
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-white border-2 border-moss-canopy text-moss-canopy font-sans text-sm font-bold px-7 py-2.5 rounded-full shadow-lg"
            >
              <div className="w-2 h-2 bg-moss-canopy rounded-full animate-ping" />
              Processing…
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Bottom Action Area ───────────────────────────────────── */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="relative z-20 w-full px-8 pb-10 pt-6 bg-gradient-to-t from-[#f4f8f0]/95 via-[#f4f8f0]/80 to-transparent flex flex-col items-center gap-4"
      >
        {/* Gallery upload */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-xs bg-white border border-moss-canopy/40 hover:bg-moss-canopy/5 text-moss-canopy font-sans font-medium text-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          Upload from Gallery
        </button>

        <div className="w-full max-w-xs flex items-center gap-3">
          <div className="flex-1 h-px bg-moss-canopy/20" />
          <p className="font-sans text-xs text-slate-bark whitespace-nowrap">Are you a Custodian or Admin?</p>
          <div className="flex-1 h-px bg-moss-canopy/20" />
        </div>

        <Link
          to="/login"
          className="w-full max-w-xs bg-moss-canopy hover:bg-moss-canopy-dark text-white font-sans font-bold text-base py-4 px-6 rounded-[20px] flex items-center justify-center transition-all shadow-[0_6px_24px_rgba(75,107,58,0.35)] active:scale-95"
        >
          Sign In
        </Link>
      </motion.div>
    </div>
  );
}
