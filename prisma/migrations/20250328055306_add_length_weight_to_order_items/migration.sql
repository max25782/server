-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "length_meter" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "weight_per_meter" DOUBLE PRECISION DEFAULT 0;
