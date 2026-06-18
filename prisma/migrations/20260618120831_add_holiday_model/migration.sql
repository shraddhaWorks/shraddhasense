-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC_HOLIDAY', 'COMPANY_HOLIDAY', 'PERSONAL_HOLIDAY');

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "HolidayType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_adminId_date_key" ON "Holiday"("adminId", "date");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
