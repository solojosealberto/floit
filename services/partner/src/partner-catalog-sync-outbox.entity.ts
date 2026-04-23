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

  @Column({ type: "datetime" })
  nextAttemptAt!: Date;

  @Column({ type: "varchar", length: 512, nullable: true })
  lastError!: string | null;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "text" })
  payload!: string;

  @Column({ type: "datetime", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
