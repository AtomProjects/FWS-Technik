-- Add time column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT;
