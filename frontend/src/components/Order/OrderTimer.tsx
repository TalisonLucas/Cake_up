import { useEffect, useState } from 'react';
import { HiClock } from 'react-icons/hi';
import type { Order } from '../../types';

interface OrderTimerProps {
  order: Order;
  onExpire?: () => void;
}

export const OrderTimer = ({ order, onExpire }: OrderTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!order.canEditUntil) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const editUntil = new Date(order.canEditUntil!).getTime();
      const remaining = Math.max(0, Math.floor((editUntil - now) / 1000));
      return remaining;
    };

    // Initial calculation
    setRemainingSeconds(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order.canEditUntil, onExpire]);

  if (remainingSeconds === 0) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isExpiringSoon = remainingSeconds <= 30;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
        isExpiringSoon
          ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
          : 'bg-blue-50 border-blue-300 text-blue-700'
      }`}
    >
      <HiClock size={20} />
      <div className="flex flex-col">
        <span className="text-xs font-medium">
          {isExpiringSoon ? 'Tempo acabando!' : 'Você pode alterar seu pedido'}
        </span>
        <span className="text-lg font-bold font-mono">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

