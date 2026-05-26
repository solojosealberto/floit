import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "partner_catalog_sync_outbox" })
export class PartnerCatalogSyncOutboxEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 40 })
  eventType!: "partner.catalog.sync.requested";

  @Column({ type: "varchar", length: 24, default: "pending" })
  status!: "pending" | "published" | "failed";

  @Column({ type: "integer", default: 0 })
  attempts!: number;

  @Column({ type: "timestamptz" })
  nextAttemptAt!: Date;

  @Column({ type: "varchar", length: 512, nullable: true })
  lastError!: string | null;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "text" })
  payload!: string;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
