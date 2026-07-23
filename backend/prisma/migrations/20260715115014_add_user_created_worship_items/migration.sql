-- AlterTable
ALTER TABLE "worship_items" ADD COLUMN     "createdByUserId" UUID;

-- CreateIndex
CREATE INDEX "worship_items_createdByUserId_idx" ON "worship_items"("createdByUserId");

-- AddForeignKey
ALTER TABLE "worship_items" ADD CONSTRAINT "worship_items_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
