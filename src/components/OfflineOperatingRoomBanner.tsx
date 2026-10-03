import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { offlineSyncQueue, NetworkState } from '../cloud/OfflineSyncQueue';

export const OfflineOperatingRoomBanner: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(offlineSyncQueue.getNetworkState());
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);

  useEffect(() => {
    let wasOffline = !networkState.isOnline;

    const unsub = offlineSyncQueue.subscribe((state) => {
      if (wasOffline && state.isOnline) {
        setShowReconnectedAlert(true);
        setTimeout(() => setShowReconnectedAlert(false), 4500);
      }
      wasOffline = !state.isOnline;
      setNetworkState(state);
    });

    return () => unsub();
  }, []);

  if (networkState.isOnline && !showReconnectedAlert) {
    return null;
  }

  if (showReconnectedAlert) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200 z-50">
        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
        <span>¡Conexión restaurada! Sincronizando documentos y expedientes con la nube central...</span>
        <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1 text-emerald-200" />
      </div>
    );
  }

  return (
    <div className="bg-[#1e1b4b] text-indigo-100 border-b border-indigo-700/60 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200 z-50">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-lg bg-indigo-900/80 text-amber-300 border border-indigo-600/40">
          <WifiOff className="w-3.5 h-3.5" />
        </span>
        <span>
          <strong>Modo Quirófano / Offline Activo:</strong> Puedes emitir récipes, historias e informes con normalidad. Los datos se guardan en este dispositivo y se respaldarán automáticamente al recuperar señal.
        </span>
      </div>

      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-cyan-300 border border-indigo-700/60">
        100% Funcional Local
      </span>
    </div>
  );
};
