import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GameStatus, GameType, OngoingResult } from '@chess100com/rules';
import type { MoveMetadata } from '@chess100com/rules';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: GameType.Heirs })
  type!: GameType;

  @Column()
  whiteUserId!: number;

  @Column()
  blackUserId!: number;

  @Column()
  startFen!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  moves!: MoveMetadata[];

  @Column({ default: GameStatus.Ongoing })
  status!: GameStatus;

  @Column({ default: OngoingResult })
  result!: string;

  // Fixed time control for MVP: 10 minutes base + 15s Fischer increment per
  // completed move. Columns live on the row so per-game overrides become a
  // pure data change when we add multiple time controls.
  @Column({ type: 'integer', default: 600_000 })
  initialTimeMs!: number;

  @Column({ type: 'integer', default: 15_000 })
  incrementMs!: number;

  @Column({ type: 'integer', nullable: true, default: null })
  whiteRatingBefore!: number | null;

  @Column({ type: 'integer', nullable: true, default: null })
  blackRatingBefore!: number | null;

  @Column({ type: 'integer', nullable: true, default: null })
  whiteRatingAfter!: number | null;

  @Column({ type: 'integer', nullable: true, default: null })
  blackRatingAfter!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  finishedAt!: Date | null;
}
