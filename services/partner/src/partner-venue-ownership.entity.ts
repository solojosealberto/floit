import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "partner_venue_ownerships" })
@Index(["partnerEmail", "venueSlug"], { unique: true })
export class PartnerVenueOwnershipEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 24, default: "active" })
  status!: "active" | "revoked";

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
