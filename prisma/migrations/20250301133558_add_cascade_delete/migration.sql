-- DropForeignKey
ALTER TABLE "Answers" DROP CONSTRAINT "Answers_q_id_fkey";

-- DropForeignKey
ALTER TABLE "Questions" DROP CONSTRAINT "Questions_cat_id_fkey";

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "Categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_q_id_fkey" FOREIGN KEY ("q_id") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
