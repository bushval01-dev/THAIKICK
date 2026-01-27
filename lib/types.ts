export type UserRole = 'admin' | 'owner' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isAffiliate: boolean;
  affiliateCode?: string;
  affiliateEarnings: number;
  affiliateStatus: 'none' | 'pending' | 'active' | 'rejected';
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  languages: string[]; // Added property
  image: string;
  pricePerSession: number;
}

export interface Gym {
  id: string;
  name: string;
  location: string;
  description: string;
  images: string[];
  basePrice: number;
  ownerId: string;
  trainers: Trainer[];
  isFlashSale: boolean;
  flashSaleDiscount: number;
}

export interface Booking {
  id: string;
  gymId: string;
  gymName: string;
  userId: string;
  userName: string;
  date: string;
  type: 'standard' | 'private';
  trainerId?: string;
  trainerName?: string;
  totalPrice: number;
  commissionPaidTo?: string;
  commissionAmount: number;
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface AffiliateApplication {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}