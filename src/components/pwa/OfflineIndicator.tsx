import React, { useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/indexedDB';

interface Props {
  onSyncComplete?: () => void;
}

export const OfflineIndicator: React.FC<Props> = ({ onSyncComplete }) => {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const unsynced = await db.transactions.where('synced').equals(0 as any).toArray();
      
      const response = await fetch('/api/v1/sync/offline-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: unsynced })
      });

      if (response.ok) {
        // Mark all as synced
        await db.transactions.toCollection().modify({ synced: true });
        setSyncFeedback(`¡Sincronizado! Todo al día.`);
        setTimeout(() => setSyncFeedback(null), 3000);
        onSyncComplete?.();
      }
    } catch {
      setSyncFeedback('Sincronización guardada localmente');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#582C7B] border border-[#582C7B] text-white text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-sm h-2 w-2 bg-[#D94680]"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline font-impact uppercase tracking-wider">Conectada</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#D94680] border border-[#c23670] text-white text-xs font-bold shadow-xs">
          <WifiOff className="w-3.5 h-3.5 text-white" />
          <span className="font-impact uppercase tracking-wider">Modo Offline Local</span>
        </div>
      )}

      <button
        onClick={handleManualSync}
        disabled={isSyncing || !isOnline}
        className={`p-1.5 rounded-sm border transition-all ${
          isOnline
            ? 'border-[#582C7B] bg-white hover:bg-purple-50 text-[#582C7B] cursor-pointer shadow-xs'
            : 'border-stone-300 bg-stone-100 text-stone-400 cursor-not-allowed'
        }`}
        title="Sincronizar cambios"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#D94680]' : ''}`} />
      </button>

      {syncFeedback && (
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#582C7B] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#582C7B]" />
          {syncFeedback}
        </span>
      )}
    </div>
  );
};
