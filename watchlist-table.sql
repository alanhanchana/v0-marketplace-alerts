-- Run this SQL in your Supabase SQL Editor to create the watchlist table

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  zip TEXT NOT NULL,
  max_price INTEGER NOT NULL,
  radius INTEGER DEFAULT 1,
  marketplace TEXT DEFAULT 'craigslist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add some sample data
INSERT INTO watchlist (keyword, zip, max_price, radius, marketplace)
VALUES 
  ('iPhone 13', '10001', 500, 5, 'craigslist'),
  ('PlayStation 5', '10002', 400, 10, 'facebook'),
  ('Vintage Coffee Table', '10003', 100, 15, 'craigslist'),
  ('Mountain Bike', '10004', 300, 20, 'facebook');
