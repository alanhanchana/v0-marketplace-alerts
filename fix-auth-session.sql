-- This SQL script will help diagnose and fix authentication issues

-- Check if the auth schema exists and is accessible
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'auth'
);

-- Check if the auth.users table exists and is accessible
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
);

-- Check if there are any users in the auth.users table
-- This will only work if you have admin access
SELECT COUNT(*) FROM auth.users;

-- Check if the watchlist table has any records
SELECT COUNT(*) FROM watchlist;

-- Check if the watchlist table has any records without a valid user_id
SELECT COUNT(*) FROM watchlist WHERE user_id IS NULL;

-- Check if there are any watchlist records with user_ids that don't exist in auth.users
-- This will only work if you have admin access
SELECT w.id, w.keyword, w.user_id 
FROM watchlist w
LEFT JOIN auth.users u ON w.user_id = u.id
WHERE u.id IS NULL;

-- Check if RLS is enabled on the watchlist table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'watchlist';

-- List all RLS policies on the watchlist table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'watchlist';
