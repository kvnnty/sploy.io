-- Create custom schemas (keep app data separate from auth schema)
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS audit;
