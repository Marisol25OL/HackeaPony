import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [navigatorOnline, setNavigatorOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Allow manual toggle of offline mode stored in localStorage
  const [isManualOffline, setIsManualOffline] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('myfimes_offline_override') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setNavigatorOnline(true);
    const handleOffline = () => setNavigatorOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleManualOffline = () => {
    const nextVal = !isManualOffline;
    setIsManualOffline(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('myfimes_offline_override', String(nextVal));
    }
  };

  // If user forced offline OR browser is genuinely offline
  const isOnline = !isManualOffline && navigatorOnline;

  return {
    isOnline,
    isManualOffline,
    toggleManualOffline,
    navigatorOnline
  };
}
