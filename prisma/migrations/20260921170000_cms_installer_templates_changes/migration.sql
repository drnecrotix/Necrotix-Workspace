CREATE TYPE "ChangeRequestStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'QUOTED', 'APPROVED', 'DECLINED', 'COMPLETED');

CREATE TABLE "SystemSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ProjectTemplate" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TemplateTask" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TemplateTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChangeRequest" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ChangeRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "requestedBy" TEXT NOT NULL,
  "estimatedAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "estimatedDays" INTEGER,
  "adminResponse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectTemplate_slug_key" ON "ProjectTemplate"("slug");
CREATE INDEX "TemplateTask_templateId_sortOrder_idx" ON "TemplateTask"("templateId", "sortOrder");
CREATE INDEX "ChangeRequest_projectId_status_createdAt_idx" ON "ChangeRequest"("projectId", "status", "createdAt");
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
