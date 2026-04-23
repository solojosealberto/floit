import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "leads" })
export class LeadEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 24 })
  intent!: "membership" | "trial" | "info";

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  preferredSlot!: string | null;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  /** Consentimiento explícito antes de enviar (RF-18 / planes maestro & prompt engineering). */
  @Column({ type: "boolean", default: false })
  consentAccepted!: boolean;

  /** Versión de textos legales aceptados (ej. floit-r2-2026-04). */
  @Column({ type: "varchar", length: 32, nullable: true })
  consentVersion!: string | null;

  @Column({ type: "varchar", length: 24, default: "received" })
  status!: "received" | "contacted" | "closed";

  /** Primer momento en que operación/partner atiende el lead (SLA). */
  @Column({ type: "datetime", nullable: true })
  firstContactedAt!: Date | null;

  @Column({ type: "varchar", length: 36, unique: true })
  publicToken!: string;

  /** IP observada en submit (US-7.2). */
  @Column({ type: "varchar", length: 45, nullable: true })
  clientIp!: string | null;

  /** Heurística anti-abuso (revisión operativa). */
  @Column({ type: "boolean", default: false })
  suspicious!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
