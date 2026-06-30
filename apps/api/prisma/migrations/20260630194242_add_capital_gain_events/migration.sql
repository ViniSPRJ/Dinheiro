-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('ACOES', 'FII', 'CRIPTO', 'OUTROS');

-- CreateTable
CREATE TABLE "CapitalGainEvent" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "lotId" TEXT,
    "saleDate" DATE NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "saleValue" DECIMAL(15,2) NOT NULL,
    "costBasis" DECIMAL(15,2) NOT NULL,
    "gain" DECIMAL(15,2) NOT NULL,
    "assetClass" "AssetClass" NOT NULL,
    "exemptUnder20k" BOOLEAN NOT NULL DEFAULT false,
    "taxDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapitalGainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapitalGainEvent_investmentId_saleDate_idx" ON "CapitalGainEvent"("investmentId", "saleDate");

-- CreateIndex
CREATE INDEX "CapitalGainEvent_month_assetClass_idx" ON "CapitalGainEvent"("month", "assetClass");

-- AddForeignKey
ALTER TABLE "CapitalGainEvent" ADD CONSTRAINT "CapitalGainEvent_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalGainEvent" ADD CONSTRAINT "CapitalGainEvent_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InvestmentLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
