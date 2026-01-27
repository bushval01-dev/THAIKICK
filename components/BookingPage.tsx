import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Lock, CreditCard } from 'lucide-react';
import { Gym, User, Booking, Trainer } from '../lib/types';
import { getReferralCode } from '../lib/affiliate';

interface BookingPageProps {
  gyms: Gym[];
  user: User | null;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

const BookingPage: React.FC<BookingPageProps> = ({ gyms, user, setBookings }) => {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const [gym, setGym] = useState<Gym | null>(null);
  
  // Booking State
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<'standard' | 'private'>('standard');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Locate Gym
    const foundGym = gyms.find(g => g.id === gymId);
    if (foundGym) {
        setGym(foundGym);
    } else {
        navigate('/'); // Fallback if gym not found
    }

    // 2. Check Affiliate Cookie
    const code = getReferralCode();
    setReferralCode(code);
  }, [gymId, gyms, navigate]);

  // Auth Guard
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bone">
            <div className="bg-white p-10 border-2 border-brand-charcoal text-center shadow-[8px_8px_0px_0px_#AE3A17]">
                <Lock className="w-12 h-12 mx-auto mb-4 text-brand-charcoal" />
                <h2 className="font-black text-2xl uppercase mb-2">Access Denied</h2>
                <p className="font-mono text-sm mb-6">Please log in to secure a slot.</p>
                <Link to="/" className="inline-block bg-brand-blue text-white font-bold uppercase py-3 px-6 hover:bg-brand-charcoal transition-colors">
                    Return Home
                </Link>
            </div>
        </div>
    );
  }

  if (!gym) return null;

  // Pricing Logic
  const calculateTotal = () => {
    let price = gym.basePrice;
    if (gym.isFlashSale) price = price * (1 - gym.flashSaleDiscount / 100);
    if (type === 'private' && selectedTrainer) price += selectedTrainer.pricePerSession;
    return Math.round(price);
  };

  const handlePayment = () => {
    if (!date) {
        alert("Please select a date.");
        return;
    }
    
    setIsProcessing(true);

    // Simulate Network Request
    setTimeout(() => {
        const total = calculateTotal();
        const newBooking: Booking = {
            id: `b_${Date.now()}`,
            gymId: gym.id,
            gymName: gym.name,
            userId: user.id,
            userName: user.name,
            date: date,
            type: type,
            trainerId: selectedTrainer?.id,
            trainerName: selectedTrainer?.name,
            totalPrice: total,
            commissionPaidTo: referralCode || undefined,
            commissionAmount: referralCode ? total * 0.15 : 0,
            status: 'confirmed'
        };

        setBookings(prev => [...prev, newBooking]);
        setIsProcessing(false);
        navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-bone animate-reveal">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        
        {/* Left Column: Visuals */}
        <div className="relative h-[300px] lg:h-auto bg-gray-900 border-r-2 border-brand-charcoal order-1 lg:order-none">
            <img 
                src={gym.images[0]} 
                alt={gym.name} 
                className="w-full h-full object-cover opacity-60 grayscale mix-blend-luminosity"
            />
            <div className="absolute inset-0 p-8 lg:p-16 flex flex-col justify-between">
                <Link to="/" className="inline-flex items-center gap-2 text-white font-mono text-xs font-bold uppercase hover:text-brand-red transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Return
                </Link>
                <div>
                    <div className="inline-block bg-brand-blue text-white font-mono text-xs font-bold px-3 py-1 mb-4 uppercase">
                        {gym.location}
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white uppercase leading-[0.9] mb-6">
                        {gym.name}
                    </h1>
                    <div className="flex gap-4 text-gray-300 font-mono text-sm">
                        <span>• Authentic Muay Thai</span>
                        <span>• {gym.trainers.length} Trainers Available</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Transaction Terminal */}
        <div className="bg-white flex flex-col justify-center p-8 lg:p-24 relative order-2 lg:order-none">
            <div className="max-w-md w-full mx-auto">
                <div className="mb-10 flex items-center justify-between border-b-2 border-brand-charcoal pb-4">
                    <h2 className="font-black text-2xl uppercase text-brand-charcoal">Secure Booking</h2>
                    <Shield className="w-6 h-6 text-brand-blue" />
                </div>

                {/* Form */}
                <div className="space-y-8 mb-12">
                    {/* Date Selection */}
                    <div className="space-y-3">
                        <label className="font-mono text-xs font-bold text-brand-blue block">01 // SELECT DATE</label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-brand-bone border-2 border-gray-200 p-4 font-mono text-brand-charcoal focus:border-brand-blue focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Class Type */}
                    <div className="space-y-3">
                        <label className="font-mono text-xs font-bold text-brand-blue block">02 // TRAINING TYPE</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setType('standard')}
                                className={`p-4 border-2 font-mono text-xs font-bold uppercase transition-all ${type === 'standard' ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_0px_#3471AE]' : 'border-gray-200 text-gray-400 hover:border-brand-blue'}`}
                            >
                                Standard
                            </button>
                            <button 
                                onClick={() => setType('private')}
                                className={`p-4 border-2 font-mono text-xs font-bold uppercase transition-all ${type === 'private' ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_0px_#3471AE]' : 'border-gray-200 text-gray-400 hover:border-brand-blue'}`}
                            >
                                Private
                            </button>
                        </div>
                    </div>

                    {/* Trainer Selection (Conditional) */}
                    {type === 'private' && (
                        <div className="space-y-3 animate-reveal">
                             <label className="font-mono text-xs font-bold text-brand-blue block">03 // SELECT KRU</label>
                             <div className="space-y-2">
                                {gym.trainers.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => setSelectedTrainer(t)}
                                        className={`flex items-center gap-4 p-3 border-2 cursor-pointer transition-colors ${selectedTrainer?.id === t.id ? 'border-brand-charcoal bg-brand-bone' : 'border-gray-100 hover:border-brand-blue'}`}
                                    >
                                        <div className="w-10 h-10 bg-gray-200 overflow-hidden">
                                            <img src={t.image} alt={t.name} className="w-full h-full object-cover grayscale" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm uppercase">{t.name}</div>
                                            <Mono className="text-[10px] text-gray-500">{t.specialty}</Mono>
                                        </div>
                                        <div className="font-mono text-xs font-bold">+฿{t.pricePerSession}</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* Summary & Affiliate Badge */}
                <div className="bg-brand-bone border-2 border-brand-charcoal p-6 mb-8 relative">
                    {referralCode && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white font-mono text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm flex items-center gap-2 w-max">
                           <Check className="w-3 h-3" /> 
                           15% Commission Applied
                        </div>
                    )}
                    
                    <div className="flex justify-between items-end mb-2">
                        <Mono className="text-gray-500">Total Due</Mono>
                        <div className="text-4xl font-black text-brand-charcoal">
                            ฿{calculateTotal().toLocaleString()}
                        </div>
                    </div>
                    {gym.isFlashSale && (
                        <div className="text-right font-mono text-xs text-brand-red font-bold">
                            Flash Sale Active (-{gym.flashSaleDiscount}%)
                        </div>
                    )}
                </div>

                {/* Pay Button */}
                <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-brand-red text-white font-black uppercase py-5 text-lg hover:bg-brand-charcoal transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_#1A1A1A] relative active:top-[2px] active:left-[2px] active:shadow-[6px_6px_0px_0px_#1A1A1A]"
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            Pay Now <CreditCard className="w-5 h-5" />
                        </>
                    )}
                </button>
                <div className="text-center mt-4">
                    <Mono className="text-[10px] text-gray-400">Encrypted via Stripe • THAIKICK Guarantee</Mono>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;