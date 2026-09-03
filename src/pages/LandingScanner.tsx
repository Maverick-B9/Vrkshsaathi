import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

// ─── Falling Leaf ─────────────────────────────────────────────────
interface Leaf {
  id: number; x: number; size: number;
  duration: number; delay: number; rotation: number; emoji: string;
}
const LEAF_EMOJIS = ["🍃", "🍂", "🌿", "🍁", "🌱"];
function useLeaves(count = 14) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  useEffect(() => {
    setLeaves(Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100,
      size: 16 + Math.random() * 20,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
      emoji: LEAF_EMOJIS[Math.floor(Math.random() * LEAF_EMOJIS.length)],
    })));
  }, [count]);
  return leaves;
}

// ─── Main Component ───────────────────────────────────────────────
export default function LandingScanner() {
  const navigate = useNavigate();
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leaves = useLeaves(14);
  const detectedRef = useRef(false); // prevent double-fire

  // ── Route QR payload ───────────────────────────────────────────
  const routeQR = (raw: string): boolean => {
    if (!raw) return false;
    try {
      const url = new URL(raw);
      // Internal VrkshSaathi tree link
      if (url.pathname.includes("/tree/")) {
        const treeId = url.pathname.split("/tree/")[1]?.split("?")[0];
        if (treeId) { navigate(`/tree/${treeId}`); return true; }
      }
      // Any other valid URL
      window.location.href = raw;
      return true;
    } catch {
      // Not a URL — check for bare /tree/ path
      if (raw.includes("/tree/")) {
        const treeId = raw.split("/tree/")[1]?.split("?")[0];
        if (treeId) { navigate(`/tree/${treeId}`); return true; }
      }
      return false;
    }
  };

  const handleDetected = (raw: string) => {
    if (detectedRef.current) return;
    detectedRef.current = true;
    setHasScanned(true);

    // Stop the scanner immediately
    scannerRef.current?.stop().catch(() => {});

    const ok = routeQR(raw);
    if (!ok) {
      setScanError(true);
      setTimeout(() => {
        setHasScanned(false);
        setScanError(false);
        detectedRef.current = false;
        // Restart camera
        startCamera();
      }, 2500);
    }
  };

  // ── Start html5-qrcode camera ──────────────────────────────────
  const startCamera = () => {
    const qr = scannerRef.current;
    if (!qr) return;
    qr.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      },
      (decodedText) => handleDetected(decodedText),
      () => {} // ignore per-frame errors
    )
      .then(() => setCameraReady(true))
      .catch((err) => {
        console.error("Camera start failed:", err);
        setCameraReady(false);
      });
  };

  useEffect(() => {
    // Give the DOM element a moment to mount
    const timer = setTimeout(() => {
      const qr = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = qr;
      startCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      scannerRef.current?.stop()
        .catch(() => {})
        .finally(() => scannerRef.current?.clear());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Gallery upload ─────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploading(true);
    try {
      // Stop live camera while scanning file
      await scannerRef.current?.stop().catch(() => {});

      const qr = new Html5Qrcode("qr-reader-file", { verbose: false });
      const result = await qr.scanFile(file, /* showImage */ false);
      await qr.clear();
      handleDetected(result);
    } catch {
      // Restart camera after failed file scan
      startCamera();
      alert("No QR code found in this image. Try a clearer photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden flex flex-col items-center justify-between bg-[#f4f8f0]">

      {/* ── html5-qrcode mounts here — we style it to be the background ── */}
      <div
        id="qr-reader"
        className="absolute inset-0 z-0 overflow-hidden"
        style={{
          // Override html5-qrcode's default styles
          border: "none",
        }}
      />
      {/* Hidden div for file scanning (html5-qrcode needs a DOM target) */}
      <div id="qr-reader-file" className="hidden" />

      {/* Parchment + desaturation wash over the camera feed */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: "rgba(244,248,240,0.60)", backdropFilter: "saturate(0.55)" }}
      />

      {/* ── Falling Leaves ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
        {leaves.map((leaf) => (
          <motion.span
            key={leaf.id}
            className="absolute select-none"
            style={{ left: `${leaf.x}%`, top: "-60px", fontSize: leaf.size }}
            animate={{
              y: ["0vh", "110vh"],
              rotate: [leaf.rotation, leaf.rotation + 360],
              x: [0, Math.sin(leaf.id) * 60],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: leaf.duration, delay: leaf.delay, repeat: Infinity, ease: "linear" }}
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
        className="relative z-[3] w-full flex flex-col items-center pt-14 pb-4 px-6 pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full border-4 border-moss-canopy bg-white shadow-[0_6px_30px_rgba(75,107,58,0.3)] overflow-hidden mb-4"
        >
          <img src="/logo.jpg" alt="VrkshSaathi" className="w-full h-full object-cover" />
        </motion.div>
        <h1 className="font-display text-4xl text-moss-canopy tracking-widest uppercase drop-shadow-sm">
          VrkshSaathi
        </h1>
        <p className="font-sans text-sm text-slate-bark mt-1 text-center max-w-[280px] leading-relaxed">
          {cameraReady
            ? "Align the QR tag within the frame to view a tree's life record."
            : "Starting camera…"}
        </p>
      </motion.div>

      {/* ── Decorative Viewfinder Overlay ────────────────────────── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="relative z-[3] flex flex-col items-center gap-5 px-6 mb-auto mt-auto pointer-events-none"
      >
        {/* Corner brackets — purely decorative, html5-qrcode's viewfinder does actual scanning */}
        <div className="relative w-[270px] aspect-square">
          <motion.div
            className="absolute left-[4px] right-[4px] h-[3px] bg-moss-canopy shadow-[0_0_14px_rgba(75,107,58,0.9)] z-20"
            animate={{ top: ["4%", "96%", "4%"] }}
            transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
          />
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-[28px]",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-[28px]",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[28px]",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-[28px]",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-14 h-14 border-moss-canopy ${cls} z-10`} />
          ))}
          <div className="absolute inset-0 rounded-[28px] bg-white/5 ring-1 ring-moss-canopy/20" />
        </div>

        {/* Status pill */}
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

      {/* ── Bottom Actions ───────────────────────────────────────── */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="relative z-[3] w-full px-8 pb-10 pt-6 bg-gradient-to-t from-[#f4f8f0]/95 via-[#f4f8f0]/80 to-transparent flex flex-col items-center gap-4"
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-xs bg-white border border-moss-canopy/40 hover:bg-moss-canopy/5 text-moss-canopy font-sans font-medium text-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          {uploading ? (
            <><div className="w-4 h-4 border-2 border-moss-canopy border-t-transparent rounded-full animate-spin" />Scanning image…</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>Upload from Gallery</>
          )}
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
