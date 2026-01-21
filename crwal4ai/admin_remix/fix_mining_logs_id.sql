-- Fix mining_logs id column to auto-generate UUID
-- Problem: id column is NOT NULL but no DEFAULT value
-- Solution: Use gen_random_uuid() (PostgreSQL 13+ built-in)

ALTER TABLE mining_logs 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

