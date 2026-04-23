import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "venue_reports" })
export class VenueReportEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  venueSlug!: string;

  @Column({ type: "varchar", length: 64 })
  kind!: string;

  @Column({ type: "text" })
  message!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
