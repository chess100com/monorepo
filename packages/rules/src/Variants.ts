import type { GameMetaData } from "./Game.js"
import { Game } from "./Game.js"
import { GameType, HeirsStartFen, GrandChessStartFen, GeneralsStartFen } from "./Shared.js"

/**
 * Creates a fresh game instance for a variant. The factory carries the
 * variant identity through to Position so its rules (pawn behaviour,
 * castling availability, special promotions) match the chosen game type.
 */
export type GameFactory = (metadata?: GameMetaData) => Game

export const GameFactories: Record<GameType, GameFactory> = {
  [GameType.Heirs]: (metadata?: GameMetaData) => Game.fromFen(HeirsStartFen, metadata, GameType.Heirs),
  [GameType.GrandChess]: (metadata?: GameMetaData) => Game.fromFen(GrandChessStartFen, metadata, GameType.GrandChess),
  [GameType.Generals]: (metadata?: GameMetaData) => Game.fromFen(GeneralsStartFen, metadata, GameType.Generals),
}

/**
 * Canonical starting FEN per variant. The Game row persists `startFen`
 * directly (so rehydration does not need to resolve the variant), but we
 * keep this lookup so game creation can pick the right FEN from the variant.
 */
export const VariantStartFen: Record<GameType, string> = {
  [GameType.Heirs]: HeirsStartFen,
  [GameType.GrandChess]: GrandChessStartFen,
  [GameType.Generals]: GeneralsStartFen,
}
