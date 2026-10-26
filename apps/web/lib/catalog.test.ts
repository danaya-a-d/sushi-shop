import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/http";
import { makeApiProduct } from "@/test-utils/fixtures";

// "use cache" в тестах — просто строка; функции кэша Next подменены заглушками
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const { getCategories, getProductBySlug, getProducts } = await import("./catalog");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_URL = "http://api.test/";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_URL;
});

const requestedUrl = () => String(fetchMock.mock.calls[0][0]);

describe("getProducts", () => {
  it("«Всё» запрашивает /products без параметра category", async () => {
    fetchMock.mockResolvedValue(json([makeApiProduct("1")]));

    await getProducts();
    expect(requestedUrl()).toBe("http://api.test/products");

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(json([]));
    await getProducts("all");
    expect(requestedUrl()).toBe("http://api.test/products");
    expect(requestedUrl()).not.toContain("category");
  });

  it("реальная категория передаётся параметром category", async () => {
    fetchMock.mockResolvedValue(json([]));
    await getProducts("hits");
    expect(requestedUrl()).toBe("http://api.test/products?category=hits");
  });

  it("преобразует ответ: копейки в гривны, weightGrams в weight", async () => {
    fetchMock.mockResolvedValue(
      json([makeApiProduct("1", { priceKopecks: 99900, weightGrams: 300 })]),
    );
    const [product] = await getProducts();
    expect(product.price).toBe(999);
    expect(product.weight).toBe(300);
  });

  it("ошибка API 5xx пробрасывается, а не подменяется пустым списком", async () => {
    fetchMock.mockResolvedValue(json({ message: "boom" }, 500));
    await expect(getProducts()).rejects.toMatchObject({ kind: "http", status: 500 });
  });

  it("недоступный API даёт ApiError network", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await getProducts().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: "network" });
  });

  it("ответ неожиданной формы даёт ApiError invalid", async () => {
    fetchMock.mockResolvedValue(json([{ id: 1 }]));
    await expect(getProducts()).rejects.toMatchObject({ kind: "invalid" });
  });

  it("без API_URL выдаёт понятную ошибку конфигурации", async () => {
    delete process.env.API_URL;
    await expect(getProducts()).rejects.toThrow(/API_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getProductBySlug", () => {
  it("возвращает товар", async () => {
    fetchMock.mockResolvedValue(json(makeApiProduct("1", { slug: "baked-crab" })));
    const product = await getProductBySlug("baked-crab");
    expect(requestedUrl()).toBe("http://api.test/products/baked-crab");
    expect(product?.slug).toBe("baked-crab");
  });

  it("404 (нет или отключён) даёт undefined", async () => {
    fetchMock.mockResolvedValue(json({ statusCode: 404 }, 404));
    await expect(getProductBySlug("nope")).resolves.toBeUndefined();
  });

  it("другие ошибки (500, сеть) пробрасываются: это не «товар не найден»", async () => {
    fetchMock.mockResolvedValue(json({}, 500));
    await expect(getProductBySlug("x")).rejects.toMatchObject({ status: 500 });

    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getProductBySlug("x")).rejects.toMatchObject({ kind: "network" });
  });

  it("кодирует slug в пути", async () => {
    fetchMock.mockResolvedValue(json({}, 404));
    await getProductBySlug("a/b?c");
    expect(requestedUrl()).toBe("http://api.test/products/a%2Fb%3Fc");
  });
});

describe("getCategories", () => {
  it("возвращает категории API в том же порядке и без «all»", async () => {
    fetchMock.mockResolvedValue(
      json([
        { slug: "hits", label: "Хиты продаж" },
        { slug: "poke", label: "Поке" },
      ]),
    );
    const categories = await getCategories();
    expect(categories.map((c) => c.slug)).toEqual(["hits", "poke"]);
  });
});
