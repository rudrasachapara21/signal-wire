-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "reportData" TEXT NOT NULL,
    "brandProfile" TEXT,
    "refinedFromId" TEXT,
    "rating" TEXT,
    "feedbackNote" TEXT,
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorIntro" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "sourcesFound" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorIntro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorIntro_name_niche_key" ON "CreatorIntro"("name", "niche");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_refinedFromId_fkey" FOREIGN KEY ("refinedFromId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
