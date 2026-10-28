-- Переход денежной модели с UAH (копейки) на KZT (тиыны) с нейтральными названиями полей.
-- Только переименования и смена значения по умолчанию: таблицы не пересоздаются, данные не пересчитываются.
--
-- ВАЖНО: числа в существующих строках остаются как есть (в копейках гривны они были бы неверно
-- прочитаны как тиыны). Для товаров это исправляет повторный запуск основного seed (upsert цен).
-- Заказы автоматически НЕ переинтерпретируются: если они есть в валюте UAH, миграция останавливается.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Order" WHERE "currency" <> 'KZT') THEN
    RAISE EXCEPTION 'В таблице "Order" есть заказы не в KZT. Суммы нельзя пересчитать автоматически: решите вопрос с историческими данными вручную.';
  END IF;
END $$;

-- Product
ALTER TABLE "Product" RENAME COLUMN "priceKopecks" TO "priceMinorUnits";
ALTER TABLE "Product" RENAME CONSTRAINT "Product_priceKopecks_nonnegative" TO "Product_priceMinorUnits_nonnegative";

-- Order
ALTER TABLE "Order" RENAME COLUMN "subtotalKopecks" TO "subtotalMinorUnits";
ALTER TABLE "Order" RENAME COLUMN "deliveryFeeKopecks" TO "deliveryFeeMinorUnits";
ALTER TABLE "Order" RENAME COLUMN "totalKopecks" TO "totalMinorUnits";
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'KZT';

-- OrderItem
ALTER TABLE "OrderItem" RENAME COLUMN "unitPriceKopecks" TO "unitPriceMinorUnits";
ALTER TABLE "OrderItem" RENAME CONSTRAINT "OrderItem_unitPriceKopecks_nonnegative" TO "OrderItem_unitPriceMinorUnits_nonnegative";
