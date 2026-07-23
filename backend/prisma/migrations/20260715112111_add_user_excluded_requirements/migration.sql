-- CreateTable
CREATE TABLE "user_excluded_requirements" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "worshipItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_excluded_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_excluded_requirements_userId_idx" ON "user_excluded_requirements"("userId");

-- CreateIndex
CREATE INDEX "user_excluded_requirements_worshipItemId_idx" ON "user_excluded_requirements"("worshipItemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_excluded_requirements_userId_worshipItemId_key" ON "user_excluded_requirements"("userId", "worshipItemId");

-- AddForeignKey
ALTER TABLE "user_excluded_requirements" ADD CONSTRAINT "user_excluded_requirements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_excluded_requirements" ADD CONSTRAINT "user_excluded_requirements_worshipItemId_fkey" FOREIGN KEY ("worshipItemId") REFERENCES "worship_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
