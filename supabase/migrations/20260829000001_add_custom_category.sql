-- Add custom_category column to shops table if not exists
ALTER TABLE shops ADD COLUMN IF NOT EXISTS custom_category TEXT;
