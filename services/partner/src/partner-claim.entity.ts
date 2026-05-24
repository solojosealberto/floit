import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "partner_claims" })
export class PartnerClaimEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 160 })
  representativeName!: string;

  @Column({ type: "varchar", length: 200 })
  representativeEmail!: string;

  @Column({ type: "varchar", length: 40 })
  representativePhone!: string;

  @Column({ type: "text", nullable: true })
  evidence!: string | null;

  /** existing = reclamo de ficha ya listada; new = alta de centro nuevo (stub en catálogo al aprobar). */
  @Column({ type: "varchar", length: 16, default: "existing" })
  claimKind!: "existing" | "new";

  /** JSON serializado de PartnerClaimNewVenueDraftDto cuando claimKind es new. */
  @Column({ type: "text", nullable: true })
  newVenueDraftJson!: string | null;

  @Column({ type: "varchar", length: 24, default: "pending_review" })
  status!: "pending_review" | "approved" | "rejected";

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
