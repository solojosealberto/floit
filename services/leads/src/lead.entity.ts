import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TIMESTAMP_COLUMN_TYPE } from "./typeorm-column-types";

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
  @Column({ type: TIMESTAMP_COLUMN_TYPE, nullable: true })
  firstContactedAt!: Date | null;

  @Column({ type: "varchar", length: 36, unique: true })
  publicToken!: string;

  /** IP observada en submit (US-7.2). */
  @Column({ type: "varchar", length: 45, nullable: true })
  clientIp!: string | null;

  /** Heurística anti-abuso (revisión operativa). */
  @Column({ type: "boolean", default: false })
  suspicious!: boolean;

  /** Origen declarado del contacto (formulario web vs WhatsApp). */
  @Column({ type: "varchar", length: 16, default: "form" })
  entryChannel!: "form" | "whatsapp";

  /** User-Agent observado al crear el lead (cabecera enviada por el BFF web). */
  @Column({ type: "text", nullable: true })
  clientUserAgent!: string | null;

  /** Nota interna visible solo en backoffice admin. */
  @Column({ type: "text", nullable: true })
  adminNote!: string | null;

  @CreateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ type: TIMESTAMP_COLUMN_TYPE })
  updatedAt!: Date;
}
