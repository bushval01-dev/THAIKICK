import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Lock, CreditCard, Tag } from 'lucide-react';
import { Gym, User, Booking, Trainer, TrainerSchedule } from '../lib/types';
import { getReferralCode } from '../lib/affiliate';
import { createBooking, getTrainerSchedules, getTrainerBookings } from '../services/dataService';

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
    const [step, setStep] = useState<'booking' | 'payment'>('booking');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [type, setType] = useState<'standard' | 'private'>('standard');
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Affiliate State
    const [referralCode, setReferralCode] = useState<string>('');
    const [referralApplied, setReferralApplied] = useState(false);

    // Private Session State
    const [availableSlots, setAvailableSlots] = useState<TrainerSchedule[]>([]);
    const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);

    const getDayName = (dateStr: string) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    };

    const calculateSessionCount = () => {
        if (!startDate) return 0;
        if (!endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (type === 'standard') {
            // Standard: Every day
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays + 1; // Inclusive
        } else {
            // Private: Weekly Recurrence
            let count = 0;
            let current = new Date(start);
            while (current <= end) {
                count++;
                current.setDate(current.getDate() + 7);
            }
            return count;
        }
    };

    useEffect(() => {
        // For Private availability, we check the START date for reference schedule
        // In a real app, we'd check every day in range, but for MVP we check the first day's schedule
        if (type === 'private' && selectedTrainer && startDate) {
            const fetchSchedule = async () => {
                const schedules = await getTrainerSchedules(selectedTrainer.id);
                // Check bookings for the start date only for now
                const bookings = await getTrainerBookings(selectedTrainer.id, startDate);

                const dayName = getDayName(startDate);
                const relevantSlots = schedules.filter(s => s.dayOfWeek === dayName);

                // Filter out taken slots
                const freeSlots = relevantSlots.filter(s =>
                    !bookings.some(b => b.startTime === s.startTime)
                );

                setAvailableSlots(freeSlots);
                setSelectedTime(null); // Reset selection
            };
            fetchSchedule();
        }
    }, [type, selectedTrainer, startDate]);

    useEffect(() => {
        // 1. Locate Gym
        const foundGym = gyms.find(g => g.id === gymId);
        if (foundGym) {
            setGym(foundGym);
        } else {
            navigate('/'); // Fallback
        }

        // 2. Check Affiliate Cookie
        const code = getReferralCode();
        if (code) {
            setReferralCode(code);
            setReferralApplied(true);
        }
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
        let oneSessionPrice = gym.basePrice;
        if (gym.isFlashSale) oneSessionPrice = oneSessionPrice * (1 - gym.flashSaleDiscount / 100);
        if (type === 'private' && selectedTrainer) oneSessionPrice += selectedTrainer.pricePerSession;

        const count = calculateSessionCount();
        return Math.round(oneSessionPrice * count);
    };

    const handleProceedToPayment = () => {
        if (!startDate) {
            alert("Please select a start date.");
            return;
        }
        if (endDate && new Date(endDate) < new Date(startDate)) {
            alert("End date cannot be before start date.");
            return;
        }
        if (type === 'private' && !selectedTime) {
            alert("Please select a time slot.");
            return;
        }
        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            const count = calculateSessionCount();
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : new Date(startDate);
            const total = calculateTotal();
            const pricePerSession = total / count;

            // Generate Requests
            const bookingPromises = [];

            let current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];

                const bookingPayload: Partial<Booking> = {
                    gymId: gym.id,
                    gymName: gym.name,
                    userId: user.id,
                    userName: user.name,
                    date: dateStr,
                    type: type,
                    trainerId: selectedTrainer?.id || undefined,
                    trainerName: selectedTrainer?.name,
                    startTime: selectedTime?.start,
                    endTime: selectedTime?.end,
                    totalPrice: Math.round(pricePerSession),
                    commissionPaidTo: referralCode || undefined,
                    commissionAmount: referralCode ? Math.round(pricePerSession * 0.10) : 0,
                    status: 'confirmed'
                };
                bookingPromises.push(createBooking(bookingPayload));

                // Increment Loop
                if (type === 'standard') {
                    current.setDate(current.getDate() + 1);
                } else {
                    current.setDate(current.getDate() + 7);
                }
            }

            await Promise.all(bookingPromises);

            // Optimistic update (might spam local state if many days, but okay for now)
            // Ideally we re-fetch bookings in Dashboard. 
            // We won't update local 'bookings' prop here significantly since we redirect anyway.

            setIsProcessing(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Payment failed. Please try again.");
            setIsProcessing(false);
        }
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

                {/* Right Column: Interaction Terminal */}
                <div className="bg-white flex flex-col justify-center p-8 lg:p-24 relative order-2 lg:order-none">
                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-10 flex items-center justify-between border-b-2 border-brand-charcoal pb-4">
                            <h2 className="font-black text-2xl uppercase text-brand-charcoal">
                                {step === 'booking' ? 'Secure Booking' : 'Finalize Payment'}
                            </h2>
                            <Shield className="w-6 h-6 text-brand-blue" />
                        </div>

                        {step === 'booking' ? (
                            // --- STEP 1: BOOKING DETAILS ---
                            <div className="space-y-8 mb-12 animate-reveal">
                                {/* Date Selection */}
                                <div className="space-y-3">
                                    <label className="font-mono text-xs font-bold text-brand-blue block">01 // SELECT DATES</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-mono text-gray-400 block mb-1">CHECK-IN</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (!endDate) setEndDate(e.target.value);
                                                }}
                                                className="w-full bg-brand-bone border-2 border-gray-200 p-4 font-mono text-brand-charcoal text-xs focus:border-brand-blue focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-gray-400 block mb-1">CHECK-OUT</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-brand-bone border-2 border-gray-200 p-4 font-mono text-brand-charcoal text-xs focus:border-brand-blue focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right font-mono text-xs font-bold text-brand-red">
                                        {type === 'standard' ? 'DURATION:' : 'SESSIONS:'} {calculateSessionCount()} {type === 'standard' ? 'DAYS' : 'TIMES (WEEKLY)'}
                                    </div>
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

                                {/* Time Selection (Private Only) */}
                                {type === 'private' && selectedTrainer && startDate && (
                                    <div className="space-y-3 animate-reveal">
                                        <label className="font-mono text-xs font-bold text-brand-blue block">04 // SELECT TIME SLOT ({getDayName(startDate)})</label>
                                        <p className="text-[10px] text-gray-400 font-mono -mt-2 mb-2">*Time slot applies to all {calculateSessionCount()} sessions</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {availableSlots.length === 0 ? (
                                                <div className="col-span-full font-mono text-xs text-gray-400 p-4 border border-dashed border-gray-300 text-center">
                                                    NO SLOTS AVAILABLE ON THIS DAY
                                                </div>
                                            ) : (
                                                availableSlots.map(slot => (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => setSelectedTime({ start: slot.startTime, end: slot.endTime })}
                                                        className={`p-3 font-mono text-xs font-bold border-2 transition-colors ${selectedTime?.start === slot.startTime && selectedTime?.end === slot.endTime
                                                            ? 'bg-brand-charcoal text-white border-brand-charcoal'
                                                            : 'bg-white border-gray-200 hover:border-brand-blue text-brand-charcoal'
                                                            }`}
                                                    >
                                                        {slot.startTime} - {slot.endTime}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t-2 border-dashed border-gray-200">
                                    <div className="flex justify-between items-end">
                                        <Mono className="text-gray-500">Projected Total ({calculateSessionCount()} {type === 'standard' ? 'Days' : 'Sessions'})</Mono>
                                        <div className="text-3xl font-black text-gray-400">
                                            ฿{calculateTotal().toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceedToPayment}
                                    className="w-full bg-brand-charcoal text-white font-black uppercase py-5 text-lg hover:bg-brand-blue transition-colors flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_#AE3A17]"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        ) : (
                            // --- STEP 2: PAYMENT PAGE ---
                            <div className="space-y-8 mb-12 animate-reveal">
                                {/* Order Summary */}
                                <div className="bg-brand-bone p-6 border-2 border-brand-charcoal">
                                    <h3 className="font-black uppercase text-sm mb-4 border-b border-brand-charcoal pb-2">Order Summary</h3>
                                    <div className="space-y-2 font-mono text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Gym</span>
                                            <span className="font-bold">{gym.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Duration</span>
                                            <span className="font-bold">{startDate} to {endDate} ({calculateSessionCount()} {type === 'standard' ? 'Days' : 'Sessions'})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Type</span>
                                            <span className="font-bold uppercase">{type}</span>
                                        </div>
                                        {type === 'private' && selectedTrainer && (
                                            <div className="flex justify-between text-brand-blue">
                                                <span className="">Trainer</span>
                                                <span className="font-bold">{selectedTrainer.name}</span>
                                            </div>
                                        )}
                                        {selectedTime && (
                                            <div className="flex justify-between text-brand-blue">
                                                <span className="">Time</span>
                                                <span className="font-bold">{selectedTime.start} - {selectedTime.end} {type === 'standard' ? '(Daily)' : '(Weekly)'}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-brand-charcoal flex justify-between items-end">
                                        <span className="font-black uppercase">Total Due</span>
                                        <span className="text-3xl font-black">฿{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Affiliate Code Input */}
                                <div>
                                    <label className="font-mono text-xs font-bold text-brand-blue block mb-2">PARTNER CODE (OPTIONAL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Code"
                                            value={referralCode || ''}
                                            onChange={(e) => setReferralCode(e.target.value)}
                                            className="flex-1 bg-white border-2 border-gray-200 p-3 font-mono uppercase focus:border-brand-blue focus:outline-none"
                                        />
                                        <div className="bg-gray-100 border-2 border-gray-200 px-4 flex items-center justify-center">
                                            <Tag className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="font-mono text-[10px] text-gray-400 mt-2">
                                        *Referral supports your local community.
                                    </p>
                                </div>

                                {/* Mock Payment Method */}
                                <div className="opacity-50 pointer-events-none grayscale">
                                    <label className="font-mono text-xs font-bold text-gray-400 block mb-2">PAYMENT METHOD (SECURE)</label>
                                    <div className="border-2 border-gray-200 p-4 flex items-center gap-4 bg-gray-50">
                                        <CreditCard className="w-6 h-6 text-gray-400" />
                                        <span className="font-mono text-sm text-gray-500">•••• •••• •••• 4242</span>
                                        <span className="font-mono text-xs text-brand-blue ml-auto font-bold">VISA</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('booking')}
                                        disabled={isProcessing}
                                        className="flex-1 border-2 border-brand-charcoal text-brand-charcoal font-bold uppercase py-4 hover:bg-gray-100 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={isProcessing}
                                        className="flex-[2] bg-brand-red text-white font-black uppercase py-4 hover:bg-brand-charcoal transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_#1A1A1A]"
                                    >
                                        {isProcessing ? 'Processing...' : 'Pay & Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-4">
                            <Mono className="text-[10px] text-gray-400">Encrypted via Stripe • THAIKICK Guarantee</Mono>
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
};

export default BookingPage;