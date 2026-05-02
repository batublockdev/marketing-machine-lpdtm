-- DropIndex
DROP INDEX IF EXISTS "Post_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "Stats_botId_platform_key";

-- Drop existing columns from Post
ALTER TABLE "Post" DROP COLUMN IF EXISTS "platformPostId";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "publishedUrl";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "views";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "likes";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "shares";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "comments";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "publishedAt";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "statsUpdatedAt";

-- Add new columns to Post
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

-- Recreate status index
CREATE INDEX IF NOT EXISTS "Post_status_idx" ON "Post"("status");

-- Drop Stats table
DROP TABLE IF EXISTS "Stats";