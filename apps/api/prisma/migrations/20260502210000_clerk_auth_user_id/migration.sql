-- AlterTable: widen auth_user_id from uuid to varchar(255) for Clerk string IDs
ALTER TABLE "core"."users" ALTER COLUMN "auth_user_id" SET DATA TYPE VARCHAR(255);
