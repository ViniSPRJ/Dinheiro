-- CreateEnum
CREATE TYPE "LotSide" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "currentPrice" DECIMAL(15,4),
ADD COLUMN     "priceUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvestmentLot" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "side" "LotSide" NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "fees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tradeDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentLot_investmentId_tradeDate_idx" ON "InvestmentLot"("investmentId", "tradeDate");

-- AddForeignKey
ALTER TABLE "InvestmentLot" ADD CONSTRAINT "InvestmentLot_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one synthetic BUY lot per existing Investment row, so quantity/averagePrice
-- carry over exactly as recomputeInvestmentFromLots would derive them going forward.
-- Non-share assets (fixed income, property) have no quantity today -> treated as 1 unit.
INSERT INTO "InvestmentLot" ("id", "investmentId", "side", "quantity", "unitPrice", "fees", "tradeDate", "notes", "createdAt")
SELECT
    substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 25),
    "id",
    'BUY'::"LotSide",
    COALESCE("quantity", 1),
    "averagePrice",
    0,
    "acquisitionDate",
    'Backfilled from pre-lot Investment row',
    CURRENT_TIMESTAMP
FROM "Investment";
