
-- Users Table
-- Note: Supabase handles auth.users automatically. We create a 'public.users' table to store extra profile info.
-- This table should be linked to auth.users via a trigger, but for simplicity here we just create the table.
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text check (role in ('admin', 'owner', 'customer')) default 'customer',
  avatar_url text,
  is_affiliate boolean default false,
  affiliate_code text unique,
  affiliate_earnings numeric default 0,
  affiliate_status text check (affiliate_status in ('none', 'pending', 'active', 'rejected')) default 'none',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Gyms Table
create table public.gyms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  description text,
  images text[], -- Array of image URLs
  base_price numeric not null,
  owner_id uuid references public.users(id),
  is_flash_sale boolean default false,
  flash_sale_discount integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trainers Table
create table public.trainers (
  id uuid default uuid_generate_v4() primary key,
  gym_id uuid references public.gyms(id) not null,
  name text not null,
  specialty text,
  languages text[],
  image_url text,
  price_per_session numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  gym_id uuid references public.gyms(id) not null,
  trainer_id uuid references public.trainers(id),
  date date not null,
  status text check (status in ('confirmed', 'completed', 'cancelled')) default 'confirmed',
  type text check (type in ('standard', 'private')) default 'standard',
  total_price numeric not null,
  commission_amount numeric default 0,
  commission_paid_to uuid references public.users(id), -- Affiliate user ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Affiliate Applications Table
create table public.affiliate_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user creation (Optional but recommended)
-- This automatically creates a public.users row when a user signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- News/Announcements Table
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Trainer Schedules Table
create table public.trainer_schedules (
  id uuid default uuid_generate_v4() primary key,
  trainer_id uuid references public.trainers(id) not null,
  day_of_week text not null, -- 'Monday', 'Tuesday', etc.
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Bookings Table to include time slots
alter table public.bookings 
add column start_time time,
add column end_time time;

-- Courses Table (Flexible Course Design)
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  gym_id uuid references public.gyms(id) not null,
  title text not null,
  description text,
  price numeric not null,
  duration text,
  max_students integer,
  design_data jsonb default '{}'::jsonb, -- Flexible structure for modules, daily schedule, etc.
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
