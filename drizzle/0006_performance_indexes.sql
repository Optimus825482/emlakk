-- Migration: Performance Optimization Indexes
-- Created: 2025-01-XX
-- Purpose: Add indexes to improve query performance for notifications and related tables

-- Notifications table indexes (4.1s → <500ms)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- Appointments table indexes (for admin/counts optimization)
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status) WHERE status = 'pending';

-- Contacts table indexes (for admin/counts optimization)
CREATE INDEX IF NOT EXISTS idx_contacts_status 
ON contacts(status) WHERE status = 'new';

-- Valuations table indexes (for admin/counts optimization)
CREATE INDEX IF NOT EXISTS idx_valuations_estimated_value 
ON valuations(estimated_value) WHERE estimated_value IS NULL;

-- Composite index for notifications filtering
CREATE INDEX IF NOT EXISTS idx_notifications_read_created 
ON notifications(is_read, created_at DESC);

-- Comment for documentation
COMMENT ON INDEX idx_notifications_created_at IS 'Optimizes ORDER BY created_at DESC queries';
COMMENT ON INDEX idx_notifications_is_read IS 'Partial index for unread notifications count';
COMMENT ON INDEX idx_appointments_status IS 'Partial index for pending appointments count';
COMMENT ON INDEX idx_contacts_status IS 'Partial index for new messages count';
COMMENT ON INDEX idx_valuations_estimated_value IS 'Partial index for pending valuations count';
