-- AlterTable
ALTER TABLE "push_subscriptions" ADD COLUMN "incidentTypeFilter" TEXT,
ADD COLUMN "severityMin" INTEGER,
ADD COLUMN "quietHoursStart" TEXT,
ADD COLUMN "quietHoursEnd" TEXT,
ADD COLUMN "cityId" TEXT,
ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "minTowScore" INTEGER;

-- CreateTable
CREATE TABLE "incident_snapshots" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "iconCategory" INTEGER NOT NULL,
    "magnitudeOfDelay" INTEGER,
    "description" TEXT,
    "from_" TEXT,
    "to_" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_snapshots_city_fetchedAt_idx" ON "incident_snapshots"("city", "fetchedAt");

-- CreateIndex
CREATE INDEX "incident_snapshots_externalId_fetchedAt_idx" ON "incident_snapshots"("externalId", "fetchedAt");
