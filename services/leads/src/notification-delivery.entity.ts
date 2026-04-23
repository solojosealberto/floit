import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "notification_deliveries" })
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 32 })
  status!: "pending" | "sent" | "failed";

  @Column({ type: "integer", default: 0 })
  attempts!: number;

  @Column({ type: "datetime" })
  nextAttemptAt!: Date;

  @Column({ type: "varchar", length: 512, nullable: true })
  lastError!: string | null;

  @Column({ type: "text" })
  payload!: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}
