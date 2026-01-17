-- Create table for classroom sessions (each image upload)
CREATE TABLE public.classroom_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT,
  subject TEXT,
  chapter TEXT,
  session_date DATE DEFAULT CURRENT_DATE,
  ocr_confidence NUMERIC(5,2) DEFAULT 0,
  raw_extracted_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create table for knowledge chunks (extracted from OCR)
CREATE TABLE public.knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.classroom_sessions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  chunk_text TEXT NOT NULL,
  chunk_type TEXT DEFAULT 'concept' CHECK (chunk_type IN ('sentence', 'concept', 'summary')),
  subject TEXT,
  chapter TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ocr_confidence NUMERIC(5,2) DEFAULT 0,
  chunk_order INTEGER DEFAULT 0
);

-- Create table for chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.classroom_sessions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources TEXT[],
  is_refusal BOOLEAN DEFAULT false
);

-- Enable Row Level Security (public access for hackathon demo)
ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create public policies for demo (no auth required for hackathon)
CREATE POLICY "Allow public read access to sessions"
ON public.classroom_sessions FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to sessions"
ON public.classroom_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update to sessions"
ON public.classroom_sessions FOR UPDATE
USING (true);

CREATE POLICY "Allow public read access to chunks"
ON public.knowledge_chunks FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to chunks"
ON public.knowledge_chunks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to chat"
ON public.chat_messages FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to chat"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_chunks_session ON public.knowledge_chunks(session_id);
CREATE INDEX idx_chunks_text ON public.knowledge_chunks USING gin(to_tsvector('english', chunk_text));
CREATE INDEX idx_chat_session ON public.chat_messages(session_id);