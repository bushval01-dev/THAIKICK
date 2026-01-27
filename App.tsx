
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Square, TrendingUp } from 'lucide-react';

import AffiliateTracker from './components/AffiliateTracker';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import BookingPage from './components/BookingPage';

import { BOOKINGS, AFFILIATE_APPLICATIONS } from './lib/data';
import { USERS } from './lib/auth-data';
import { Gym, User, Booking } from './lib/types';
import { getGyms } from './services/dataService'; // Import Service
import { getCurrentUser } from './services/authService'; // Import Auth Service
import { supabase } from './lib/supabaseClient';

// --- Shared Components ---

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

const Notification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed top-28 left-1/2 -translate-x-1/2 z-50 px-6 py-4 border-2 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_#1A1A1A] animate-reveal flex items-center gap-4 ${type === 'success' ? 'bg-white border-brand-charcoal text-brand-charcoal' : 'bg-brand-red text-white border-brand-charcoal'
    }`}>
    {type === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
    {message}
    <button onClick={onClose} className="ml-4 hover:opacity-50 font-black">X</button>
  </div>
);

const BlockInput: React.FC<{ label: string; value?: string; onChange?: (e: any) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="p-6 border-b md:border-b-0 md:border-r border-brand-charcoal last:border-r-0 md:border-gray-200">
    <label className="block font-mono text-xs text-brand-blue font-bold mb-2 uppercase">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-transparent border-none outline-none font-mono text-base text-brand-charcoal placeholder-gray-300"
    />
  </div>
);

// --- Page Components ---

const GymCard: React.FC<{ gym: Gym; onBook: () => void; isLarge?: boolean }> = ({ gym, onBook, isLarge = false }) => (
  <div className={`col-span-12 ${isLarge ? 'md:col-span-8' : 'md:col-span-4'} bg-white border border-gray-300 group opacity-0 animate-reveal fill-mode-forwards`}>
    {/* Image Container */}
    <div className="relative w-full h-[400px] overflow-hidden bg-gray-200">
      <img
        src={gym.images[0]}
        alt={gym.name}
        className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
      />
      {gym.isFlashSale && (
        <div className="absolute top-0 left-0 bg-brand-red text-white font-mono text-xs px-4 py-2 font-bold animate-pulse">
          FLASH SALE -{gym.flashSaleDiscount}%
        </div>
      )}
    </div>

    {/* Info Container */}
    <div className="p-8 relative">
      <div className="absolute -top-5 right-8 bg-brand-blue text-white font-mono font-bold px-6 py-3 text-sm shadow-sm">
        ฿{gym.basePrice} / DAY
      </div>

      <Mono className="text-gray-500 block mb-2">{gym.location}</Mono>
      <h3 className="text-3xl font-black uppercase text-brand-charcoal mb-4 leading-none">{gym.name}</h3>

      <div className="flex gap-2 mb-6 flex-wrap">
        {gym.trainers.slice(0, 2).map(t => (
          <span key={t.id} className="border border-gray-200 px-3 py-1 font-mono text-[10px] uppercase text-gray-500">
            {t.specialty}
          </span>
        ))}
        {isLarge && <span className="border border-gray-200 px-3 py-1 font-mono text-[10px] uppercase text-gray-500">Professional Ring</span>}
      </div>

      <div className="flex justify-end">
        <button onClick={onBook} className="font-mono text-xs font-bold uppercase text-brand-blue hover:text-brand-red border-b-2 border-brand-blue hover:border-brand-red transition-colors pb-1">
          Book Session
        </button>
      </div>
    </div>
  </div>
);

const HomePage: React.FC<{ user: User | null; gyms: Gym[]; setBookings: any }> = ({ user, gyms, setBookings }) => {
  const navigate = useNavigate();

  const handleBookClick = (gym: Gym) => {
    // We now route to a full page instead of a modal
    navigate(`/booking/${gym.id}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 pb-20">
      {/* Hero */}
      <div className="pt-20 lg:pt-32 pb-16 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-end">
        <div>
          <Mono className="text-brand-red block mb-6">Bangkok • Phuket • Chiang Mai</Mono>
          <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-brand-charcoal leading-[0.9] tracking-tight">
            FORGE YOUR<br /><span className="text-brand-red">LEGACY.</span>
          </h1>
        </div>
        <div className="font-mono text-sm leading-relaxed border-l-2 border-brand-blue pl-8 text-brand-charcoal opacity-80 mb-4 lg:mb-0">
          The world's most curated platform for authentic Muay Thai training.
          From backyard rings to world-class stadiums.
        </div>
      </div>

      {/* Booking Bar Component */}
      <div className="bg-white border-2 border-brand-charcoal grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] shadow-[12px_12px_0px_0px_#3471AE]">
        <BlockInput label="Location" placeholder="Where do you fight?" />
        <BlockInput label="Dates" placeholder="Select timeframe" type="date" />
        <BlockInput label="Discipline" placeholder="Muay Thai / Boxing" />
        <button className="bg-brand-red text-white font-black uppercase text-lg px-10 py-6 md:py-0 hover:bg-brand-charcoal transition-colors h-full">
          Search
        </button>
      </div>

      {/* Grid */}
      <div className="pt-24 pb-12 grid grid-cols-12 gap-y-12 md:gap-x-10">

        {/* Dynamic Cards */}
        {gyms.map((gym, index) => (
          <React.Fragment key={gym.id}>
            <GymCard gym={gym} onBook={() => handleBookClick(gym)} isLarge={index === 0} />
            {/* Insert Canvas Block after first item */}
            {index === 0 && (
              <div className="col-span-12 md:col-span-6 bg-brand-blue text-white p-12 flex flex-col justify-center animate-reveal" style={{ animationDelay: '0.2s' }}>
                <Mono className="text-brand-bone mb-4">Tradition</Mono>
                <h2 className="text-5xl font-black mb-6 uppercase">The Art of Eight Limbs</h2>
                <p className="opacity-90 leading-relaxed max-w-md mb-8">
                  Booking a gym shouldn't be a fight. We connect practitioners with verified camps that respect the lineage of the sport.
                </p>
                <a href="#" className="font-mono underline text-sm uppercase">Read Heritage Guide</a>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Fillers for the aesthetic if strictly 2 gyms */}
        {gyms.length < 3 && (
          <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 p-8 flex flex-col justify-between min-h-[400px]">
            <Mono className="text-gray-400">Placeholder</Mono>
            <h3 className="text-2xl font-black text-gray-300 uppercase">More gyms<br />coming soon</h3>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Components ---

const DashboardContainer: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal">
    <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex justify-between items-end">
      <div>
        <Mono className="text-brand-blue">{subtitle}</Mono>
        <h1 className="text-4xl font-black uppercase text-brand-charcoal mt-2">{title}</h1>
      </div>
      <div className="hidden md:block w-20 h-2 bg-brand-red"></div>
    </div>
    {children}
  </div>
);

const BlockTable: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-2 border-brand-charcoal bg-white">
    <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
      <h3 className="font-black uppercase tracking-wide text-sm">{title}</h3>
      <div className="flex gap-1">
        <Square className="w-3 h-3 text-brand-charcoal fill-current" />
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const CustomerDashboard: React.FC<{ user: User; bookings: Booking[]; requestAffiliate: () => void }> = ({ user, bookings, requestAffiliate }) => {
  const myBookings = bookings.filter(b => b.userId === user.id);

  return (
    <DashboardContainer title={`Welcome Back, ${user.name.split(' ')[0]}`} subtitle={`Fighter Dashboard // ID: ${user.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <BlockTable title="Upcoming Sessions">
            {myBookings.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm text-gray-400">NO ACTIVE BOOKINGS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {myBookings.map(b => (
                  <div key={b.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-brand-bone transition-colors group">
                    <div className="flex items-center gap-6 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 flex items-center justify-center border-2 border-brand-charcoal font-black text-sm ${b.status === 'confirmed' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {b.type === 'private' ? 'PVT' : 'STD'}
                      </div>
                      <div>
                        <div className="font-black text-lg uppercase leading-none mb-1 group-hover:text-brand-red transition-colors">{b.gymName}</div>
                        <Mono className="text-gray-500">{b.date}</Mono>
                      </div>
                    </div>
                    <div className="font-mono text-lg font-bold">฿{b.totalPrice}</div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>
        </div>

        <div>
          <div className="bg-brand-charcoal text-white p-8 border-2 border-brand-charcoal shadow-[8px_8px_0px_0px_#AE3A17] relative overflow-hidden">
            <Mono className="text-brand-bone opacity-70">Affiliate Network</Mono>

            <div className="mt-8 mb-10 relative z-10">
              <div className="text-5xl font-black">
                {user.affiliateStatus === 'active' ? `฿${user.affiliateEarnings}` : 'INACTIVE'}
              </div>
              <div className="font-mono text-xs text-brand-red mt-2 uppercase font-bold tracking-widest">{user.affiliateStatus} STATUS</div>
            </div>

            {user.affiliateStatus === 'none' && (
              <button onClick={requestAffiliate} className="w-full bg-white text-brand-charcoal font-black uppercase py-4 hover:bg-brand-blue hover:text-white transition-colors relative z-10">
                Join Program
              </button>
            )}

            {user.affiliateStatus === 'active' && (
              <div className="p-4 bg-white/10 border border-white/20 font-mono text-xs break-all relative z-10">
                ?ref={user.affiliateCode}
              </div>
            )}

            {/* Background Pattern */}
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <TrendingUp className="w-48 h-48" />
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};

const OwnerDashboard: React.FC<{ user: User; gyms: Gym[]; updateGym: (gym: Gym) => void }> = ({ user, gyms, updateGym }) => {
  const myGym = gyms.find(g => g.ownerId === user.id);
  if (!myGym) return <div className="p-12 font-mono">SYSTEM ERROR: GYM NOT FOUND</div>;

  return (
    <DashboardContainer title={myGym.name} subtitle="Facility Management">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white border-2 border-brand-charcoal p-6">
          <Mono className="text-brand-blue">Standard Rate</Mono>
          <div className="text-4xl font-black mt-2">฿{myGym.basePrice}</div>
        </div>
        <div className="bg-white border-2 border-brand-charcoal p-6">
          <Mono className="text-brand-blue">Roster Size</Mono>
          <div className="text-4xl font-black mt-2">{myGym.trainers.length} <span className="text-lg text-gray-400">KRU</span></div>
        </div>
        <div
          onClick={() => updateGym({ ...myGym, isFlashSale: !myGym.isFlashSale })}
          className={`p-6 border-2 border-brand-charcoal cursor-pointer transition-colors ${myGym.isFlashSale ? 'bg-brand-red text-white' : 'bg-white hover:bg-gray-50'}`}
        >
          <Mono className={myGym.isFlashSale ? "text-brand-bone" : "text-brand-blue"}>Promotion Status</Mono>
          <div className="text-4xl font-black mt-2 uppercase">{myGym.isFlashSale ? 'Active' : 'Offline'}</div>
        </div>
      </div>

      <BlockTable title="Trainer Roster">
        <div className="divide-y-2 divide-gray-100">
          {myGym.trainers.map(t => (
            <div key={t.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <img src={t.image} className="w-16 h-16 object-cover grayscale border border-brand-charcoal" />
                <div>
                  <div className="font-black text-lg uppercase">{t.name}</div>
                  <Mono className="text-brand-blue">{t.specialty}</Mono>
                </div>
              </div>
              <div className="font-mono font-bold">+฿{t.pricePerSession}</div>
            </div>
          ))}
        </div>
      </BlockTable>
    </DashboardContainer>
  );
};

const App: React.FC = () => {
  /* Auth State */
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Default to loading

  /* App Data */
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [applications, setApplications] = useState<any[]>(AFFILIATE_APPLICATIONS);

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Initial Data Fetch & Auth Subscription
  React.useEffect(() => {
    let mounted = true;

    // 0. Check for Redirect Hash (Email Confirmation)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      setNotification({ message: "SYSTEM ACCESS GRANTED // EMAIL VERIFIED", type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    }

    // 1. Fetch Gyms
    const fetchGyms = async () => {
      const data = await getGyms();
      if (mounted) setGyms(data);
    };
    fetchGyms();

    // 2. Optimized Auth Check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // A. Immediate Feedback: Set basic user from session (fast)
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Member',
            role: 'customer',
            avatar: 'https://via.placeholder.com/150',
            isAffiliate: false,
            affiliateEarnings: 0,
            affiliateStatus: 'none'
          };

          if (mounted) setActiveUser(basicUser);

          // B. Fetch Full Profile (Background)
          getCurrentUser().then(fullUser => {
            if (mounted && fullUser) setActiveUser(fullUser);
          });
        }
      } catch (e) {
        console.warn("Auth init warning:", e);
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    };

    initAuth();

    // 3. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = await getCurrentUser();
        if (mounted) setActiveUser(user);
        if (mounted) setIsAuthChecking(false);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setActiveUser(null);
        if (mounted) setIsAuthChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateGym = (updatedGym: Gym) => {
    setGyms(gyms.map(g => g.id === updatedGym.id ? updatedGym : g));
  };

  const handleAffiliateRequest = () => {
    if (!activeUser) return;
    const newApp = {
      id: `app_${Date.now()}`,
      userId: activeUser.id,
      userName: activeUser.name,
      reason: "Requested via dashboard",
      status: 'pending' as const
    };
    setApplications([...applications, newApp]);
    setActiveUser({ ...activeUser, affiliateStatus: 'pending' });
    alert("APPLICATION SUBMITTED");
  };

  const handleAffiliateApproval = (appId: string, approved: boolean) => {
    setApplications(applications.filter(a => a.id !== appId));
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    if (approved) {
      const userToUpdate = USERS.find(u => u.id === app.userId);
      if (userToUpdate) {
        userToUpdate.isAffiliate = true;
        userToUpdate.affiliateStatus = 'active';
        userToUpdate.affiliateCode = userToUpdate.name.replace(/\s+/g, '').toLowerCase();
      }

      if (activeUser?.id === app.userId) {
        setActiveUser({ ...activeUser, isAffiliate: true, affiliateStatus: 'active', affiliateCode: activeUser.name.replace(/\s+/g, '').toLowerCase() });
      }
    }
  };

  // -- LOADING SCREEN --
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F9F9]">
        <div className="font-black text-3xl text-brand-charcoal animate-pulse">
          THAI<span className="text-brand-red">KICK</span>
        </div>
        <Mono className="text-brand-blue mt-4">Authenticating...</Mono>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <AffiliateTracker />
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        <Navbar activeUser={activeUser} onLogout={() => setActiveUser(null)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/booking/:gymId" element={<BookingPage gyms={gyms} user={activeUser} setBookings={setBookings} />} />
            <Route path="/dashboard" element={activeUser?.role === 'customer' ? <CustomerDashboard user={activeUser} bookings={bookings} requestAffiliate={handleAffiliateRequest} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/owner" element={activeUser?.role === 'owner' ? <OwnerDashboard user={activeUser} gyms={gyms} updateGym={handleUpdateGym} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/admin" element={activeUser?.role === 'admin' ? <AdminDashboard bookings={bookings} applications={applications} handleApprove={handleAffiliateApproval} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
          </Routes>
        </main>

        <footer className="bg-brand-charcoal text-white py-24">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link to="/" className="font-black text-2xl text-white tracking-tighter flex items-center gap-1 mb-6">
                THAI<span className="text-brand-blue">KICK</span>
              </Link>
              <p className="font-mono text-sm opacity-50 max-w-xs leading-relaxed">
                Standardizing the Muay Thai experience for the global community.
                Built with respect for the tradition.
              </p>
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6 text-brand-bone">Regions</h4>
              <ul className="font-mono text-sm opacity-60 space-y-3">
                <li>Central Thailand</li>
                <li>Isaan Region</li>
                <li>Southern Islands</li>
                <li>Northern Highlands</li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6 text-brand-bone">Support</h4>
              <ul className="font-mono text-sm opacity-60 space-y-3">
                <li>Visa Info</li>
                <li>Insurance</li>
                <li>Partner with us</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
        </footer>

        <Chatbot />

        {/* -- DEBUG BAR -- */}
        <div className="fixed bottom-0 left-0 w-full bg-yellow-400 text-black font-mono text-[10px] p-1 text-center font-bold z-50 opacity-80 hover:opacity-100">
          DEBUG: DB_URL = {import.meta.env.VITE_SUPABASE_URL || 'NOT_LOADED'}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;