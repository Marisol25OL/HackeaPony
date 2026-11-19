import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface Props {
  isOnline: boolean;
  isManualOffline: boolean;
  onToggleManualOffline: () => void;
  pendingCount?: number;
}

export const OfflineModeBanner: React.FC<Props> = ({
  isOnline,
  isManualOffline,
  onToggleManualOffline,
  pendingCount = 0
}) => {
  return (
    <div className={`transition-colors duration-150 border-b text-[11px] ${
      !isOnline
        ? 'bg-zinc-900 text-white border-zinc-800'
        : 'bg-zinc-100 text-zinc-600 border-zinc-200/70'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
        
        {/* Status Text */}
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <WifiOff className="w-3.5 h-3.5 text-zinc-300" />
              <span>
                <strong className="text-zinc-100 font-semibold mr-1">Modo sin internet:</strong>
                Tus operaciones se guardan localmente en tu dispositivo.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              <Wifi className="w-3 h-3 text-zinc-400" />
              <span>
                <strong className="text-zinc-800 font-semibold mr-1">En línea:</strong>
                Sincronización activa.
              </span>
            </div>
          )}
        </div>

        {/* Offline Switch Button */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={onToggleManualOffline}
            className={`px-2 py-0.5 rounded-md font-medium text-[10px] transition-all cursor-pointer border ${
              isManualOffline
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-2xs'
            }`}
          >
            {isManualOffline ? 'Reconectar' : 'Probar Modo Offline'}
          </button>

          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              {pendingCount} pendientes
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
