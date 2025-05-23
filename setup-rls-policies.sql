-- Reset the database schema for watchlist
DROP TABLE IF EXISTS watchlist;

-- Create the watchlist table with proper constraints
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  max_price INTEGER NOT NULL,
  min_price INTEGER DEFAULT 0,
  zip TEXT NOT NULL,
  radius INTEGER DEFAULT 1,
  marketplace TEXT DEFAULT 'craigslist',
  category TEXT DEFAULT 'all',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_keyword_marketplace UNIQUE (user_id, keyword, marketplace)
);

-- Create indexes for better performance
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_marketplace ON watchlist(marketplace);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON watchlist;

-- Create strict RLS policies with explicit type casting
-- Policy for SELECT: Users can only view their own watchlist items
CREATE POLICY "Users can view their own watchlist items" 
ON watchlist FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- Policy for INSERT: Users can only insert watchlist items for themselves
CREATE POLICY "Users can insert their own watchlist items" 
ON watchlist FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy for UPDATE: Users can only update their own watchlist items
CREATE POLICY "Users can update their own watchlist items" 
ON watchlist FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- Policy for DELETE: Users can only delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist items" 
ON watchlist FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON watchlist TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies are set up correctly
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'watchlist';
