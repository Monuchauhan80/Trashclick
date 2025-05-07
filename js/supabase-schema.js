// Supabase Database Schema

// Users table (extends Supabase auth.users)
const users = {
  id: "uuid references auth.users",
  email: "text",
  full_name: "text",
  avatar_url: "text",
  phone: "text",
  address: "text",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
  points: "integer default 0",
  reports_count: "integer default 0",
  badges: "jsonb[]",
  is_verified: "boolean default false",
  verification_documents: "text[]",
}

// Waste Reports table
const waste_reports = {
  id: "uuid",
  user_id: "uuid references users",
  waste_type: "text",
  title: "text",
  description: "text",
  quantity: "numeric",
  quantity_unit: "text",
  location: "text",
  latitude: "numeric",
  longitude: "numeric",
  urgency: "text",
  accessibility: "text",
  status: "text",
  photos: "text[]",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
  verified_by: "uuid references users",
  verification_date: "timestamp with time zone",
}

// Food Donations table
const food_donations = {
  id: "uuid",
  user_id: "uuid references users",
  food_type: "text",
  quantity: "numeric",
  unit: "text",
  expiry_date: "date",
  location: "text",
  latitude: "numeric",
  longitude: "numeric",
  description: "text",
  photos: "text[]",
  status: "text",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
  collected_by: "uuid references users",
  collection_date: "timestamp with time zone",
}

// Waste Sales table
const waste_sales = {
  id: "uuid",
  seller_id: "uuid references users",
  buyer_id: "uuid references users",
  waste_type: "text",
  quantity: "numeric",
  unit: "text",
  price: "numeric",
  location: "text",
  latitude: "numeric",
  longitude: "numeric",
  description: "text",
  photos: "text[]",
  status: "text",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
  transaction_date: "timestamp with time zone",
}

// Queries table
const queries = {
  id: "uuid",
  user_id: "uuid references users",
  title: "text",
  description: "text",
  category: "text",
  status: "text",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
  resolved_by: "uuid references users",
  resolution_date: "timestamp with time zone",
  resolution: "text",
}

// Reviews table
const reviews = {
  id: "uuid",
  user_id: "uuid references users",
  reviewed_user_id: "uuid references users",
  rating: "integer",
  comment: "text",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
}

// Badges table
const badges = {
  id: "uuid",
  name: "text",
  description: "text",
  icon_url: "text",
  points_required: "integer",
  category: "text",
}

// User Badges table (junction table)
const user_badges = {
  user_id: "uuid references users",
  badge_id: "uuid references badges",
  earned_at: "timestamp with time zone",
}

// Admin Actions Log table
const admin_actions_log = {
  id: "uuid",
  admin_id: "uuid references users",
  action: "text",
  details: "jsonb",
  created_at: "timestamp with time zone",
}

// RLS Policies
const policies = {
  // Users can read their own profile
  users_select: {
    policy: "SELECT",
    roles: ["authenticated"],
    using: "auth.uid() = id",
  },

  // Users can update their own profile
  users_update: {
    policy: "UPDATE",
    roles: ["authenticated"],
    using: "auth.uid() = id",
  },

  // Anyone can read waste reports
  waste_reports_select: {
    policy: "SELECT",
    roles: ["authenticated", "anon"],
    using: "true",
  },

  // Authenticated users can create waste reports
  waste_reports_insert: {
    policy: "INSERT",
    roles: ["authenticated"],
    using: "auth.uid() = user_id",
  },

  // Users can update their own reports
  waste_reports_update: {
    policy: "UPDATE",
    roles: ["authenticated"],
    using: "auth.uid() = user_id",
  },

  // Admin can do everything
  admin_all: {
    policy: "ALL",
    roles: ["authenticated"],
    using: "auth.jwt() ->> 'role' = 'admin'",
  },
}

// Functions
const functions = {
  // Function to award points
  award_points: {
    name: "award_points",
    parameters: ["user_id uuid", "action text"],
    returns: "void",
    language: "plpgsql",
    definition: `
            CREATE OR REPLACE FUNCTION award_points(user_id uuid, action text)
            RETURNS void AS $$
            BEGIN
                CASE action
                    WHEN 'report_waste' THEN
                        UPDATE users SET points = points + 10 WHERE id = user_id;
                    WHEN 'donate_food' THEN
                        UPDATE users SET points = points + 15 WHERE id = user_id;
                    WHEN 'sell_waste' THEN
                        UPDATE users SET points = points + 5 WHERE id = user_id;
                    WHEN 'verify_report' THEN
                        UPDATE users SET points = points + 20 WHERE id = user_id;
                END CASE;
            END;
            $$ LANGUAGE plpgsql;
        `,
  },

  // Function to check and award badges
  check_badges: {
    name: "check_badges",
    parameters: ["user_id uuid"],
    returns: "void",
    language: "plpgsql",
    definition: `
            CREATE OR REPLACE FUNCTION check_badges(user_id uuid)
            RETURNS void AS $$
            DECLARE
                user_points integer;
                badge_record record;
            BEGIN
                SELECT points INTO user_points FROM users WHERE id = user_id;
                
                FOR badge_record IN 
                    SELECT * FROM badges 
                    WHERE points_required <= user_points 
                    AND id NOT IN (
                        SELECT badge_id FROM user_badges WHERE user_id = user_id
                    )
                LOOP
                    INSERT INTO user_badges (user_id, badge_id, earned_at)
                    VALUES (user_id, badge_record.id, NOW());
                END LOOP;
            END;
            $$ LANGUAGE plpgsql;
        `,
  },
}

// Triggers
const triggers = {
  // Trigger to update updated_at timestamp
  update_updated_at: {
    name: "update_updated_at",
    definition: `
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `,
  },
}

// Export schema
export const schema = {
  tables: {
    users,
    waste_reports,
    food_donations,
    waste_sales,
    queries,
    reviews,
    badges,
    user_badges,
    admin_actions_log,
  },
  policies,
  functions,
  triggers,
}

