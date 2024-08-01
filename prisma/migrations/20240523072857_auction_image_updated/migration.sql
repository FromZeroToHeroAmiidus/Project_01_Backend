-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "image" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "status" SET DEFAULT 'In progress';
