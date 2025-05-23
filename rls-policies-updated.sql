-- First, let's drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON watchlist;

-- Disable RLS temporarily to recreate policies
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create more permissive RLS policies for authenticated users

-- Policy for SELECT: Allow authenticated users to view their own watchlist items
CREATE POLICY "Enable read access for authenticated users" ON watchlist
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for INSERT: Allow authenticated users to insert their own watchlist items
CREATE POLICY "Enable insert access for authenticated users" ON watchlist
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Allow authenticated users to update their own watchlist items
CREATE POLICY "Enable update access for authenticated users" ON watchlist
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Allow authenticated users to delete their own watchlist items
CREATE POLICY "Enable delete access for authenticated users" ON watchlist
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON watchlist TO authenticated;
GRANT ALL ON watchlist TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Also grant sequence permissions if using auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
