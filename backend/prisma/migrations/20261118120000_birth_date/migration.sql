-- Store the date of birth instead of a fixed age (age is calculated, so it grows every year).
-- Old "age" values can't be turned into a date, so those profiles will ask for the date again.
ALTER TABLE "profiles" ADD COLUMN "birthDate" DATE;
ALTER TABLE "profiles" DROP COLUMN "age";
