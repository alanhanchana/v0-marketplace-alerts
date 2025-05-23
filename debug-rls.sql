-- Debug script to check RLS policies and permissions
-- Run this in your Supabase SQL Editor to diagnose RLS issues

-- Check if RLS is enabled on the watchlist table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'watchlist';

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'watchlist';

-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'watchlist';

-- Check if the table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'watchlist' 
ORDER BY ordinal_position;

-- Test if we can query the table (this should work if RLS is properly configured)
-- Note: This will only work if you're authenticated
SELECT COUNT(*) as total_records FROM watchlist;
