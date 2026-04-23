import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import type { GameType } from '@chess100com/rules';

@Entity()
@Unique('UQ_user_rating_user_type', ['userId', 'gameType'])
export class UserRating {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  userId!: number;

  @Column({ type: 'varchar' })
  gameType!: GameType;

  @Column({ type: 'integer', default: 1500 })
  rating!: number;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;
}
