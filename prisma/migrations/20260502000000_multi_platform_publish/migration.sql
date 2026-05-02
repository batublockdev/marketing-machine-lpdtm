-- Add new columns to Post (without dropping existing ones)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "targetAccount" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "tiktokPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "tiktokPostId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "tiktokPublishedAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "instagramPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "instagramPostId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "instagramPublishedAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "instagramPublishReady" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);

-- Create new indexes
CREATE INDEX IF NOT EXISTS "Post_tiktokPublished_idx" ON "Post"("tiktokPublished");
CREATE INDEX IF NOT EXISTS "Post_instagramPublished_idx" ON "Post"("instagramPublished");
CREATE INDEX IF NOT EXISTS "Post_instagramPublishReady_idx" ON "Post"("instagramPublishReady");

-- Recreate Stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Stats" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Stats_botId_platform_key" ON "Stats"("botId", "platform");