import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { VenueEntity } from "../venues/venue.entity";

@Entity({ name: "promotions" })
export class PromotionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  venueId!: string;

  @ManyToOne(() => VenueEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "venueId" })
  venue!: VenueEntity;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  conditions!: string | null;

  @Column({ type: "timestamptz" })
  startsAt!: Date;

  @Column({ type: "timestamptz" })
  endsAt!: Date;
}
