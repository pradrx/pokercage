-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "cashapp" TEXT,
ADD COLUMN     "paypal" TEXT,
ADD COLUMN     "venmo" TEXT,
ADD COLUMN     "zelle" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cashapp" TEXT,
ADD COLUMN     "paypal" TEXT,
ADD COLUMN     "venmo" TEXT,
ADD COLUMN     "zelle" TEXT;
