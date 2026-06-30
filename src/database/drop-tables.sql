-- =============================================
-- DROP TABLES
-- =============================================

-- 1. Drop tables with foreign keys referencing lessons/classes
DROP TABLE IF EXISTS "vocabularies" CASCADE;
DROP TABLE IF EXISTS "grammars" CASCADE;
DROP TABLE IF EXISTS "kanjis" CASCADE;

DROP TABLE IF EXISTS "class_students" CASCADE;
DROP TABLE IF EXISTS "class_schedules" CASCADE;
DROP TABLE IF EXISTS "class_announcements" CASCADE;

-- 1.5. Drop assignment-related tables
DROP TABLE IF EXISTS "assignment_attachments" CASCADE;
DROP TABLE IF EXISTS "assignment_submission_attachments" CASCADE;
DROP TABLE IF EXISTS "assignment_submissions" CASCADE;
DROP TABLE IF EXISTS "assignments" CASCADE;

-- 2. Drop intermediate dependent tables
DROP TABLE IF EXISTS "lessons" CASCADE;
DROP TABLE IF EXISTS "classes" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;

-- 3. Drop chat-related tables
DROP TABLE IF EXISTS "message_attachments" CASCADE;
DROP TABLE IF EXISTS "message_pins" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "participants" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;

-- 4. Drop other dependent/system tables
DROP TABLE IF EXISTS "account_history" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "email_logs" CASCADE;
DROP TABLE IF EXISTS "system_configs" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;

-- 5. Drop base tables
DROP TABLE IF EXISTS "users" CASCADE;
