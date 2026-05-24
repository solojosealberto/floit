import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "venues" })
export class VenueEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 240 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 320 })
  address!: string;

  @Column({ type: "varchar", length: 120 })
  zone!: string;

  @Column({ type: "double precision" })
  lat!: number;

  @Column({ type: "double precision" })
  lng!: number;

  /** gym | functional | yoga | pilates | cycling | mixed | personal_training */
  @Column({ type: "varchar", length: 48 })
  venueType!: string;

  @Column({ type: "varchar", array: true })
  modalities!: string[];

  @Column({ type: "varchar", array: true })
  amenities!: string[];

  /** Precio mensual referencial en moneda local (entero). */
  @Column({ type: "int", nullable: true })
  priceMin!: number | null;

  @Column({ type: "int", nullable: true })
  priceMax!: number | null;

  @Column({ type: "float", nullable: true })
  completenessScore!: number | null;

  /** 0–1 señal interna de demanda/clicks para ordenar (US-1.4). */
  @Column({ type: "float", default: 0.5 })
  popularityScore!: number;

  /** reference | partner_verified | floit_verified (US-7.3). */
  @Column({ type: "varchar", length: 24, default: "reference" })
  verificationStatus!: string;

  @Column({ type: "boolean", default: true })
  allowsTrial!: boolean;

  /** Teléfono público opcional (US-3.2). */
  @Column({ type: "varchar", length: 40, nullable: true })
  contactPhone!: string | null;

  /** Solo dígitos E.164 sin + recomendado para wa.me (US-3.2). */
  @Column({ type: "varchar", length: 40, nullable: true })
  contactWhatsapp!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  contactEmail!: string | null;

  @Column({ type: "varchar", length: 900, array: true, nullable: true })
  photoUrls!: string[] | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
