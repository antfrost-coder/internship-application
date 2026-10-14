-- SCRUM-13: accounts. One table for every role; role-specific profile data
-- (student skills, company details, ...) lives in separate tables added later.
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student', 'recruiter', 'school_staff', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
