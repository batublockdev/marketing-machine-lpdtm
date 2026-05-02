-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "mediaFiles" TEXT,
    "caption" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectReason" TEXT,
    "platformPostId" TEXT,
    "publishedUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "publishedAt" DATETIME,
    "statsUpdatedAt" DATETIME
);
INSERT INTO "new_Post" ("approvedAt", "botId", "caption", "createdAt", "id", "mediaFiles", "platform", "publishedAt", "rejectReason", "status", "tags", "videoPath") SELECT "approvedAt", "botId", "caption", "createdAt", "id", "mediaFiles", "platform", "publishedAt", "rejectReason", "status", "tags", "videoPath" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_botId_idx" ON "Post"("botId");
CREATE INDEX "Post_platform_idx" ON "Post"("platform");
CREATE INDEX "Post_status_idx" ON "Post"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
