import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/http";
import { makeApiProduct } from "@/test-utils/fixtures";

// "use cache" в тестах — просто строка; функции кэша Next подменены заглушками
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const {
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProductSlugsForPrerender,
  getProductsPage,
  getRecommendedProducts,
  getRelatedProducts,
} = await import("./catalog");

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

const page = (items: unknown[] = [], nextCursor: string | null = null) => ({ items, nextCursor });

describe("API_PREFIX (Vercel Services)", () => {
  afterEach(() => {
    delete process.env.API_PREFIX;
  });

  it("добавляется к адресу API: внутренний URL binding + /api", async () => {
    process.env.API_URL = "https://internal.test";
    process.env.API_PREFIX = "/api";
    fetchMock.mockResolvedValue(json(page()));
    await getProductsPage();
    expect(requestedUrl()).toBe("https://internal.test/api/products?limit=12");

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(json([]));
    await getRelatedProducts("a");
    expect(requestedUrl()).toBe("https://internal.test/api/products/a/related?limit=4");
  });

  it("без API_PREFIX (локально) адрес не меняется", async () => {
    fetchMock.mockResolvedValue(json(page()));
    await getProductsPage();
    expect(requestedUrl()).toBe("http://api.test/products?limit=12");
  });
});

describe("getProductsPage", () => {
  it("«Всё» запрашивает /products без параметра category, но с размером страницы", async () => {
    fetchMock.mockResolvedValue(json(page([makeApiProduct("1")])));

    await getProductsPage();
    expect(requestedUrl()).toBe("http://api.test/products?limit=12");

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(json(page()));
    await getProductsPage({ category: "all" });
    expect(requestedUrl()).toBe("http://api.test/products?limit=12");
    expect(requestedUrl()).not.toContain("category");
  });

  it("реальная категория и курсор передаются параметрами", async () => {
    fetchMock.mockResolvedValue(json(page()));
    await getProductsPage({ category: "hits", cursor: "abc_-1" });
    expect(requestedUrl()).toBe("http://api.test/products?category=hits&limit=12&cursor=abc_-1");
  });

  it("возвращает товары и курсор: тиыны в тенге, weightGrams в weight", async () => {
    fetchMock.mockResolvedValue(
      json(page([makeApiProduct("1", { priceMinorUnits: 99900, weightGrams: 300 })], "next")),
    );
    const result = await getProductsPage();
    expect(result.items[0].price).toBe(999);
    expect(result.items[0].weight).toBe(300);
    expect(result.nextCursor).toBe("next");
  });

  it("ошибка API 5xx пробрасывается, а не подменяется пустым списком", async () => {
    fetchMock.mockResolvedValue(json({ message: "boom" }, 500));
    await expect(getProductsPage()).rejects.toMatchObject({ kind: "http", status: 500 });
  });

  it("недоступный API даёт ApiError network", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await getProductsPage().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: "network" });
  });

  it("старый формат (массив) и неожиданная форма — ApiError invalid", async () => {
    fetchMock.mockResolvedValue(json([makeApiProduct("1")]));
    await expect(getProductsPage()).rejects.toMatchObject({ kind: "invalid" });

    fetchMock.mockResolvedValue(json({ items: [{ id: 1 }], nextCursor: null }));
    await expect(getProductsPage()).rejects.toMatchObject({ kind: "invalid" });
  });

  it("без API_URL выдаёт понятную ошибку конфигурации", async () => {
    delete process.env.API_URL;
    await expect(getProductsPage()).rejects.toThrow(/API_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ограниченные выборки витрин", () => {
  it("главная: не больше 8 товаров категории hits, один запрос", async () => {
    fetchMock.mockResolvedValue(json(page([makeApiProduct("1")])));
    const products = await getFeaturedProducts();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl()).toBe("http://api.test/products?category=hits&limit=8");
    expect(products).toHaveLength(1);
  });

  it("checkout: ограниченная выборка из 8 товаров без категории", async () => {
    fetchMock.mockResolvedValue(json(page([makeApiProduct("1")])));
    await getRecommendedProducts();
    expect(requestedUrl()).toBe("http://api.test/products?limit=8");
  });

  it("страница товара: рекомендации запрашиваются у API с лимитом 4", async () => {
    fetchMock.mockResolvedValue(json([makeApiProduct("2"), makeApiProduct("3")]));
    const related = await getRelatedProducts("baked-crab");
    expect(requestedUrl()).toBe("http://api.test/products/baked-crab/related?limit=4");
    expect(related.map((p) => p.id)).toEqual(["2", "3"]);
  });

  it("рекомендации: slug кодируется, ошибка API пробрасывается", async () => {
    fetchMock.mockResolvedValue(json({}, 404));
    await expect(getRelatedProducts("a/b")).rejects.toMatchObject({ status: 404 });
    expect(requestedUrl()).toBe("http://api.test/products/a%2Fb/related?limit=4");
  });

  it("предварительная сборка берёт ограниченный список slug (первые 50), а не весь каталог", async () => {
    fetchMock.mockResolvedValue(json(page([makeApiProduct("1", { slug: "a" }), makeApiProduct("2", { slug: "b" })])));
    await expect(getProductSlugsForPrerender()).resolves.toEqual(["a", "b"]);
    expect(requestedUrl()).toBe("http://api.test/products?limit=50");
  });

  it("ни одна из функций не запрашивает /products без limit", async () => {
    fetchMock.mockImplementation(async () => json(page()));
    await getProductsPage();
    await getFeaturedProducts();
    await getRecommendedProducts();
    await getProductSlugsForPrerender();
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).toContain("limit=");
    }
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
