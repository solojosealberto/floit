import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type TaxonomyKind = "modality" | "amenity";

@Entity({ name: "taxonomy_attributes" })
export class TaxonomyAttributeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 160 })
  label!: string;

  @Column({ type: "varchar", length: 24 })
  kind!: TaxonomyKind;

  @Column({ type: "varchar", length: 80, nullable: true })
  icon!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
