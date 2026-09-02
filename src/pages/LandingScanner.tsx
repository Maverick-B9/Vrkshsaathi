import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function LandingScanner() {
  const navigate = useNavigate();

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const url = detectedCodes[0].rawValue;
      if (url && url.includes("/tree/")) {
        const treeId = url.split("/tree/")[1];
        navigate(`/tree/${treeId}`);
      } else if (url && url.startsWith("http")) {
        window.location.href = url;
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-between">
      {/* Real QR Scanner in the background */}
      <div className="absolute inset-0 z-0">
        <Scanner 
          onScan={handleScan}
          styles={{
            container: { height: "100%", width: "100%" },
            video: { objectFit: "cover" }
          }}
          components={{ tracker: false, audio: false, onOff: true, finder: false }}
        />
        {/* Fallback dark overlay just in case camera fails to load instantly */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 w-full p-6 flex flex-col items-center pt-12 pointer-events-none">
        <img src="/logo.jpg" alt="VrkshSaathi" className="w-16 h-16 object-contain rounded-full border-2 border-moss-canopy mb-2 shadow-lg" />
        <h1 className="font-display text-2xl text-white tracking-wide drop-shadow-md">VrkshSaathi</h1>
        <p className="font-sans text-sm text-slate-100 mt-2 text-center max-w-xs drop-shadow-md font-medium">
          Point your camera at a tree's QR code to view its life record.
        </p>
      </div>

      {/* Scanner Viewfinder Box */}
      <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center pointer-events-none p-6 gap-8">
        <div className="relative w-full max-w-sm aspect-square border-2 border-white/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(75,107,58,0.3)]">
          {/* Scanning Line Animation */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-moss-canopy shadow-[0_0_15px_rgba(75,107,58,0.8)] z-20"
            animate={{
              top: ["0%", "98%", "0%"]
            }}
            transition={{
              duration: 3,
              ease: "linear",
              repeat: Infinity
            }}
          />
          {/* Corner brackets for the scanner */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-moss-canopy rounded-tl-3xl z-10" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-moss-canopy rounded-tr-3xl z-10" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-moss-canopy rounded-bl-3xl z-10" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-moss-canopy rounded-br-3xl z-10" />
          
          {/* Clear cutout in the middle to let the camera show through brighter */}
          <div className="absolute inset-0 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
        </div>

        {/* Tagline */}
        <div className="flex items-center justify-center">
          <span className="bg-black/60 text-moss-canopy-light border border-moss-canopy/50 px-6 py-2 rounded-full font-display text-lg tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_0_20px_rgba(75,107,58,0.3)]">
            Scan to Save
          </span>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="relative z-10 w-full p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4">
        <p className="font-sans text-sm text-white/90 drop-shadow-md">Are you a Custodian or Admin?</p>
        <Link 
          to="/login"
          className="w-full max-w-sm bg-moss-canopy hover:bg-moss-canopy-dark text-white font-sans font-medium text-lg py-4 px-6 rounded-tag-inner flex items-center justify-center transition-colors shadow-lg"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
