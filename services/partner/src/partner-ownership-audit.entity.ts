import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "partner_ownership_audit" })
export class PartnerOwnershipAuditEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64 })
  action!: "revoked";

  @Column({ type: "varchar", length: 200 })
  partnerEmail!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 200 })
  actor!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
