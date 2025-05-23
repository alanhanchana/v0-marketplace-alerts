-- Enable RLS on the watchlist table (if not already enabled)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON watchlist;

-- Create RLS policies for the watchlist table

-- Policy for SELECT: Users can only view their own watchlist items
CREATE POLICY "Users can view their own watchlist items" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only insert watchlist items for themselves
CREATE POLICY "Users can insert their own watchlist items" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update their own watchlist items
CREATE POLICY "Users can update their own watchlist items" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist items" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON watchlist TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
