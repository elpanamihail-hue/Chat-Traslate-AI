import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface Props {
  uid: string;
  className?: string;
}

export default function StatusIndicator({ uid, className }: Props) {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        setStatus(docSnap.data().status || 'offline');
      }
    }, (error) => {
      console.error("Status indicator snapshot error:", error);
    });

    return () => unsub();
  }, [uid]);

  return (
    <div 
      className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-w-sidebar transition-all duration-300",
        status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" : "bg-gray-400",
        className
      )}
    />
  );
}
