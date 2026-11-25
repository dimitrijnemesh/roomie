-- Codes get a purpose (verify | reset); existing rows are sign-up codes.
ALTER TABLE "email_codes" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'verify';
ALTER TABLE "email_codes" DROP CONSTRAINT "email_codes_pkey";
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_pkey" PRIMARY KEY ("email", "purpose");
