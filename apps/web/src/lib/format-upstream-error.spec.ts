import assert from "node:assert/strict";
import test from "node:test";
import {
  formatUpstreamError,
  formatUpstreamMessage,
} from "./format-upstream-error";

test("formatUpstreamMessage concatena arrays de mensajes", () => {
  const message = formatUpstreamMessage({
    message: ["name should not be empty", "phone should not be empty"],
  });
  assert.equal(
    message,
    "name should not be empty · phone should not be empty",
  );
});

test("formatUpstreamError aplica fallback cuando no hay mensaje utilizable", () => {
  const fallback = "No se pudo enviar.";
  assert.equal(formatUpstreamError({ message: [] }, fallback), fallback);
});
