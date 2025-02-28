-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to the inventory table if they don't exist
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cable_length NUMERIC;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_functional BOOLEAN DEFAULT TRUE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS has_tuv BOOLEAN DEFAULT FALSE;

-- Make sure the table has RLS enabled and realtime enabled
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anyone with the anon key (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'inventory' AND policyname = 'Allow all operations for all users'
  ) THEN
    CREATE POLICY "Allow all operations for all users" ON inventory
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Enable realtime for this table
ALTER TABLE inventory REPLICA IDENTITY FULL;
