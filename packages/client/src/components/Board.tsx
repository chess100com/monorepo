import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { Chessground } from '@chess100com/chessground';
import type { Api } from '@chess100com/chessground/api';
import type { Config } from '@chess100com/chessground/config';
import type { Key } from '@chess100com/chessground/types';
import type { CoordinateInterface, ExtraMoveData } from '@chess100com/rules';
import type { GameStateSnapshot, PlayerColor } from '@chess100com/client-core';
import { coordToKey, computeDests, isPromotion, keyToCoord, AutoPawnPromotion } from '../services/chess';

export interface BoardGameLike {
  state: GameStateSnapshot | null;
  myColor: PlayerColor | null;
  isMyTurn: boolean;
  error: string | null;
  move(from: CoordinateInterface, to: CoordinateInterface, extra?: ExtraMoveData): void;
}

export const Board = observer(({ game }: { game: BoardGameLike }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    apiRef.current = Chessground(elementRef.current, {});
    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    const state = game.state;
    if (!api || !state) return;

    const lastMove = state.moves.length > 0
      ? [coordToKey(state.moves[state.moves.length - 1].from), coordToKey(state.moves[state.moves.length - 1].to)] as Key[]
      : undefined;

    const canMove = game.isMyTurn;
    const dests = canMove ? computeDests(state.currentFen) : new Map<Key, Key[]>();

    const config: Config = {
      fen: state.currentFen,
      orientation: game.myColor ?? 'white',
      turnColor: state.turn,
      check: state.check ? state.turn : undefined,
      lastMove,
      movable: {
        free: false,
        color: canMove ? state.turn : undefined,
        dests,
        events: {
          after: (orig, dest) => {
            const fromCoord = keyToCoord(orig);
            const toCoord = keyToCoord(dest);
            const currentFen = game.state?.currentFen;
            const extra = currentFen && isPromotion(currentFen, fromCoord, toCoord)
              ? { pawnTransform: AutoPawnPromotion }
              : undefined;
            game.move(fromCoord, toCoord, extra);
          },
        },
      },
    };

    api.set(config);
  }, [game.state, game.myColor, game.isMyTurn, game]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !game.error || !game.state) return;
    api.set({ fen: game.state.currentFen });
  }, [game.error, game.state]);

  return <div ref={elementRef} className="cg-wrap" />;
});
