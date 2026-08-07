-- CivicPulse Database Schema with PostGIS
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  state TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  ward TEXT NOT NULL DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ISSUES TABLE (with PostGIS geography)
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('roads', 'sanitation', 'electricity', 'water_sewage', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('pending_verification', 'open', 'in_progress', 'resolved', 'verified', 'rejected')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  address TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  photo_timestamp TIMESTAMPTZ,
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  ward TEXT NOT NULL DEFAULT '',
  upvote_count INTEGER DEFAULT 0,
  action_priority_score DOUBLE PRECISION DEFAULT 0,
  severity_weight DOUBLE PRECISION DEFAULT 5,
  sla_deadline TIMESTAMPTZ,
  assigned_department TEXT,
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-populate location geography from lat/lng
CREATE OR REPLACE FUNCTION update_issue_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_issue_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_location();

-- Spatial index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_issues_city ON issues(city);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at DESC);

-- ============================================
-- ISSUE PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'before' CHECK (photo_type IN ('before', 'after')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPVOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- Trigger to update upvote_count and APS on issues
CREATE OR REPLACE FUNCTION update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET 
      upvote_count = upvote_count + 1,
      action_priority_score = ((upvote_count + 1) * 1.5) + severity_weight + (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0 * 2.0),
      updated_at = NOW()
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issues SET 
      upvote_count = GREATEST(upvote_count - 1, 0),
      action_priority_score = (GREATEST(upvote_count - 1, 0) * 1.5) + severity_weight + (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0 * 2.0),
      updated_at = NOW()
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_upvote_count
  AFTER INSERT OR DELETE ON upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_upvote_count();

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('roads', 'sanitation', 'electricity', 'water_sewage', 'other')),
  city TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  contractor_name TEXT,
  contractor_phone TEXT,
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESOLUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  resolved_by UUID NOT NULL REFERENCES profiles(id),
  resolution_photo_url TEXT NOT NULL,
  resolution_latitude DOUBLE PRECISION NOT NULL,
  resolution_longitude DOUBLE PRECISION NOT NULL,
  resolution_notes TEXT DEFAULT '',
  gps_audit_passed BOOLEAN DEFAULT FALSE,
  gps_distance_meters DOUBLE PRECISION DEFAULT 0,
  citizen_verified BOOLEAN,
  citizen_feedback TEXT,
  verification_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issue_update', 'upvote', 'assignment', 'resolution', 'verification', 'sla_warning')),
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues policies
CREATE POLICY "Issues are viewable by everyone" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporter or authority can update issues" ON issues FOR UPDATE USING (
  auth.uid() = reporter_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('authority', 'admin'))
);

-- Issue photos policies
CREATE POLICY "Issue photos viewable by everyone" ON issue_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add photos" ON issue_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Upvotes policies
CREATE POLICY "Upvotes are viewable by everyone" ON upvotes FOR SELECT USING (true);
CREATE POLICY "Users can upvote" ON upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvote" ON upvotes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Departments policies
CREATE POLICY "Departments viewable by everyone" ON departments FOR SELECT USING (true);
CREATE POLICY "Only admins can manage departments" ON departments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Assignments policies
CREATE POLICY "Assignments viewable by authorities" ON assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('authority', 'admin'))
);
CREATE POLICY "Authorities can create assignments" ON assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('authority', 'admin'))
);

-- Resolutions policies
CREATE POLICY "Resolutions viewable by everyone" ON resolutions FOR SELECT USING (true);
CREATE POLICY "Authorities can create resolutions" ON resolutions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('authority', 'admin'))
);
CREATE POLICY "Authorities can update resolutions" ON resolutions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('authority', 'admin'))
  OR auth.uid() = (SELECT reporter_id FROM issues WHERE id = issue_id)
);

-- Notifications policies
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA: Sample departments
-- ============================================
INSERT INTO departments (name, category, city, contact_email, contact_phone) VALUES
  ('National Highways Authority', 'roads', 'Delhi', 'roads@civic.gov.in', '+91-11-1234567'),
  ('Municipal Sanitation Division', 'sanitation', 'Delhi', 'sanitation@civic.gov.in', '+91-11-2345678'),
  ('City Electricity Board', 'electricity', 'Delhi', 'electricity@civic.gov.in', '+91-11-3456789'),
  ('Water & Sewage Authority', 'water_sewage', 'Delhi', 'water@civic.gov.in', '+91-11-4567890'),
  ('Municipal Corporation Engineering', 'roads', 'Mumbai', 'roads@bmc.gov.in', '+91-22-1234567'),
  ('BMC Sanitation Wing', 'sanitation', 'Mumbai', 'sanitation@bmc.gov.in', '+91-22-2345678')
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Find duplicate issues within radius
-- ============================================
CREATE OR REPLACE FUNCTION find_nearby_issues(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION DEFAULT 30,
  p_hours_window INTEGER DEFAULT 48,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  issue_id UUID,
  distance_meters DOUBLE PRECISION,
  title TEXT,
  status TEXT,
  upvote_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS issue_id,
    ST_Distance(
      i.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) AS distance_meters,
    i.title,
    i.status,
    i.upvote_count,
    i.created_at
  FROM issues i
  WHERE ST_DWithin(
    i.location,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_radius_meters
  )
  AND i.created_at >= NOW() - (p_hours_window || ' hours')::interval
  AND i.status NOT IN ('resolved', 'verified', 'rejected')
  AND (p_category IS NULL OR i.category = p_category)
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get locality feed
-- ============================================
CREATE OR REPLACE FUNCTION get_locality_feed(
  p_city TEXT DEFAULT NULL,
  p_district TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_radius_meters DOUBLE PRECISION DEFAULT 5000,
  p_category TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'newest',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  reporter_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  photo_url TEXT,
  city TEXT,
  district TEXT,
  ward TEXT,
  upvote_count INTEGER,
  action_priority_score DOUBLE PRECISION,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  reporter_name TEXT,
  reporter_avatar TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id, i.reporter_id, i.title, i.description, i.category, i.priority, i.status,
    i.latitude, i.longitude, i.address, i.photo_url,
    i.city, i.district, i.ward,
    i.upvote_count, i.action_priority_score, i.sla_deadline, i.created_at,
    p.full_name AS reporter_name,
    p.avatar_url AS reporter_avatar,
    CASE 
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
        ST_Distance(
          i.location,
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        )
      ELSE NULL
    END AS distance_meters
  FROM issues i
  LEFT JOIN profiles p ON i.reporter_id = p.id
  WHERE i.status NOT IN ('rejected')
  AND (p_city IS NULL OR i.city = p_city)
  AND (p_district IS NULL OR i.district = p_district)
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_priority IS NULL OR i.priority = p_priority)
  AND (p_status IS NULL OR i.status = p_status)
  AND (
    p_latitude IS NULL OR p_longitude IS NULL OR
    ST_DWithin(
      i.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    )
  )
  ORDER BY
    CASE WHEN p_sort_by = 'newest' THEN EXTRACT(EPOCH FROM i.created_at) END DESC,
    CASE WHEN p_sort_by = 'priority' THEN i.action_priority_score END DESC,
    CASE WHEN p_sort_by = 'upvotes' THEN i.upvote_count END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
