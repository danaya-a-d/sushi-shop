import { describe, expect, it, vi } from "vitest";
import { makeApiProduct } from "@/test-utils/fixtures";
import { MAX_IDS_PER_REQUEST, createFetchProductsByIds } from "./browser";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const idsOf = (url: string) => new URL(url).searchParams.get("ids")?.split(",") ?? [];
const empty = { available: [], unavailable: [], missing: [] };

describe("createFetchProductsByIds", () => {
  it("один пакетный запрос на все id, ответ приводится к frontend Product", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json({
        available: [makeApiProduct("1", { priceKopecks: 125000 })],
        unavailable: ["2"],
        missing: ["3"],
      }),
    );
    const fetchProducts = createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl });

    const result = await fetchProducts(["1", "2", "3"]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toBe("http://api.test/products/by-ids?ids=1,2,3");
    expect(result.available[0].price).toBe(1250);
    expect(result.unavailable).toEqual(["2"]);
    expect(result.missing).toEqual(["3"]);
  });

  it("дубликаты id убираются", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json({ ...empty, missing: ["1"] }),
    );
    await createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl })(["1", "1", "1"]);
    expect(idsOf(String(fetchImpl.mock.calls[0][0]))).toEqual(["1"]);
  });

  it("пустой список не вызывает сеть", async () => {
    const fetchImpl = vi.fn();
    const result = await createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl })([]);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toEqual(empty);
  });

  it("большой набор делится на запросы не больше MAX_IDS_PER_REQUEST", async () => {
    const all = Array.from({ length: MAX_IDS_PER_REQUEST * 2 + 5 }, (_, i) => `p${i}`);
    const fetchImpl = vi.fn<typeof fetch>(async (url) =>
      json({ ...empty, missing: idsOf(String(url)) }),
    );
    const result = await createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl })(all);

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    for (const [url] of fetchImpl.mock.calls) {
      expect(idsOf(String(url)).length).toBeLessThanOrEqual(MAX_IDS_PER_REQUEST);
    }
    expect(result.missing).toEqual(all);
  });

  it("если упал один из запросов, отклоняется весь вызов (частичный результат не выдаётся)", async () => {
    const all = Array.from({ length: MAX_IDS_PER_REQUEST + 1 }, (_, i) => `p${i}`);
    let n = 0;
    const fetchImpl = vi.fn(async () => (++n === 1 ? json(empty) : json({}, 500)));
    await expect(
      createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl })(all),
    ).rejects.toMatchObject({ kind: "http", status: 500 });
  });

  it("сетевая ошибка и неверный формат — ApiError", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(
      createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl: down })(["1"]),
    ).rejects.toMatchObject({ kind: "network" });

    const bad = vi.fn(async () => json({ unexpected: true }));
    await expect(
      createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl: bad })(["1"]),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  it("не использует браузерный HTTP-кэш: цена и доступность должны быть актуальными", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json({ ...empty, missing: ["1"] }),
    );
    await createFetchProductsByIds({ baseUrl: "http://api.test", fetchImpl })(["1"]);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
});
