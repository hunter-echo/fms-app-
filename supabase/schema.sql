-- Mountain Climate HVAC - FSM App Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- =============================================
-- CUSTOMERS
-- =============================================
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'CO',
  zip TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true
);

-- =============================================
-- TECHNICIANS
-- =============================================
CREATE TABLE technicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  color TEXT DEFAULT '#3B82F6',
  active BOOLEAN DEFAULT true
);

-- =============================================
-- JOBS / WORK ORDERS
-- =============================================
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  job_number TEXT UNIQUE NOT NULL DEFAULT 'JOB-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 9000 + 1000)::text,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_duration INTEGER, -- minutes
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'CO',
  zip TEXT,
  notes TEXT,
  photos TEXT[], -- array of storage URLs
  completed_at TIMESTAMPTZ
);

-- Auto-generate sequential job numbers
CREATE SEQUENCE job_number_seq START 1;
ALTER TABLE jobs ALTER COLUMN job_number SET DEFAULT 'JOB-' || lpad(nextval('job_number_seq')::text, 3, '0');

-- =============================================
-- INVOICES
-- =============================================
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  invoice_number TEXT UNIQUE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.08,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  stripe_payment_intent_id TEXT,
  stripe_payment_link TEXT
);

-- Auto-generate invoice numbers
CREATE SEQUENCE invoice_number_seq START 1;
ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT 'INV-' || lpad(nextval('invoice_number_seq')::text, 3, '0');

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- For now, allow authenticated users full access
-- (Tighten per-role in production)
CREATE POLICY "Authenticated users can read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read technicians" ON technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage technicians" ON technicians FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage jobs" ON jobs FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON invoices FOR ALL TO authenticated USING (true);

-- =============================================
-- SAMPLE DATA (Mountain Climate HVAC)
-- =============================================
INSERT INTO technicians (name, email, phone, color) VALUES
  ('Hunter Martinez', 'hunter@mountainclimate.com', '(720) 555-0001', '#3B82F6'),
  ('Jake Torres', 'jake@mountainclimate.com', '(720) 555-0002', '#10B981');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX jobs_customer_id_idx ON jobs(customer_id);
CREATE INDEX jobs_technician_id_idx ON jobs(technician_id);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_scheduled_date_idx ON jobs(scheduled_date);
CREATE INDEX invoices_customer_id_idx ON invoices(customer_id);
CREATE INDEX invoices_status_idx ON invoices(status);
