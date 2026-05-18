-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizQuestion_category_active_idx" ON "QuizQuestion"("category", "active");
