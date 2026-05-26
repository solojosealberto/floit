import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "partner_venue_photos" })
@Index(["partnerEmail", "venueSlug", "status"])
export class PartnerVenuePhotoEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 900 })
  url!: string;

  @Column({ type: "varchar", length: 500 })
  storagePath!: string;

  @Column({ type: "varchar", length: 120 })
  mimeType!: string;

  @Column({ type: "int" })
  sizeBytes!: number;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "varchar", length: 24, default: "active" })
  status!: "active" | "deleted";

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
