CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  category TEXT NOT NULL,
  cable_type TEXT,
  cable_length NUMERIC,
  has_dmx BOOLEAN,
  is_functional BOOLEAN DEFAULT TRUE,
  has_tuv BOOLEAN DEFAULT FALSE,
  marking TEXT NOT NULL,
  location TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
