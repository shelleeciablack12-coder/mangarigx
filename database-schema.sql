-- MangaRigX Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create manga_library table (permanent storage)
CREATE TABLE IF NOT EXISTS manga_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mangadex_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'unknown',
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- For future user system
    manga_id TEXT NOT NULL REFERENCES manga_library(mangadex_id) ON DELETE CASCADE,
    chapter_id TEXT, -- Optional specific chapter bookmark
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, manga_id, chapter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manga_library_title ON manga_library USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_manga_library_tags ON manga_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_manga_library_status ON manga_library(status);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_manga_id ON user_bookmarks(manga_id);

-- Enable Row Level Security (RLS)
ALTER TABLE manga_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later)
DROP POLICY IF EXISTS "Allow all operations on manga_library" ON manga_library;
CREATE POLICY "Allow all operations on manga_library" ON manga_library FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on user_bookmarks" ON user_bookmarks;
CREATE POLICY "Allow all operations on user_bookmarks" ON user_bookmarks FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for manga_library
DROP TRIGGER IF EXISTS update_manga_library_updated_at ON manga_library;
CREATE TRIGGER update_manga_library_updated_at
    BEFORE UPDATE ON manga_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();