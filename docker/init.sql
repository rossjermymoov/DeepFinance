-- DeepFinance Database Initialisation
-- This runs on first container creation only

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;      -- Core accounting entities
CREATE SCHEMA IF NOT EXISTS audit;     -- Audit trail
CREATE SCHEMA IF NOT EXISTS config;    -- System configuration and templates

-- Row-level security requires tables to exist first
-- Migrations handle table creation and RLS policies
