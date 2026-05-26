import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TIMESTAMP_COLUMN_TYPE } from "./typeorm-column-types";

@Entity({ name: "partner_catalog_sync_jobs" })
export class PartnerCatalogSyncJobEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 24, default: "pending" })
  status!: "pending" | "sent" | "failed";

  @Column({ type: "integer", default: 0 })
  attempts!: number;

  @Column({ type: TIMESTAMP_COLUMN_TYPE })
  nextAttemptAt!: Date;

  @Column({ type: "varchar", length: 512, nullable: true })
  lastError!: string | null;

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "text" })
  payload!: string;

  @CreateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;
}
