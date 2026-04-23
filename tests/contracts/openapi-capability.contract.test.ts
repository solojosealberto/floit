import assert from "node:assert/strict";
import { describe, it } from "node:test";
import SwaggerParser from "@apidevtools/swagger-parser";

describe("OpenAPI contract: capability buscar -> ficha -> comparar -> lead", () => {
  it("valida search/catalog/leads OpenAPI y paths críticos", async () => {
    const searchDoc = (await SwaggerParser.parse(
      "openapi/search.yaml",
    )) as Record<string, any>;
    const catalogDoc = (await SwaggerParser.parse(
      "openapi/catalog.yaml",
    )) as Record<string, any>;
    const leadsDoc = (await SwaggerParser.parse(
      "openapi/leads.yaml",
    )) as Record<string, any>;

    assert.ok(searchDoc.paths?.["/v1/search"]?.get);
    assert.ok(catalogDoc.paths?.["/v1/venues"]?.get);
    assert.ok(catalogDoc.paths?.["/v1/venues/{slug}"]?.get);
    assert.ok(leadsDoc.paths?.["/v1/leads"]?.post);
    assert.ok(leadsDoc.paths?.["/v1/leads/status/{token}"]?.get);
  });
});
