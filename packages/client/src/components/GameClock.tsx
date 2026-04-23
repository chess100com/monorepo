import { useEffect, useState } from 'react';
import type { ClockSnapshot, PlayerColor } from '@chess100com/client-core';

interface Props {
  clock: ClockSnapshot | null;
  side: PlayerColor;
  // When the current server broadcast was received. Used as the baseline
  // from which to locally decrement the active side's clock between pushes.
  receivedAt: number;
  // True when this side's clock is currently running on the server. The
  // component ticks locally only while `active` is true.
  active: boolean;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export const GameClock: React.FC<Props> = ({ clock, side, receivedAt, active }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);

  if (!clock) return null;

  const baseMs = side === 'white' ? clock.whiteMs : clock.blackMs;
  const displayMs = active ? Math.max(0, baseMs - (now - receivedAt)) : baseMs;

  return (
    <div className={`clock${active ? ' clock-active' : ''}${displayMs === 0 ? ' clock-flag' : ''}`}>
      {formatClock(displayMs)}
    </div>
  );
};
