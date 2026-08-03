import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PHOTO_BLOB_COLUMN_TYPE, TIMESTAMP_COLUMN_TYPE } from "./typeorm-column-types";

@Entity({ name: "partner_venue_photos" })
@Index(["partnerEmail", "venueSlug", "status"])
@Index(["filename"])
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

  /** Basename used under /uploads/:filename (survives disk wipes via blobBase64). */
  @Column({ type: "varchar", length: 220, nullable: true })
  filename!: string | null;

  @Column({ type: "varchar", length: 120 })
  mimeType!: string;

  @Column({ type: "int" })
  sizeBytes!: number;

  /** Base64 of image bytes — durable across ephemeral container disks. */
  @Column({ type: PHOTO_BLOB_COLUMN_TYPE, nullable: true, select: false })
  blobBase64!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "varchar", length: 24, default: "active" })
  status!: "active" | "deleted";

  @CreateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  updatedAt!: Date;
}
