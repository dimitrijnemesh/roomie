-- Study details: the free-text "institute" becomes "faculty" (kept), plus degree, specialty, specialization.
ALTER TABLE "profiles" RENAME COLUMN "institute" TO "faculty";
ALTER TABLE "profiles" ADD COLUMN "degree" TEXT,
                       ADD COLUMN "specialty" TEXT,
                       ADD COLUMN "specialization" TEXT;
