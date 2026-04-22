-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to policies table
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS embedding vector(384); -- 384 dimensions for all-MiniLM-L6-v2

-- Create index for efficient similarity search
CREATE INDEX IF NOT EXISTS policies_embedding_idx ON public.policies
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);