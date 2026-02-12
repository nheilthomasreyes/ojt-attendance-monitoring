import { useEffect, useState, useCallback, useRef } from 'react';
import { Wifi, WifiOff, Signal, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function NetworkDetector({ officeSSID, onNetworkDetected }) {
  const [isConnected, setIsConnected] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  
  const lastStatus = useRef(false);

  // 1. Define updateStatus FIRST (so other functions can reference it)
  const updateStatus = useCallback((status, name) => {
    if (lastStatus.current !== status) {
      lastStatus.current = status;
      setIsConnected(status);
      onNetworkDetected(status, name);
    }
  }, [onNetworkDetected]);

  // 2. Define getLocalIP SECOND
  const getLocalIP = useCallback(() => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ 
        iceServers: [],
        iceCandidatePoolSize: 10 
      });
      
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (!ice?.candidate?.candidate) {
          pc.close();
          resolve(null);
          return;
        }

        const match = ice.candidate.candidate.match(
          /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        );

        if (match?.[1]) {
          pc.close();
          resolve(match[1]);
        } 
        else if (ice.candidate.candidate.includes(".local")) {
           pc.close();
           resolve("mDNS/Local");
        }
      };

      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 4000);
    });
  }, []);

  // 3. Define detectNetwork THIRD (references updateStatus and getLocalIP)
  const detectNetwork = useCallback(async () => {
    setIsScanning(true);

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.');

    if (isLocalhost) {
      setDetectedNetwork(`${officeSSID} (LOCAL DEV)`);
      updateStatus(true, officeSSID);
      setIsScanning(false);
      return;
    }

    try {
      const nav = navigator;
      const connection =
        nav.connection || nav.mozConnection || nav.webkitConnection;

      if (connection) {
        setConnectionType(
          connection.effectiveType || connection.type || 'unknown'
        );
      }

      const localIP = await getLocalIP();
      
      const isOfficeNetwork = localIP && (
        localIP.startsWith('192.168.0.') || 
        localIP.startsWith('192.168.1.')
      );

      if (isOfficeNetwork) {
        setDetectedNetwork(officeSSID);
        updateStatus(true, officeSSID);
      } else {
        const networkName = localIP
          ? `Network (${localIP})`
          : 'Restricted Network (Secure Browser)';

        setDetectedNetwork(networkName);
        updateStatus(false, networkName);
      }
    } catch (error) {
      console.error('Network detection error:', error);
      updateStatus(false, 'Detection Error');
    }

    setIsScanning(false);
  }, [officeSSID, updateStatus, getLocalIP]); // Correct dependencies

  useEffect(() => {
    detectNetwork();
    const interval = setInterval(detectNetwork, 8000);
    return () => clearInterval(interval);
  }, [detectNetwork]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border-2 p-3 sm:p-4 transition-colors duration-500 ${
        isConnected
          ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/50'
          : 'bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-500/50'
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          {isScanning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Signal className="size-5 text-cyan-400" />
            </motion.div>
          ) : isConnected ? (
            <Wifi className="size-5 text-cyan-400" />
          ) : (
            <WifiOff className="size-5 text-red-400" />
          )}

          <div>
            <div className="text-xs font-mono text-gray-400">
              Network Status
            </div>
            <div
              className={`text-sm font-semibold ${
                isConnected ? 'text-cyan-400' : 'text-red-400'
              }`}
            >
              {isScanning
                ? 'Scanning...'
                : isConnected
                ? 'Connected'
                : 'Not Authorized'}
            </div>
          </div>

          {isConnected && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/50">
              <Zap className="size-3 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400">
                SECURE
              </span>
            </div>
          )}
        </div>

        <div className="text-xs space-y-1 font-mono">
          <div className="text-gray-300">
            Detected Network:{' '}
            <span className="text-cyan-300 font-bold">
              {detectedNetwork || '—'}
            </span>
          </div>
          <div className="text-gray-300">
            Required Network:{' '}
            <span className="text-purple-300 font-bold">{officeSSID}</span>
          </div>
          {connectionType && (
            <div className="text-gray-400">
              Connection Type:{' '}
              <span className="text-blue-400 uppercase">
                {connectionType}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
// import { useEffect, useState, useCallback, useRef } from 'react';
// import { Wifi, WifiOff, Signal, Zap } from 'lucide-react';
// import { motion } from 'framer-motion';

// export function NetworkDetector({ onNetworkDetected }) {
//   // CONFIGURATION FOR YOUR NETWORK
//   const OFFICE_SSID = "Steerhub First Floor";
//   const GATEWAY_IP = "192.168.0.1"; 

//   const [isConnected, setIsConnected] = useState(false);
//   const [detectedNetwork, setDetectedNetwork] = useState('');
//   const [isScanning, setIsScanning] = useState(true);
  
//   const lastStatus = useRef(null);

//   const updateStatus = useCallback((status, name) => {
//     if (lastStatus.current !== status) {
//       lastStatus.current = status;
//       setIsConnected(status);
//       if (onNetworkDetected) onNetworkDetected(status, name);
//     }
//   }, [onNetworkDetected]);

//   const detectNetwork = useCallback(async () => {
//     setIsScanning(true);

//     // 1. Check if we are in a local development environment
//     const isLocalhost =
//       window.location.hostname === 'localhost' ||
//       window.location.hostname === '127.0.0.1';

//     if (isLocalhost) {
//       setDetectedNetwork(`${OFFICE_SSID} (Local Dev)`);
//       updateStatus(true, OFFICE_SSID);
//       setIsScanning(false);
//       return;
//     }

//     // 2. The "Ping" Strategy for iOS/Android Compatibility
//     // We use an Image object to probe the router. This works on iOS 
//     // even when WebRTC IP masking is active.
//     const probe = new Image();
    
//     // If the router is unreachable, this timer will trigger
//     const timeout = setTimeout(() => {
//       probe.src = ""; 
//       setDetectedNetwork("Public/External Network");
//       updateStatus(false, "Unknown Network");
//       setIsScanning(false);
//     }, 3000);

//     // If the image triggers EITHER load or error, it means the 
//     // IP 192.168.0.1 was found on the current network.
//     const handleFound = () => {
//       clearTimeout(timeout);
//       setDetectedNetwork(OFFICE_SSID);
//       updateStatus(true, OFFICE_SSID);
//       setIsScanning(false);
//     };

//     probe.onload = handleFound;
//     probe.onerror = handleFound;

//     // We point to the router's IP. A cache-buster (?c=...) ensures 
//     // the browser doesn't lie to us with a cached result.
//     probe.src = `http://${GATEWAY_IP}/favicon.ico?c=${Date.now()}`;

//   }, [OFFICE_SSID, updateStatus]);

//   useEffect(() => {
//     detectNetwork();
//     // Scan every 10 seconds to detect if the user leaves the building
//     const interval = setInterval(detectNetwork, 10000); 
//     return () => clearInterval(interval);
//   }, [detectNetwork]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.98 }}
//       animate={{ opacity: 1, scale: 1 }}
//       className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-500 ${
//         isConnected
//           ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
//           : 'bg-slate-900 border-red-500/40'
//       }`}
//     >
//       <div className="flex items-center gap-4">
//         <div className={`flex items-center justify-center size-12 rounded-xl ${
//           isConnected ? 'bg-cyan-500/10' : 'bg-red-500/10'
//         }`}>
//           {isScanning ? (
//             <motion.div
//               animate={{ rotate: 360 }}
//               transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
//             >
//               <Signal className="size-6 text-cyan-400" />
//             </motion.div>
//           ) : isConnected ? (
//             <Wifi className="size-6 text-cyan-400" />
//           ) : (
//             <WifiOff className="size-6 text-red-400" />
//           )}
//         </div>

//         <div className="flex-1">
//           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
//             Network Authentication
//           </h3>
//           <div className={`text-lg font-bold tracking-tight ${
//             isConnected ? 'text-cyan-400' : 'text-red-400'
//           }`}>
//             {isScanning ? 'SCANNING...' : isConnected ? 'AUTHORIZED' : 'ACCESS DENIED'}
//           </div>
//         </div>

//         {isConnected && (
//           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/30">
//             <Zap className="size-3.5 text-cyan-400 fill-cyan-400" />
//             <span className="text-xs font-bold text-cyan-400 tracking-tighter">SECURE NODE</span>
//           </div>
//         )}
//       </div>

//       <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 font-mono text-[11px]">
//         <div>
//           <div className="text-slate-500 mb-1">LOCAL SSID</div>
//           <div className="text-slate-300 font-bold truncate">{OFFICE_SSID}</div>
//         </div>
//         <div className="text-right">
//           <div className="text-slate-500 mb-1">STATUS</div>
//           <div className={isConnected ? 'text-cyan-400' : 'text-red-400'}>
//             {detectedNetwork || 'DETECTING...'}
//           </div>
//         </div>
//       </div>
      
//       {/* Background glow effect */}
//       <div className={`absolute -right-8 -bottom-8 size-24 blur-[50px] rounded-full ${
//         isConnected ? 'bg-cyan-500/20' : 'bg-red-500/20'
//       }`} />
//     </motion.div>
//   );
// }