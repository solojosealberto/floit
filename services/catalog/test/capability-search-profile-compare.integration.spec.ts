import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { GenericContainer } from "testcontainers";
import { capabilityFixture } from "../../../tests/fixtures/capability-search-profile-compare-lead";
import { AppModule } from "../src/app.module";
import { VenueEntity } from "../src/venues/venue.entity";

describe("Capability integration: buscar -> ficha -> comparar", () => {
  let app: INestApplication;
  let pg: Awaited<ReturnType<GenericContainer["start"]>>;

  before(async () => {
    pg = await new GenericContainer("postgres:16-alpine")
      .withEnvironment({
        POSTGRES_DB: "floit_test",
        POSTGRES_USER: "floit",
        POSTGRES_PASSWORD: "floit",
      })
      .withExposedPorts(5432)
      .start();

    process.env.DATABASE_URL = `postgresql://floit:floit@${pg.getHost()}:${pg.getMappedPort(
      5432,
    )}/floit_test`;
    process.env.DATABASE_SYNC = "true";
    process.env.SEED_ON_BOOT = "false";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const repo = app.get(getRepositoryToken(VenueEntity));
    await repo.save(
      capabilityFixture.venues.map((v) =>
        repo.create({
          ...v,
          description: `${v.name} test fixture`,
          contactPhone: "+58 212 000 0000",
          contactWhatsapp: "584120000000",
          contactEmail: "info@floit.dev",
        }),
      ),
    );
  });

  after(async () => {
    await app?.close();
    await pg?.stop();
  });

  it("lista resultados por zona para búsqueda", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/venues")
      .query({ zone: capabilityFixture.zones[0], sort: "relevance" })
      .expect(200);

    assert.equal(Array.isArray(res.body.items), true);
    assert.ok(res.body.items.length > 0);
    assert.equal(res.body.items[0].zone, capabilityFixture.zones[0]);
  });

  it("devuelve ficha pública por slug", async () => {
    const slug = capabilityFixture.compareSlugs[0];
    const res = await request(app.getHttpServer())
      .get(`/v1/venues/${slug}`)
      .expect(200);

    assert.equal(res.body.slug, slug);
    assert.equal(res.body.name, capabilityFixture.venues[0].name);
    assert.equal(res.body.contactWhatsapp, "584120000000");
  });
});
