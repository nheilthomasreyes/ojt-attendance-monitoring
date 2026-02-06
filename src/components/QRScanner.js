import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Upload, Camera, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QRScanner({ onScanSuccess }) {
  const [isCameraMode, setIsCameraMode] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef(null);
  const regionId = "reader";

  // Logic to start the camera
  const startCamera = async () => {
    setCameraError(false);
    const element = document.getElementById(regionId);
    if (!element) return;

    try {
      // 1. Create a fresh instance every time
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(regionId);
      }

      // 2. Ensure it's not already scanning
      if (scannerRef.current.isScanning) return;

      await scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0 
        },
        (text) => {
          onScanSuccess(text);
          // Auto-stop after success if desired: 
          // stopCamera();
        },
        () => {} // Frame-by-frame fail (ignore)
      );
    } catch (err) {
      console.error("Camera Start Error:", err);
      setCameraError(true);
    }
  };

  // Logic to stop the camera completely
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Stop Error:", err);
      } finally {
        // 3. Clear the DOM element manually to reset its state
        const element = document.getElementById(regionId);
        if (element) element.innerHTML = "";
        
        // 4. Wipe the scanner instance so we start fresh next time
        scannerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (isCameraMode) {
      // Give React 300ms to paint the #reader div before we hit the camera
      const timer = setTimeout(() => startCamera(), 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isCameraMode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // We create a temporary scanner just for the file
    const tempScanner = new Html5Qrcode("file-reader-hidden");
    try {
      const decodedText = await tempScanner.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      alert("No QR code detected in this image.");
    } finally {
      tempScanner.clear(); // Cleanup temp scanner
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {/* Selector */}
      <div className="flex bg-gray-900/90 p-1.5 rounded-2xl mb-6 border border-white/10 shadow-lg">
        <button
          onClick={() => setIsCameraMode(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            isCameraMode ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400'
          }`}
        >
          <Camera size={18} /> <span className="text-sm font-bold">Live</span>
        </button>
        <button
          onClick={() => setIsCameraMode(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            !isCameraMode ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400'
          }`}
        >
          <Upload size={18} /> <span className="text-sm font-bold">Upload</span>
        </button>
      </div>

      <div className="relative bg-black rounded-[2rem] overflow-hidden aspect-square border-2 border-white/10 shadow-2xl">
        <AnimatePresence mode="wait">
          {isCameraMode ? (
            <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <div id={regionId} className="w-full h-full"></div>
              
              {/* Overlay visuals */}
              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none border-[50px] border-black/50">
                  <div className="w-full h-full border-2 border-cyan-400/30 rounded-lg relative">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_cyan]"
                    />
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center p-6">
                   <p className="text-gray-400 mb-4 text-sm">Camera blocked or busy</p>
                   <button onClick={startCamera} className="bg-white/10 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                     <RefreshCcw size={14}/> Retry
                   </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-8">
              {/* Hidden div for file scanner to hook into */}
              <div id="file-reader-hidden" className="hidden"></div>
              
              <Upload className="size-12 text-cyan-500 mb-4" />
              <label className="bg-white text-black px-8 py-3 rounded-full font-bold cursor-pointer hover:bg-cyan-50 transition-colors">
                Select QR Image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
