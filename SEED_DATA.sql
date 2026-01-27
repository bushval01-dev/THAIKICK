
-- Clean up existing data (Optional: Uncomment if you want to wipe data first)
-- truncate table public.bookings cascade;
-- truncate table public.trainers cascade;
-- truncate table public.gyms cascade;
-- truncate table public.users cascade;

-- 1. Create Mock Users (Owner & Customer)
-- Note: In a real app, users are created via Auth Sign up. Here we insert dummy users directly into public.users.
-- Since we can't easily fake 'auth.users' from SQL Editor without admin rights or knowing internal IDs, 
-- we will generate random UUIDs for them. This means you CANNOT login as these users via Supabase Auth UI,
-- but they will serve as owners/data holders perfectly.

DO $$
DECLARE
  owner_id_1 uuid := uuid_generate_v4();
  owner_id_2 uuid := uuid_generate_v4();
  gym_id_1 uuid := uuid_generate_v4();
  gym_id_2 uuid := uuid_generate_v4();
BEGIN

  -- Insert Owners
  INSERT INTO public.users (id, name, email, role) VALUES 
  (owner_id_1, 'Sombat Banchamek', 'buakaw@thaikick.com', 'owner'),
  (owner_id_2, 'Yodchatri Sityodtong', 'chatri@thaikick.com', 'owner');

  -- 2. Create Gyms
  INSERT INTO public.gyms (id, name, location, description, base_price, owner_id, images, is_flash_sale, flash_sale_discount) VALUES
  (gym_id_1, 'TIGER MUAY THAI', 'Phuket, Thailand', 'The world premier training destination. Home of champions.', 500, owner_id_1, ARRAY['https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop'], true, 20),
  (gym_id_2, 'DIAMOND FIGHT TEAM', 'Koh Samui, Thailand', 'Old school training with a modern approach. Island vibes, serious grind.', 450, owner_id_2, ARRAY['https://plus.unsplash.com/premium_photo-1664298103328-37c229342468?q=80&w=2070&auto=format&fit=crop'], false, 0);

  -- 3. Create Trainers for Gym 1
  INSERT INTO public.trainers (gym_id, name, specialty, price_per_session, image_url) VALUES
  (gym_id_1, 'Kru Dam', 'Clinch Specialist', 1200, 'https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?q=80&w=1974&auto=format&fit=crop'),
  (gym_id_1, 'Kru Nueng', 'Boxing Focus', 1000, 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1974&auto=format&fit=crop');

  -- 4. Create Trainers for Gym 2
  INSERT INTO public.trainers (gym_id, name, specialty, price_per_session, image_url) VALUES
  (gym_id_2, 'Ajarn Gai', 'Muay Femeu', 1500, 'https://images.unsplash.com/photo-1595183492837-d1cb7679a836?q=80&w=1974&auto=format&fit=crop');

END $$;
