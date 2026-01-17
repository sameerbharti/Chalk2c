-- Add explicit DELETE policies to prevent unpredictable behavior
-- Since this is a public app without authentication, we explicitly DENY deletes from client

CREATE POLICY "Prevent client deletes on sessions" 
  ON public.classroom_sessions 
  FOR DELETE 
  USING (false);

CREATE POLICY "Prevent client deletes on chunks" 
  ON public.knowledge_chunks 
  FOR DELETE 
  USING (false);

CREATE POLICY "Prevent client deletes on chat" 
  ON public.chat_messages 
  FOR DELETE 
  USING (false);

-- Add explicit UPDATE policy for chat_messages (currently missing)
CREATE POLICY "Prevent client updates on chat" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (false);

-- Add explicit UPDATE policy for knowledge_chunks (currently missing)  
CREATE POLICY "Prevent client updates on chunks" 
  ON public.knowledge_chunks 
  FOR UPDATE 
  USING (false);