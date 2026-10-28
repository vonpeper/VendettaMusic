-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "BookingRequest" ADD COLUMN "closedAt" DATETIME;

-- AlterTable
ALTER TABLE "GlobalConfig" ADD COLUMN "googleAnalyticsMeasurementId" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN "googleAnalyticsPropertyId" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN "googleSearchConsoleSiteUrl" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN "googleSiteVerification" TEXT;
