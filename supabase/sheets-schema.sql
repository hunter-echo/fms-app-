-- ============================================================
-- Job Sheets Feature
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kycmtgorjwfreoduyqai/sql
-- ============================================================

-- Sheet templates (reusable form definitions)
CREATE TABLE IF NOT EXISTS sheet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job sheets (filled-out instances linked to jobs)
CREATE TABLE IF NOT EXISTS job_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  template_id UUID,
  template_name TEXT NOT NULL,
  responses JSONB DEFAULT '{}'::jsonb,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'pending_review', 'approved', 'sent')),
  sent_at TIMESTAMPTZ,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sheet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON sheet_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON job_sheets FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed 3 default HVAC templates
-- ============================================================

INSERT INTO sheet_templates (name, description, fields) VALUES
('Furnace Tune-Up', 'Annual furnace maintenance checklist', '[
  {"id":"filter","type":"select","label":"Filter Condition","options":["Clean","Dirty - Replaced","Dirty - Customer to replace"]},
  {"id":"heat_exchanger","type":"select","label":"Heat Exchanger","options":["Pass","Crack Found","Not Accessible"]},
  {"id":"burners","type":"select","label":"Burner Condition","options":["Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"igniter","type":"select","label":"Igniter Condition","options":["Good","Worn","Failed - Replaced"]},
  {"id":"gas_inlet","type":"number","label":"Gas Inlet Pressure (in. WC)"},
  {"id":"gas_manifold","type":"number","label":"Gas Manifold Pressure (in. WC)"},
  {"id":"supply_temp","type":"number","label":"Supply Air Temp (°F)"},
  {"id":"return_temp","type":"number","label":"Return Air Temp (°F)"},
  {"id":"temp_rise","type":"number","label":"Temperature Rise (°F)"},
  {"id":"co_reading","type":"number","label":"CO Reading (PPM)"},
  {"id":"blower_amps","type":"number","label":"Blower Motor Amps"},
  {"id":"flue_pipe","type":"select","label":"Flue Pipe Condition","options":["Good","Needs Repair","Replaced"]},
  {"id":"drain_lines","type":"checkbox","label":"Drain Lines Clear"},
  {"id":"electrical","type":"checkbox","label":"Electrical Connections Tight"},
  {"id":"thermostat","type":"checkbox","label":"Thermostat Calibrated"},
  {"id":"safety_controls","type":"checkbox","label":"Safety Controls Tested"},
  {"id":"notes","type":"textarea","label":"Tech Notes"}
]'::jsonb),
('A/C Tune-Up', 'Annual air conditioning maintenance checklist', '[
  {"id":"refrigerant_type","type":"select","label":"Refrigerant Type","options":["R-22","R-410A","R-32","R-407C"]},
  {"id":"filter","type":"select","label":"Filter Condition","options":["Clean","Dirty - Replaced","Dirty - Customer to replace"]},
  {"id":"suction_pressure","type":"number","label":"Suction Pressure (PSI)"},
  {"id":"discharge_pressure","type":"number","label":"Discharge Pressure (PSI)"},
  {"id":"suction_line_temp","type":"number","label":"Suction Line Temp (°F)"},
  {"id":"liquid_line_temp","type":"number","label":"Liquid Line Temp (°F)"},
  {"id":"superheat","type":"number","label":"Superheat (°F)"},
  {"id":"subcooling","type":"number","label":"Subcooling (°F)"},
  {"id":"supply_temp","type":"number","label":"Supply Air Temp (°F)"},
  {"id":"return_temp","type":"number","label":"Return Air Temp (°F)"},
  {"id":"delta_t","type":"number","label":"Delta T (°F)"},
  {"id":"condenser_fan_amps","type":"number","label":"Condenser Fan Motor Amps"},
  {"id":"blower_amps","type":"number","label":"Blower Motor Amps"},
  {"id":"condenser_coil","type":"select","label":"Condenser Coil","options":["Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"evaporator_coil","type":"select","label":"Evaporator Coil","options":["Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"capacitor","type":"select","label":"Capacitor","options":["Good","Weak - Replaced","Failed - Replaced"]},
  {"id":"contactor","type":"select","label":"Contactor","options":["Good","Pitted - Replaced","Failed - Replaced"]},
  {"id":"drain_line","type":"checkbox","label":"Drain Line Clear"},
  {"id":"electrical","type":"checkbox","label":"Electrical Connections Tight"},
  {"id":"notes","type":"textarea","label":"Tech Notes"}
]'::jsonb),
('Rooftop Unit Tune-Up', 'Commercial RTU maintenance checklist', '[
  {"id":"unit_model","type":"text","label":"Unit Model #"},
  {"id":"unit_serial","type":"text","label":"Unit Serial #"},
  {"id":"refrigerant_type","type":"select","label":"Refrigerant Type","options":["R-22","R-410A","R-407C"]},
  {"id":"filter","type":"select","label":"Filter Condition","options":["Clean","Dirty - Replaced","Dirty - Customer to replace"]},
  {"id":"suction_pressure","type":"number","label":"Suction Pressure (PSI)"},
  {"id":"discharge_pressure","type":"number","label":"Discharge Pressure (PSI)"},
  {"id":"superheat","type":"number","label":"Superheat (°F)"},
  {"id":"subcooling","type":"number","label":"Subcooling (°F)"},
  {"id":"supply_temp","type":"number","label":"Supply Air Temp (°F)"},
  {"id":"return_temp","type":"number","label":"Return Air Temp (°F)"},
  {"id":"delta_t","type":"number","label":"Delta T (°F)"},
  {"id":"condenser_coils","type":"select","label":"Condenser Coils","options":["Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"evaporator_coils","type":"select","label":"Evaporator Coils","options":["Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"gas_heat","type":"select","label":"Gas Heat","options":["N/A","Operating Normal","Needs Service"]},
  {"id":"heat_exchanger","type":"select","label":"Heat Exchanger","options":["N/A","Pass","Crack Found"]},
  {"id":"burners","type":"select","label":"Burners","options":["N/A","Clean","Dirty - Cleaned","Needs Service"]},
  {"id":"economizer","type":"select","label":"Economizer","options":["N/A","Operating Normal","Needs Service"]},
  {"id":"belts_bearings","type":"select","label":"Belts & Bearings","options":["Good","Worn - Replaced","Needs Service"]},
  {"id":"drain_pan","type":"select","label":"Drain Pan/Lines","options":["Clear","Blocked - Cleared","Needs Service"]},
  {"id":"electrical","type":"checkbox","label":"Electrical Connections Tight"},
  {"id":"notes","type":"textarea","label":"Tech Notes"}
]'::jsonb);

-- ============================================================
-- Optional: Supabase Storage bucket for photos
-- Create this manually in Dashboard → Storage → New bucket
-- Name: sheet-photos
-- Public: YES
-- ============================================================
