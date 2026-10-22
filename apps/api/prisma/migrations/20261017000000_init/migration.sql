-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'COURIER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "composition" TEXT NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "priceKopecks" INTEGER NOT NULL,
    "calories" INTEGER,
    "protein" INTEGER,
    "fat" INTEGER,
    "carbs" INTEGER,
    "imageSrc" TEXT NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(30) NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "street" VARCHAR(100),
    "house" VARCHAR(20),
    "apartment" VARCHAR(20),
    "floor" VARCHAR(10),
    "intercom" VARCHAR(20),
    "comment" VARCHAR(500),
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'UAH',
    "subtotalKopecks" INTEGER NOT NULL,
    "deliveryFeeKopecks" INTEGER NOT NULL,
    "totalKopecks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productWeightGrams" INTEGER NOT NULL,
    "unitPriceKopecks" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProduct" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_isActive_sortOrder_idx" ON "Product"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CHECK-ограничения (Prisma не умеет их описывать в schema.prisma, поэтому добавлены вручную)

-- AddCheck
ALTER TABLE "Product" ADD CONSTRAINT "Product_priceKopecks_nonnegative" CHECK ("priceKopecks" >= 0);

-- AddCheck
ALTER TABLE "Product" ADD CONSTRAINT "Product_weightGrams_positive" CHECK ("weightGrams" > 0);

-- AddCheck
ALTER TABLE "Order" ADD CONSTRAINT "Order_amounts_nonnegative" CHECK (
    "subtotalKopecks" >= 0 AND "deliveryFeeKopecks" >= 0 AND "totalKopecks" >= 0
);

-- AddCheck
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_matches_parts" CHECK (
    "totalKopecks" = "subtotalKopecks" + "deliveryFeeKopecks"
);

-- AddCheck
ALTER TABLE "Order" ADD CONSTRAINT "Order_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');

-- AddCheck: при курьерской доставке улица и дом обязательны (COALESCE: NULL не должен проходить проверку)
ALTER TABLE "Order" ADD CONSTRAINT "Order_courier_address_required" CHECK (
    "deliveryMethod" <> 'COURIER'
    OR (COALESCE(btrim("street"), '') <> '' AND COALESCE(btrim("house"), '') <> '')
);

-- AddCheck
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_range" CHECK ("quantity" BETWEEN 1 AND 99);

-- AddCheck
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPriceKopecks_nonnegative" CHECK ("unitPriceKopecks" >= 0);

-- AddCheck
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productWeightGrams_positive" CHECK ("productWeightGrams" > 0);
