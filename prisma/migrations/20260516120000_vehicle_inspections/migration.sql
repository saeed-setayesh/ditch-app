-- DVIR / vehicle inspections

CREATE TABLE "inspection_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inspection_template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checklistSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fleet_vehicles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'truck',
    "plate" TEXT,
    "vin" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "defaultInspectionTemplateVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_inspections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fleetVehicleId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "odometerKm" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "locationLabel" TEXT,
    "overallSeverity" TEXT,

    CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "itemIndex" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "severity" TEXT,
    "defectLabel" TEXT,
    "notes" TEXT,

    CONSTRAINT "vehicle_inspection_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inspection_attachments" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemId" TEXT,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inspection_template_versions_templateId_version_key" ON "inspection_template_versions"("templateId", "version");

CREATE UNIQUE INDEX "fleet_vehicles_organizationId_unitNumber_key" ON "fleet_vehicles"("organizationId", "unitNumber");

CREATE INDEX "inspection_templates_organizationId_idx" ON "inspection_templates"("organizationId");

CREATE INDEX "inspection_template_versions_templateId_idx" ON "inspection_template_versions"("templateId");

CREATE INDEX "fleet_vehicles_organizationId_idx" ON "fleet_vehicles"("organizationId");

CREATE INDEX "vehicle_inspections_organizationId_finalizedAt_idx" ON "vehicle_inspections"("organizationId", "finalizedAt");

CREATE INDEX "vehicle_inspections_fleetVehicleId_finalizedAt_idx" ON "vehicle_inspections"("fleetVehicleId", "finalizedAt");

CREATE INDEX "vehicle_inspections_driverUserId_finalizedAt_idx" ON "vehicle_inspections"("driverUserId", "finalizedAt");

CREATE INDEX "vehicle_inspection_items_inspectionId_idx" ON "vehicle_inspection_items"("inspectionId");

CREATE INDEX "inspection_attachments_inspectionId_idx" ON "inspection_attachments"("inspectionId");

ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inspection_template_versions" ADD CONSTRAINT "inspection_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_defaultInspectionTemplateVersionId_fkey" FOREIGN KEY ("defaultInspectionTemplateVersionId") REFERENCES "inspection_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_fleetVehicleId_fkey" FOREIGN KEY ("fleetVehicleId") REFERENCES "fleet_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "inspection_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicle_inspection_items" ADD CONSTRAINT "vehicle_inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "vehicle_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inspection_attachments" ADD CONSTRAINT "inspection_attachments_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "vehicle_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inspection_attachments" ADD CONSTRAINT "inspection_attachments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "vehicle_inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
