-- Create tour_inquiries table
CREATE TABLE IF NOT EXISTS public.tour_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  tour_slug TEXT,
  tour_title TEXT,
  travel_date DATE,
  group_size INTEGER,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tour_inquiries_created_at ON public.tour_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tour_inquiries_email ON public.tour_inquiries(email);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.tour_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role can do everything with tour_inquiries" ON public.tour_inquiries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything with contact_submissions" ON public.contact_submissions
  FOR ALL USING (auth.role() = 'service_role');