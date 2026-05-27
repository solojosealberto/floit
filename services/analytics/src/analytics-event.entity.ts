import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TIMESTAMP_COLUMN_TYPE } from "./typeorm-column-types";

@Entity({ name: "analytics_events" })
export class AnalyticsEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "simple-json", nullable: true })
  properties!: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 16, default: "unknown" })
  device!: "mobile" | "tablet" | "desktop" | "bot" | "unknown";

  @Column({ type: "varchar", length: 400, nullable: true })
  source!: string | null;

  @CreateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;
}
