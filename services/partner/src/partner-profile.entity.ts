import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "partner_profiles" })
export class PartnerProfileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200, unique: true })
  partnerEmail!: string;

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

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
