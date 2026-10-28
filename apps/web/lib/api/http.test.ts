import { describe, expect, it } from "vitest";
import { normalizeBaseUrl, normalizePathPrefix } from "./http";

describe("normalizePathPrefix", () => {
  it("пусто или не задано — без префикса", () => {
    expect(normalizePathPrefix(undefined)).toBe("");
    expect(normalizePathPrefix("")).toBe("");
    expect(normalizePathPrefix("  ")).toBe("");
    expect(normalizePathPrefix("/")).toBe("");
  });

  it("приводит к виду /prefix", () => {
    expect(normalizePathPrefix("/api")).toBe("/api");
    expect(normalizePathPrefix("api")).toBe("/api");
    expect(normalizePathPrefix(" /api/ ")).toBe("/api");
  });
});

describe("normalizeBaseUrl", () => {
  it("принимает абсолютный и относительный адрес, убирает завершающие слэши", () => {
    expect(normalizeBaseUrl("http://localhost:3001/", "X")).toBe("http://localhost:3001");
    expect(normalizeBaseUrl("/api/", "X")).toBe("/api");
  });

  it("пустое значение — ошибка с именем переменной", () => {
    expect(() => normalizeBaseUrl(undefined, "API_URL")).toThrow(/API_URL/);
  });
});
