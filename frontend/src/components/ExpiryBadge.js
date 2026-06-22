import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

export default function ExpiryBadge({ expiresAt }) {
  const { remaining, level } = useCountdown(expiresAt);

  return (
    <span className={`expiry-badge ${level}`}>
      <span className="expiry-dot" />
      {remaining}
    </span>
  );
}