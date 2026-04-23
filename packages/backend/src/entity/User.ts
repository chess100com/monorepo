import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  username!: string;

  @Column({ unique: true })
  username_unique!: string;

  @Column()
  password!: string;

  @Column({ type: 'integer', default: 1500 })
  rating!: number;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  lastLogin!: Date | null;
}
