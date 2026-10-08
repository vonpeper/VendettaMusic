-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN "customMusicianPay" REAL;
ALTER TABLE "BookingRequest" ADD COLUMN "customStaffPay" REAL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "customMusicianPay" REAL;
ALTER TABLE "Event" ADD COLUMN "customStaffPay" REAL;
