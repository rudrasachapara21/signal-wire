-- CreateTable
CREATE TABLE "CreatorIntro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "sourcesFound" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorIntro_name_niche_key" ON "CreatorIntro"("name", "niche");
