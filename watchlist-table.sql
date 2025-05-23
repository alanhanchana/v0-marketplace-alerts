-- Run this SQL in your Supabase SQL Editor to create the watchlist table

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  zip TEXT NOT NULL,
  max_price INTEGER NOT NULL,
  min_price INTEGER DEFAULT 0,
  radius INTEGER DEFAULT 1,
  marketplace TEXT DEFAULT 'all',
  category TEXT DEFAULT 'all',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON watchlist(user_id);

-- Create a unique constraint on user_id, keyword, and marketplace
ALTER TABLE watchlist 
ADD CONSTRAINT unique_user_keyword_marketplace 
UNIQUE (user_id, keyword, marketplace);
