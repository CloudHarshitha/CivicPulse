// CivicPulse TypeScript Types

export type UserRole = 'citizen' | 'authority' | 'admin';
export type IssueCategory = 'roads' | 'sanitation' | 'electricity' | 'water_sewage' | 'other';
export type IssuePriority = 'low' | 'medium' | 'critical';
export type IssueStatus = 'pending_verification' | 'open' | 'in_progress' | 'resolved' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  state: string;
  district: string;
  city: string;
  ward: string;
  aadhaar_number: string;
  is_verified?: boolean;
  aadhaar_last_four?: string;
  aadhaar_verified_at?: string;
  verification_ref_id?: string;
  kyc_provider?: string;
  digilocker_doc_id?: string;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address: string;
  photo_url: string;
  photo_timestamp: string | null;
  city: string;
  district: string;
  state: string;
  ward: string;
  upvote_count: number;
  action_priority_score: number;
  severity_weight: number;
  sla_deadline: string | null;
  assigned_department: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  verified_at: string | null;
  resolution_notes?: string | null;
  resolution_photo_url?: string | null;
  ai_verification?: {
    model_version: string;
    category: string;
    confidence: number;
    detected_objects: string[];
    requires_manual_review?: boolean;
    reason: string;
    verified_at: string;
  };
  created_at: string;
  updated_at: string;
  // Joined fields
  reporter?: Profile;
  photos?: IssuePhoto[];
  resolution?: Resolution;
  user_has_upvoted?: boolean;
  reporter_name?: string;
  reporter_avatar?: string | null;
  distance_meters?: number;
}

export interface IssuePhoto {
  id: string;
  issue_id: string;
  photo_url: string;
  photo_type: 'before' | 'after';
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
  created_at: string;
}

export interface Upvote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Department {
  id: string;
  name: string;
  category: IssueCategory;
  city: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  issue_id: string;
  department_id: string;
  assigned_by: string;
  assigned_to: string | null;
  contractor_name: string | null;
  contractor_phone: string | null;
  notes: string | null;
  assigned_at: string;
  department?: Department;
}

export interface Resolution {
  id: string;
  issue_id: string;
  resolved_by: string;
  resolution_photo_url: string;
  resolution_latitude: number;
  resolution_longitude: number;
  resolution_notes: string;
  gps_audit_passed: boolean;
  gps_distance_meters: number;
  citizen_verified: boolean | null;
  citizen_feedback: string | null;
  verification_deadline: string;
  resolved_at: string;
  verified_at: string | null;
  resolver?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'issue_update' | 'upvote' | 'assignment' | 'resolution' | 'verification' | 'sla_warning';
  issue_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FeedFilters {
  category?: IssueCategory | '';
  priority?: IssuePriority | '';
  status?: IssueStatus | '';
  feedMode: 'ward' | 'radius';
  radiusKm?: number;
  sortBy: 'newest' | 'priority' | 'upvotes';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocalityOption {
  value: string;
  label: string;
}

export interface StateData {
  [state: string]: {
    [district: string]: {
      [city: string]: string[];
    };
  };
}
