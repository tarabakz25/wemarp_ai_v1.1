-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "Role" AS ENUM ('user', 'admin');
CREATE TYPE "Visibility" AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE "GenStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE "VersionStatus" AS ENUM ('draft', 'generated', 'edited');
CREATE TYPE "ExportType" AS ENUM ('pdf', 'png', 'html', 'md');
CREATE TYPE "ExportStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- User table (synced with Supabase Auth)
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY,
  "username" TEXT UNIQUE,
  "displayName" TEXT,
  "avatarUrl" TEXT,
  "role" "Role" DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Project table
CREATE TABLE "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "visibility" "Visibility" DEFAULT 'private' NOT NULL,
  "currentVersionId" UUID UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "ownerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "Project_visibility_idx" ON "Project"("visibility");

-- Version table
CREATE TABLE "Version" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "versionNo" INTEGER NOT NULL,
  "status" "VersionStatus" DEFAULT 'generated' NOT NULL,
  "llmModel" TEXT,
  "promptSnapshot" TEXT,
  "marpMd" TEXT NOT NULL,
  "htmlCache" TEXT,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE("projectId", "versionNo")
);

CREATE INDEX "Version_createdAt_idx" ON "Version"("createdAt" DESC);

-- Add foreign key for currentVersionId after Version table is created
ALTER TABLE "Project" 
  ADD CONSTRAINT "Project_currentVersionId_fkey" 
  FOREIGN KEY ("currentVersionId") REFERENCES "Version"("id") ON DELETE SET NULL;

-- Generation table (LLM usage logs)
CREATE TABLE "Generation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID REFERENCES "Project"("id") ON DELETE CASCADE,
  "versionId" UUID REFERENCES "Version"("id") ON DELETE CASCADE,
  "status" "GenStatus" DEFAULT 'queued' NOT NULL,
  "model" TEXT NOT NULL,
  "prompt" TEXT,
  "response" TEXT,
  "tokenUsage" JSONB,
  "costCents" INTEGER,
  "metadata" JSONB,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX "Generation_projectId_createdAt_idx" ON "Generation"("projectId", "createdAt" DESC);

-- Export table (PNG/PDF outputs)
CREATE TABLE "Export" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "versionId" UUID NOT NULL REFERENCES "Version"("id") ON DELETE CASCADE,
  "type" "ExportType" NOT NULL,
  "status" "ExportStatus" DEFAULT 'queued' NOT NULL,
  "storagePath" TEXT,
  "sizeBytes" BIGINT,
  "pageCount" INTEGER,
  "errorText" TEXT,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX "Export_versionId_createdAt_idx" ON "Export"("versionId", "createdAt" DESC);

-- Tag table
CREATE TABLE "Tag" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL
);

-- ProjectTag junction table
CREATE TABLE "ProjectTag" (
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "tagId" BIGINT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("projectId", "tagId")
);

-- RLS (Row Level Security) Policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Version" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Generation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Export" ENABLE ROW LEVEL SECURITY;

-- User policies: users can only see/update their own profile
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Project policies: owners can CRUD, public projects are viewable by all
CREATE POLICY "Project owners have full access" ON "Project"
  FOR ALL USING (auth.uid() = "ownerId");

CREATE POLICY "Public projects are viewable by all" ON "Project"
  FOR SELECT USING ("visibility" = 'public');

-- Version policies: inherit from project ownership
CREATE POLICY "Version owners have full access" ON "Version"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project"."id" = "Version"."projectId" 
      AND "Project"."ownerId" = auth.uid()
    )
  );

CREATE POLICY "Public project versions are viewable" ON "Version"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project"."id" = "Version"."projectId" 
      AND "Project"."visibility" = 'public'
    )
  );

-- Generation policies: inherit from project ownership
CREATE POLICY "Generation owners have full access" ON "Generation"
  FOR ALL USING (
    "projectId" IS NULL OR
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project"."id" = "Generation"."projectId" 
      AND "Project"."ownerId" = auth.uid()
    )
  );

-- Export policies: inherit from version/project ownership
CREATE POLICY "Export owners have full access" ON "Export"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Version" v
      JOIN "Project" p ON p."id" = v."projectId"
      WHERE v."id" = "Export"."versionId" 
      AND p."ownerId" = auth.uid()
    )
  );

-- Function to sync auth.users with User table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, "displayName", "avatarUrl", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create User record when auth.users is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
