-- Alter the watchlist table to add min_price column if it doesn't exist
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS min_price INTEGER DEFAULT 0;
