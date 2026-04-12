-- CreateTable
CREATE TABLE "traffic_cameras" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "roadName" TEXT,
    "intersection" TEXT,
    "imageUrl" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'DitchApp',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_cameras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traffic_cameras_externalId_key" ON "traffic_cameras"("externalId");

-- CreateIndex
CREATE INDEX "traffic_cameras_city_idx" ON "traffic_cameras"("city");

-- CreateIndex
CREATE INDEX "traffic_cameras_lat_lng_idx" ON "traffic_cameras"("lat", "lng");
