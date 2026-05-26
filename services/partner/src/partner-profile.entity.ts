import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

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

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
