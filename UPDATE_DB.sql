
-- 1. Drop the existing check constraint on 'type'
ALTER TABLE public.bookings DROP CONSTRAINT bookings_type_check;

-- 2. Add the new constraint including 'course'
ALTER TABLE public.bookings ADD CONSTRAINT bookings_type_check 
  CHECK (type IN ('standard', 'private', 'course'));

-- 3. Add course_id column to bookings table
ALTER TABLE public.bookings ADD COLUMN course_id uuid REFERENCES public.courses(id);

-- Optional: Update the SUPABASE_SCHEMA.sql file to reflect these changes if you want to keep it in sync.
