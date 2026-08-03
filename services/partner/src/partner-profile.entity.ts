import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TIMESTAMP_COLUMN_TYPE } from "./typeorm-column-types";

@Entity({ name: "partner_profiles" })
@Index(["partnerEmail", "venueSlug"], { unique: true })
export class PartnerProfileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160, default: "__global__" })
  venueSlug!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  businessName!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  scheduleSummary!: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  contactPhone!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  contactEmail!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  contactWhatsapp!: string | null;

  @Column({ type: "simple-json", nullable: true })
  photoUrls!: string[] | null;

  /** Catalog modality slugs (e.g. pilates, functional). */
  @Column({ type: "simple-json", nullable: true })
  modalities!: string[] | null;

  /** Catalog amenity slugs (e.g. parking, sauna). */
  @Column({ type: "simple-json", nullable: true })
  amenities!: string[] | null;

  @CreateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  updatedAt!: Date;
}
