-- First, let's completely reset the RLS policies to ensure proper user isolation
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON watchlist;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON watchlist;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON watchlist;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON watchlist;

-- Disable RLS temporarily
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies that properly isolate user data
CREATE POLICY "Users can only see their own watchlist items" ON watchlist
    FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can only insert their own watchlist items" ON watchlist
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can only update their own watchlist items" ON watchlist
    FOR UPDATE 
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can only delete their own watchlist items" ON watchlist
    FOR DELETE 
    USING (auth.uid()::text = user_id::text);

-- Ensure proper permissions
GRANT ALL ON watchlist TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the isolation by checking if policies are working
-- This should return 0 if you're not authenticated, or only your records if you are
SELECT COUNT(*) as my_records FROM watchlist;
