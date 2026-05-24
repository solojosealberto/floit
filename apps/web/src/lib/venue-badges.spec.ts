import assert from "node:assert/strict";
import test from "node:test";
import { capabilityFixture } from "../../../../tests/fixtures/capability-search-profile-compare-lead";
import { computeVenueBadges } from "./venue-badges";

test("computeVenueBadges asigna badges de cercanía, precio y completitud", () => {
  const items = [
    {
      ...capabilityFixture.venues[0],
      modalities: [...capabilityFixture.venues[0].modalities],
      amenities: [...capabilityFixture.venues[0].amenities],
      id: "v1",
      distanceM: 300,
    },
    {
      ...capabilityFixture.venues[1],
      modalities: [...capabilityFixture.venues[1].modalities],
      amenities: [...capabilityFixture.venues[1].amenities],
      id: "v2",
      distanceM: 1800,
    },
  ];

  const badges = computeVenueBadges(items);
  const keys = badges["fit-chacao"]?.map((b) => b.key) ?? [];
  assert.ok(keys.includes("closest"));
  assert.ok(keys.includes("price"));
  assert.ok(keys.includes("complete"));
  assert.equal((badges["box-baruta"] ?? []).length, 0);
});
