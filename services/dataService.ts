
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
