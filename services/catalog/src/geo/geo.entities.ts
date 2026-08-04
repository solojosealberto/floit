import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "geo_states" })
export class GeoStateEntity {
  @PrimaryColumn({ type: "varchar", length: 16 })
  code!: string;

  @Column({ type: "varchar", length: 80, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  capital!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;
}

@Entity({ name: "geo_cities" })
@Index(["stateCode", "slug"], { unique: true })
export class GeoCityEntity {
  /** Stable id: `{stateSlug}--{citySlug}` */
  @PrimaryColumn({ type: "varchar", length: 160 })
  id!: string;

  @Column({ type: "varchar", length: 16 })
  @Index()
  stateCode!: string;

  @Column({ type: "varchar", length: 80 })
  slug!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  capital!: string | null;
}

@Entity({ name: "geo_zones" })
@Index(["cityId", "slug"], { unique: true })
export class GeoZoneEntity {
  /** Stable id: `{cityId}--{zoneSlug}` */
  @PrimaryColumn({ type: "varchar", length: 220 })
  id!: string;

  @Column({ type: "varchar", length: 160 })
  @Index()
  cityId!: string;

  @Column({ type: "varchar", length: 120 })
  slug!: string;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  /** parroquia | barrio | municipio */
  @Column({ type: "varchar", length: 24, default: "parroquia" })
  kind!: string;

  @Column({ type: "boolean", default: false })
  @Index()
  featured!: boolean;

  @Column({ type: "simple-json", nullable: true })
  aliases!: string[] | null;
}
