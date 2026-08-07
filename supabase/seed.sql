-- CivicPulse Database Seed Script
-- Run this after running 001_initial_schema.sql and storage.sql in Supabase SQL Editor

-- Disable triggers during seed insertion to avoid circular triggers
ALTER TABLE upvotes DISABLE TRIGGER trigger_update_upvote_count;

-- 1. Insert Departments
INSERT INTO departments (id, name, category, city, contact_email, contact_phone) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'National Highways Authority', 'roads', 'Saket', 'highways@delhi.gov.in', '+91-11-23456789'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Municipal Sanitation Division', 'sanitation', 'Saket', 'sanitation@delhi.gov.in', '+91-11-23456790'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'City Electricity Board', 'electricity', 'Saket', 'power@delhi.gov.in', '+91-11-23456791'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Water & Sewage Authority', 'water_sewage', 'Saket', 'water@delhi.gov.in', '+91-11-23456792')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sample Issues with PostGIS coordinates in Saket, New Delhi
INSERT INTO issues (
  id, reporter_id, title, description, category, priority, status,
  latitude, longitude, address, photo_url, city, district, state, ward,
  upvote_count, action_priority_score, severity_weight, sla_deadline, assigned_department, created_at
) VALUES
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    '00000000-0000-0000-0000-000000000001',
    'Massive pothole on Ring Road near Saket Metro',
    'A dangerous 3-foot wide pothole has formed on the main Ring Road near Saket Metro station. Multiple vehicles have been damaged causing traffic congestion.',
    'roads', 'critical', 'open',
    28.5221, 77.2068, 'Ring Road, Near Saket Metro Station, New Delhi - 110017',
    '/demo/pothole1.jpg', 'Saket', 'South Delhi', 'Delhi', 'Ward 1 - Saket',
    47, 95.5, 25, NOW() + INTERVAL '18 hours', 'National Highways Authority', NOW() - INTERVAL '3 days'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
    '00000000-0000-0000-0000-000000000002',
    'Garbage dump overflowing near Malviya Nagar market',
    'Community waste collection point near Malviya Nagar market has not been cleared for over a week. Overflowing waste is blocking pedestrian pathways.',
    'sanitation', 'medium', 'in_progress',
    28.5294, 77.2106, 'Malviya Nagar Market, Block A, New Delhi - 110017',
    '/demo/garbage1.jpg', 'Saket', 'South Delhi', 'Delhi', 'Ward 2 - Malviya Nagar',
    23, 44.5, 10, NOW() + INTERVAL '48 hours', 'Municipal Sanitation Division', NOW() - INTERVAL '5 days'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
    '00000000-0000-0000-0000-000000000003',
    'Street lights non-functional on Hauz Khas main road',
    'Approximately 8-10 street lights are out on the main stretch from Hauz Khas metro station to Hauz Khas Village. Area is pitch dark after 7 PM.',
    'electricity', 'critical', 'open',
    28.5494, 77.2001, 'Main Road, Hauz Khas, New Delhi - 110016',
    '/demo/streetlight1.jpg', 'Saket', 'South Delhi', 'Delhi', 'Ward 3 - Hauz Khas',
    56, 109.0, 25, NOW() + INTERVAL '6 hours', 'City Electricity Board', NOW() - INTERVAL '2 days'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04',
    '00000000-0000-0000-0000-000000000001',
    'Clean water pipeline leakage flooding Press Enclave Road',
    'A major water main has burst near Press Enclave intersection. Clean drinking water is wasting into drains and causing local flooding.',
    'water_sewage', 'critical', 'open',
    28.5192, 77.2132, 'Press Enclave Road, Saket, New Delhi - 110017',
    '/demo/water1.jpg', 'Saket', 'South Delhi', 'Delhi', 'Ward 1 - Saket',
    34, 76.0, 25, NOW() + INTERVAL '12 hours', 'Water & Sewage Authority', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Enable triggers back
ALTER TABLE upvotes ENABLE TRIGGER trigger_update_upvote_count;
