
import { supabase } from '../lib/supabaseClient';
import { Gym, Booking, User, Trainer } from '../lib/types';

// --- Gym Services ---

export const getGyms = async (): Promise<Gym[]> => {
    const { data, error } = await supabase
        .from('gyms')
        .select(`
      *,
      trainers (*)
    `);

    if (error) {
        console.error('Error fetching gyms:', error);
        return [];
    }

    // Transform data to match our frontend Query/Type structure if needed
    // Note: Supabase returns snake_case by default, you might need mapping if your types are camelCase
    // For now assuming we map it manually or Types match DB columns loosely.
    // A proper mapper would be ideal here.
    return data.map((gym: any) => ({
        id: gym.id,
        name: gym.name,
        location: gym.location,
        description: gym.description,
        images: gym.images || [],
        basePrice: gym.base_price,
        ownerId: gym.owner_id,
        trainers: gym.trainers.map((t: any) => ({
            id: t.id,
            name: t.name,
            specialty: t.specialty,
            image: t.image_url,
            pricePerSession: t.price_per_session
        })),
        isFlashSale: gym.is_flash_sale,
        flashSaleDiscount: gym.flash_sale_discount
    })) as unknown as Gym[];
};

export const getGymById = async (id: string): Promise<Gym | null> => {
    const { data, error } = await supabase
        .from('gyms')
        .select(`
      *,
      trainers (*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching gym ${id}:`, error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        location: data.location,
        description: data.description,
        images: data.images || [],
        basePrice: data.base_price,
        ownerId: data.owner_id,
        trainers: data.trainers.map((t: any) => ({
            id: t.id,
            name: t.name,
            specialty: t.specialty,
            image: t.image_url,
            pricePerSession: t.price_per_session
        })),
        isFlashSale: data.is_flash_sale,
        flashSaleDiscount: data.flash_sale_discount
    } as unknown as Gym;
};

export const createGym = async (gym: Partial<Gym>) => {
    // Map Frontend types to DB columns
    const dbGym = {
        name: gym.name,
        location: gym.location,
        description: gym.description,
        images: gym.images,
        base_price: gym.basePrice,
        owner_id: gym.ownerId, // Optional, might be null for admin created
    };

    const { data, error } = await supabase
        .from('gyms')
        .insert(dbGym)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateGym = async (id: string, gym: Partial<Gym>) => {
    const dbGym: any = {};
    if (gym.name) dbGym.name = gym.name;
    if (gym.location) dbGym.location = gym.location;
    if (gym.description) dbGym.description = gym.description;
    if (gym.images) dbGym.images = gym.images;
    if (gym.basePrice) dbGym.base_price = gym.basePrice;

    // Safety check just in case
    if (Object.keys(dbGym).length === 0) return;

    const { data, error } = await supabase
        .from('gyms')
        .update(dbGym)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteGym = async (id: string) => {
    // 1. Delete associated Bookings first
    const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('gym_id', id);
    if (bookingError) throw bookingError;

    // 2. Delete associated Trainers
    const { error: trainerError } = await supabase
        .from('trainers')
        .delete()
        .eq('gym_id', id);
    if (trainerError) throw trainerError;

    // 3. Delete the Gym
    const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Trainer Services ---

export const createTrainer = async (trainer: Partial<Trainer> & { gymId: string }) => {
    const dbTrainer = {
        gym_id: trainer.gymId,
        name: trainer.name,
        specialty: trainer.specialty,
        price_per_session: trainer.pricePerSession,
        image_url: trainer.image,
    };

    const { data, error } = await supabase
        .from('trainers')
        .insert(dbTrainer)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteTrainer = async (id: string) => {
    const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Booking Services ---

export const createBooking = async (booking: Partial<Booking>) => {
    // Convert camelCase to snake_case for DB
    const dbBooking = {
        user_id: booking.userId,
        gym_id: booking.gymId,
        trainer_id: booking.trainerId,
        date: booking.date,
        type: booking.type,
        total_price: booking.totalPrice,
        status: 'confirmed',
        commission_amount: booking.commissionAmount || 0
    };

    const { data, error } = await supabase
        .from('bookings')
        .insert(dbBooking)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      gym:gyms (name),
      trainer:trainers (name)
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        gymId: b.gym_id,
        gymName: b.gym?.name || 'Unknown Gym',
        userId: b.user_id,
        userName: 'Me', // Ideally fetch user name or get from context
        date: b.date,
        type: b.type,
        trainerId: b.trainer_id,
        trainerName: b.trainer?.name,
        totalPrice: b.total_price,
        status: b.status,
        commissionAmount: b.commission_amount
    }));
};

// --- Affiliate Services ---

export const createAffiliateApplication = async (userId: string, reason: string) => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .insert({
            user_id: userId,
            reason: reason,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;

    await supabase.from('users').update({ affiliate_status: 'pending' }).eq('id', userId);
    return data;
};

export const getAffiliateApplications = async () => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .select('*, user:users (name, email)')
        .eq('status', 'pending')  // FIXED: Only active requests
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return data.map((app: any) => ({
        id: app.id,
        userId: app.user_id,
        userName: app.user?.name || 'Unknown',
        userEmail: app.user?.email,
        reason: app.reason,
        status: app.status
    }));
};

export const updateAffiliateApplicationStatus = async (appId: string, status: 'approved' | 'rejected') => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .update({ status })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateUserAffiliateStatus = async (userId: string, isAffiliate: boolean, status: string, code?: string) => {
    const updates: any = {
        is_affiliate: isAffiliate,
        affiliate_status: status
    };
    if (code) updates.affiliate_code = code;

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

    if (error) throw error;
};

// --- Announcement Services ---

export const getAnnouncements = async () => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }

    return data.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        imageUrl: a.image_url,
        isActive: a.is_active,
        createdAt: a.created_at
    }));
};

export const createAnnouncement = async (title: string, content: string, imageUrl?: string) => {
    const dbAnnouncement = {
        title,
        content,
        image_url: imageUrl,
        is_active: true
    };

    const { data, error } = await supabase
        .from('announcements')
        .insert(dbAnnouncement)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

