import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Ride } from '../../rides/entities/ride.entity';

@Entity('ride_chats')
export class RideChat {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'c3a8f7e2-9d6b-4b8c-8f6j-8c7b6a5d4e3f' })
  @Column()
  ride_id: string;

  @ApiProperty({ example: 'd2a8f7e2-9d6b-4b8c-8f6j-8c7b6a5d4e3d' })
  @Column()
  sender_id: string;

  @ApiProperty({ example: 'client' })
  @Column()
  sender_type: string;

  @ApiProperty({ example: 'I am nearby' })
  @Column('text')
  message: string;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @ApiProperty({ example: '2025-07-17T10:00:00Z' })
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Ride, (ride) => ride.id)
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;
}