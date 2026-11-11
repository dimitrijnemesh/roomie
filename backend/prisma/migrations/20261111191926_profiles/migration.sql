-- CreateTable
CREATE TABLE "profiles" (
    "userId" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "age" INTEGER,
    "institute" TEXT,
    "course" INTEGER,
    "bio" TEXT,
    "habits" JSONB,
    "looking" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
