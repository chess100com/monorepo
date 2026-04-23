import type { GameMetaData } from "./Game.js"
import { Game } from "./Game.js"
import { StartFen } from "./Shared.js"

/**
 * Variants of 10x10 chess supported by this engine. Add new entries here as
 * new variants are implemented; keep the enum's string values stable because
 * they are persisted on the Game row and emitted over the wire.
 */
export enum GameType {
  Heirs = "heirs",
}

/**
 * Creates a fresh game instance for a variant. All variants share the Game
 * class today — they only differ by starting position — but the factory
 * indirection is here so variants with variant-specific rules can return a
 * subclass (or inject rule modifiers) without touching callers.
 */
export type GameFactory = (metadata?: GameMetaData) => Game

export const GameFactories: Record<GameType, GameFactory> = {
  [GameType.Heirs]: (metadata?: GameMetaData) => Game.fromFen(StartFen, metadata),
}

/**
 * Canonical starting FEN per variant. The Game row persists `startFen`
 * directly (so rehydration does not need to resolve the variant), but we
 * keep this lookup so game creation can pick the right FEN from the variant.
 */
export const VariantStartFen: Record<GameType, string> = {
  [GameType.Heirs]: StartFen,
}
