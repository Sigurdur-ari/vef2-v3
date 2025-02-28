-- CreateTable
CREATE TABLE "Questions" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "cat_id" INTEGER NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answers" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "q_id" INTEGER NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_q_id_fkey" FOREIGN KEY ("q_id") REFERENCES "Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
