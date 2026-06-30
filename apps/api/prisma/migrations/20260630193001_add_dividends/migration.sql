-- CreateEnum
CREATE TYPE "DividendType" AS ENUM ('DIVIDENDO', 'JCP', 'RENDIMENTO');

-- CreateTable
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "type" "DividendType" NOT NULL,
    "amountPerShare" DECIMAL(15,6) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "exDate" DATE,
    "withholdingTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dividend_investmentId_paymentDate_idx" ON "Dividend"("investmentId", "paymentDate");

-- AddForeignKey
ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
