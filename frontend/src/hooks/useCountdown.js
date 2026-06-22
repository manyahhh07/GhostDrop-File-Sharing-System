import { useState, useEffect } from 'react';
import { timeRemaining, expiryLevel } from '../utils/helpers';

export function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(timeRemaining(expiresAt));
  const [level, setLevel] = useState(expiryLevel(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      setRemaining(timeRemaining(expiresAt));
      setLevel(expiryLevel(expiresAt));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { remaining, level };
}