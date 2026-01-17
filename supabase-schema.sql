-- =====================================================
-- SUPABASE SCHEMA FOR PHYSIOTHERAPY INVENTORY TRACKER
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- the database tables and Row Level Security (RLS)
-- =====================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups by user
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
    ON public.categories
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
    ON public.categories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0 NOT NULL CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for faster lookups
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_category_id ON public.items(category_id);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items
CREATE POLICY "Users can view their own items"
    ON public.items
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
    ON public.items
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
    ON public.items
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
    ON public.items
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- STOCK MOVEMENTS TABLE (Audit Log)
-- =====================================================
CREATE TYPE movement_type AS ENUM ('PURCHASE', 'SALE');

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    type movement_type NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for faster lookups
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_item_id ON public.stock_movements(item_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Users can view their own stock movements"
    ON public.stock_movements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock movements"
    ON public.stock_movements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Note: Stock movements should not be updated or deleted (audit trail)
-- If you need to correct a mistake, create a reverse movement

-- =====================================================
-- OPTIONAL: Updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to items
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - Run after creating tables)
-- Replace 'YOUR_USER_ID' with actual user UUID after signup
-- =====================================================
-- INSERT INTO public.categories (user_id, name) VALUES
--     ('YOUR_USER_ID', 'Needle Tips'),
--     ('YOUR_USER_ID', 'Electrodes'),
--     ('YOUR_USER_ID', 'Bandages'),
--     ('YOUR_USER_ID', 'Therapy Gels');
