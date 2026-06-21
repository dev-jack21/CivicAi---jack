-- 20260620000008_ministries.sql
-- Curated list of Kenyan ministries / government bodies

CREATE TABLE public.ministries (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow public read (needed for upload form category/ministry sync)
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ministries: public read"
  ON public.ministries FOR SELECT
  USING (true);

CREATE POLICY "ministries: admin all"
  ON public.ministries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed: current Kenyan ministries
INSERT INTO public.ministries (name, slug) VALUES
  ('Ministry of Agriculture and Livestock Development', 'agriculture-livestock'),
  ('Ministry of Defence', 'defence'),
  ('Ministry of Education', 'education'),
  ('Ministry of Energy and Petroleum', 'energy-petroleum'),
  ('Ministry of Environment, Climate Change and Forestry', 'environment-climate'),
  ('Ministry of Foreign and Diaspora Affairs', 'foreign-diaspora'),
  ('Ministry of Gender, Culture, the Arts and Heritage', 'gender-culture'),
  ('Ministry of Health', 'health'),
  ('Ministry of Home Affairs and National Administration', 'home-affairs'),
  ('Ministry of Information, Communications and the Digital Economy', 'ict-digital'),
  ('Ministry of Interior and Citizen Services', 'interior-citizen'),
  ('Ministry of Investments, Trade and Industry', 'investments-trade'),
  ('Ministry of Labour and Social Protection', 'labour-social'),
  ('Ministry of Land, Public Works, Housing and Urban Development', 'lands-housing'),
  ('Ministry of Mining, Blue Economy and Maritime Affairs', 'mining-maritime'),
  ('Ministry of Public Service and Human Capital Development', 'public-service'),
  ('Ministry of Roads and Transport', 'roads-transport'),
  ('Ministry of Sports, Culture and the Arts', 'sports-culture'),
  ('Ministry of Tourism and Wildlife', 'tourism-wildlife'),
  ('Ministry of Water, Sanitation and Irrigation', 'water-sanitation'),
  ('Ministry of Youth Affairs, Creative Economy and Sports', 'youth-creative'),
  ('The National Treasury and Economic Planning', 'national-treasury'),
  ('Office of the President', 'office-president'),
  ('Office of the Deputy President', 'office-deputy-president'),
  ('Office of the Prime Cabinet Secretary', 'prime-cabinet-secretary'),
  ('Office of the Attorney General and Department of Justice', 'attorney-general');
