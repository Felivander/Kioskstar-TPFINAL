-- Migration was already applied in 20260512133136
-- This migration updates password_resets schema to use token/usedAt instead of code/used

-- Drop old columns and add new ones (safe if already done)
DO $$
BEGIN
  -- Add token column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='password_resets' AND column_name='token') THEN
    ALTER TABLE "password_resets" ADD COLUMN "token" TEXT;
  END IF;

  -- Add usedAt column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='password_resets' AND column_name='usedAt') THEN
    ALTER TABLE "password_resets" ADD COLUMN "usedAt" TIMESTAMP(3);
  END IF;

  -- Drop old columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='password_resets' AND column_name='code') THEN
    ALTER TABLE "password_resets" DROP COLUMN "code";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='password_resets' AND column_name='used') THEN
    ALTER TABLE "password_resets" DROP COLUMN "used";
  END IF;
END $$;

-- Make token NOT NULL and UNIQUE (if not already)
ALTER TABLE "password_resets" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");
