-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_auctionId_fkey";

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
