import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useRef } from "react";
import jsQR from "jsqr";

export default function LandingScanner() {
  const navigate = useNavigate();
  const [hasScanned, setHasScanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0 && !hasScanned) {
      setHasScanned(true);
      const url = detectedCodes[0].rawValue;
      if (url && url.includes("/tree/")) {
        const treeId = url.split("/tree/")[1];
        navigate(`/tree/${treeId}`);
      } else if (url && url.startsWith("http")) {
        window.location.href = url;
      } else {
        // Reset if it's an invalid scan after a delay
        setTimeout(() => setHasScanned(false), 2000);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0, img.width, img.height);
          const imageData = context.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScan([{ rawValue: code.data }]);
          } else {
            alert("No QR code found in the image. Please try another one.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between">
      {/* Real QR Scanner in the background */}
      <div className="absolute inset-0 z-0 bg-black">
        <Scanner 
          onScan={handleScan}
          styles={{
            container: { height: "100%", width: "100%" },
            video: { objectFit: "cover" }
          }}
        />
        {/* Fallback dark overlay to make text readable */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      {/* Top Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full p-6 flex flex-col items-center pt-16 pointer-events-none"
      >
        <motion.img 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          src="/logo.jpg" 
          alt="VrkshSaathi" 
          className="w-20 h-20 object-contain rounded-full border-2 border-moss-canopy mb-4 shadow-[0_0_25px_rgba(75,107,58,0.6)]" 
        />
        <h1 className="font-display text-4xl text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase">VrkshSaathi</h1>
        <p className="font-sans text-sm text-slate-100/90 mt-3 text-center max-w-[280px] drop-shadow-md font-medium">
          Align the QR code within the frame to view a tree's life record.
        </p>
      </motion.div>

      {/* Scanner Viewfinder Box */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 w-full flex flex-col items-center justify-center pointer-events-none p-6 gap-8 mb-auto mt-auto"
      >
        <div className="relative w-full max-w-[280px] aspect-square rounded-[40px] overflow-hidden shadow-[0_0_60px_rgba(75,107,58,0.25)] ring-1 ring-white/10 backdrop-blur-[2px]">
          {/* Scanning Line Animation */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-moss-canopy-light shadow-[0_0_20px_rgba(152,191,100,1),0_0_40px_rgba(152,191,100,0.8)] z-20"
            animate={{
              top: ["0%", "98%", "0%"]
            }}
            transition={{
              duration: 2.5,
              ease: "linear",
              repeat: Infinity
            }}
          />
          
          {/* Beautiful Corner brackets */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-moss-canopy rounded-tl-[40px] z-10 opacity-80" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-moss-canopy rounded-tr-[40px] z-10 opacity-80" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-moss-canopy rounded-bl-[40px] z-10 opacity-80" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-moss-canopy rounded-br-[40px] z-10 opacity-80" />
          
          {/* Darkened outside, clear inside */}
          <div className="absolute inset-0 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Tagline */}
        <AnimatePresence>
          {!hasScanned ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center"
            >
              <span className="bg-moss-canopy/90 text-white border border-moss-canopy-light/40 px-8 py-3 rounded-full font-display text-xl tracking-[0.25em] uppercase shadow-[0_8px_32px_rgba(75,107,58,0.4)] backdrop-blur-md">
                Scan to Save
              </span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center"
            >
              <span className="bg-white text-moss-canopy font-bold px-8 py-3 rounded-full font-sans text-sm uppercase shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-moss-canopy rounded-full animate-ping" />
                Processing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Action Area */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 w-full p-8 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-5 pointer-events-auto"
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mb-4">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-sans font-medium text-sm py-3 px-6 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            Upload from Gallery
          </button>
        </div>

        <p className="font-sans text-sm text-white/80 drop-shadow-md">Are you a Custodian or Admin?</p>
        <Link 
          to="/login"
          className="w-full max-w-xs bg-white hover:bg-slate-100 text-ink-bark font-sans font-bold text-lg py-4 px-6 rounded-[24px] flex items-center justify-center transition-all shadow-[0_8px_30px_rgba(255,255,255,0.15)] active:scale-95"
        >
          Sign In
        </Link>
      </motion.div>
    </div>
  );
}
