-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Booths table: pre-defined by admin, read-only for public
CREATE TABLE IF NOT EXISTS public.booths (
  id serial PRIMARY KEY,
  name text NOT NULL,
  bbox jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Prizes table: editable via Edge Function only
CREATE TABLE IF NOT EXISTS public.prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id integer NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('free', 'conditional', 'none')),
  condition text DEFAULT '',
  quantity text DEFAULT '',
  editor_name text DEFAULT '',
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- History table: audit trail, insert-only via Edge Function
CREATE TABLE IF NOT EXISTS public.history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id uuid REFERENCES public.prizes(id) ON DELETE SET NULL,
  booth_id integer NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
  old_data jsonb,
  new_data jsonb NOT NULL,
  editor_name text DEFAULT '',
  ip text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Public can read booths
CREATE POLICY "Allow public read booths"
  ON public.booths
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can read prizes
CREATE POLICY "Allow public read prizes"
  ON public.prizes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can read history
CREATE POLICY "Allow public read history"
  ON public.history
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role / Edge Function can write prizes
CREATE POLICY "Deny direct prize writes"
  ON public.prizes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Only service role / Edge Function can write history
CREATE POLICY "Deny direct history writes"
  ON public.history
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Only service role can write booths (admin seed)
CREATE POLICY "Deny direct booth writes"
  ON public.booths
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
