import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, MessageSquareWarning } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  type: 'risk' | 'signal' | 'copilot';
  message: string;
  title: string;
}

export function NotificationCopilot() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulated proactive notifications
    const timeouts = [
      setTimeout(() => {
        setNotifications(prev => [...prev, {
          id: '1',
          type: 'risk',
          title: 'RISK ENGINE',
          message: 'ETH/USDT Volatility spike detected. Max Leverage cut to 2x for Betafish.'
        }]);
      }, 15000),
      setTimeout(() => {
        setNotifications(prev => [...prev, {
          id: '2',
          type: 'signal',
          title: 'MIROFISH AGENT',
          message: 'Signal confidence dropped below 80%. Entry aborted for SOL/USDT.'
        }]);
      }, 45000)
    ];

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-3 font-mono">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={clsx(
              "w-72 md:w-80 p-4 rounded-xl border backdrop-blur-md shadow-2xl relative overflow-hidden",
              n.type === 'risk' ? "bg-red-500/10 border-red-500/30" :
              n.type === 'signal' ? "bg-[#C026D3]/10 border-[#C026D3]/30" :
              "bg-[#06F7C9]/10 border-[#06F7C9]/30"
            )}
          >
            <button onClick={() => dismiss(n.id)} className="absolute top-2 right-2 text-gray-500 hover:text-white">&times;</button>
            <div className="flex items-center gap-3 mb-2">
              {n.type === 'risk' && <ShieldAlert size={16} className="text-red-400" />}
              {n.type === 'signal' && <Activity size={16} className="text-[#C026D3]" />}
              {n.type === 'copilot' && <MessageSquareWarning size={16} className="text-[#06F7C9]" />}
              <span className={clsx(
                "text-[10px] font-bold uppercase",
                n.type === 'risk' ? "text-red-400" :
                n.type === 'signal' ? "text-[#C026D3]" :
                "text-[#06F7C9]"
              )}>{n.title}</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">{n.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
