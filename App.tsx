
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Square, TrendingUp } from 'lucide-react';

import AffiliateTracker from './components/AffiliateTracker';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import OwnerDashboard from './components/OwnerDashboard'; // Import new component
import AnalyticsDashboard from './components/AnalyticsDashboard'; // New Import
import BookingPage from './components/BookingPage';

import { BOOKINGS, AFFILIATE_APPLICATIONS } from './lib/data';
import { USERS } from './lib/auth-data';
import { Gym, User, Booking } from './lib/types';
import {
  getGyms,
  getUserBookings,
  createAffiliateApplication,
  getAffiliateApplications,
  updateAffiliateApplicationStatus,
  updateUserAffiliateStatus,
  getAnnouncements, // Added import
  getAllBookings,
  getGymBookings
} from './services/dataService';
import { getCurrentUser } from './services/authService';
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
  const [announcements, setAnnouncements] = useState<any[]>([]);

  React.useEffect(() => {
    getAnnouncements().then(setAnnouncements);
  }, []);

  const handleBookClick = (gym: Gym) => {
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

      {/* News Ticker / Announcements */}
      {announcements.length > 0 && (
        <div className="mb-12 bg-brand-charcoal text-white p-6 border-l-4 border-brand-red animate-reveal shadow-[8px_8px_0px_0px_#AE3A17]">
          <h3 className="font-black uppercase tracking-widest text-sm mb-4 text-brand-red flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
            Ring Side News
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.slice(0, 3).map((news: any) => (
              <div key={news.id} className="border border-gray-700 p-4 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="font-bold uppercase text-lg mb-2 text-white">{news.title}</div>
                <p className="font-mono text-xs text-gray-400 leading-relaxed mb-3">
                  {news.content}
                </p>
                <div className="text-[10px] font-mono text-brand-blue uppercase">{new Date(news.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  // Filter bookings for this user
  const myBookings = bookings.filter(b => b.userId === user.id);

  // Sort by date (newest first)
  const sortedBookings = [...myBookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeBookings = sortedBookings.filter(b =>
    (b.status === 'confirmed') && new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const pastBookings = sortedBookings.filter(b =>
    !activeBookings.includes(b)
  );

  const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-gray-200 text-gray-500";
    if (status === 'confirmed') color = "bg-brand-blue text-white";
    if (status === 'completed') color = "bg-green-500 text-white";
    if (status === 'cancelled') color = "bg-red-500 text-white";

    return (
      <span className={`${color} px-2 py-1 font-mono text-[10px] uppercase font-bold`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardContainer title={`Welcome Back, ${user.name.split(' ')[0]}`} subtitle={`Fighter Dashboard // ID: ${user.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">

          {/* Section 1: Active Bookings */}
          <BlockTable title="Active & Upcoming Sessions">
            {activeBookings.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm text-gray-400">NO ACTIVE BOOKINGS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {activeBookings.map(b => (
                  <div key={b.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-brand-bone transition-colors group">
                    <div className="flex items-center gap-6 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 flex items-center justify-center border-2 border-brand-charcoal font-black text-sm bg-brand-bone text-brand-charcoal`}>
                        {b.type === 'private' ? 'PVT' : 'STD'}
                      </div>
                      <div>
                        <div className="font-black text-lg uppercase leading-none mb-1 group-hover:text-brand-red transition-colors">{b.gymName}</div>
                        <Mono className="text-gray-500">{b.date} • {b.trainerName || 'No Trainer'}</Mono>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold mb-1">฿{b.totalPrice}</div>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

          {/* Section 2: History */}
          <BlockTable title="Booking History">
            {pastBookings.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-gray-400">NO HISTORY FOUND</div>
            ) : (
              <div className="divide-y-2 divide-gray-100 opacity-80">
                {pastBookings.map(b => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50">
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <div className="font-mono text-xs text-gray-400 w-24">{b.date}</div>
                      <div className="font-bold text-sm uppercase text-gray-600">{b.gymName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={b.status} />
                      <div className="font-mono text-sm text-gray-400">฿{b.totalPrice}</div>
                    </div>
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

// Inline OwnerDashboard removed in favor of external component


const App: React.FC = () => {
  /* Auth State */
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Default to loading

  /* App Data */
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); // Start empty, fetch real data
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

    // 2. Auth Logic (Merged)
    const handleUserUpdate = async (session: any) => {
      if (!session?.user) {
        if (mounted) {
          setActiveUser(null);
          setBookings([]);
          setIsAuthChecking(false);
        }
        return;
      }

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

      try {
        // Parallel: Fetch Profile + Fetch Bookings
        const [fullUser, userBookings] = await Promise.all([
          getCurrentUser(),
          getUserBookings(session.user.id)
        ]);

        if (mounted) {
          let bookingsToShow = userBookings;

          if (fullUser) {
            setActiveUser(fullUser);
            // If Admin, fetch all applications & ALL bookings
            // If Admin OR Owner (Super User), fetch all applications & ALL bookings for now
            if (fullUser.role === 'admin' || fullUser.role === 'owner') {
              bookingsToShow = await getAllBookings();
              getAffiliateApplications().then(apps => {
                if (mounted) setApplications(apps);
              });
            }
            // Logic for specific "Gym Owner" scoped dashboard disabled temporarily as per request
            /* 
            else if (fullUser.role === 'owner') {
               const latestGyms = await getGyms();
               const myGym = latestGyms.find(g => g.ownerId === fullUser.id);
               if (myGym) {
                  bookingsToShow = await getGymBookings(myGym.id);
               }
            }
            */
          }
          setBookings(bookingsToShow);
        }
      } catch (err) {
        console.warn("Failed to load user data", err);
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    };



    // Initialize
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserUpdate(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserUpdate(session);
    });

    // Override cleanup to handle subscription
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateGym = (updatedGym: Gym) => {
    setGyms(gyms.map(g => g.id === updatedGym.id ? updatedGym : g));
  };

  const handleAffiliateRequest = async () => {
    if (!activeUser) return;
    try {
      await createAffiliateApplication(activeUser.id, "Requested via dashboard");
      setActiveUser({ ...activeUser, affiliateStatus: 'pending' });
      alert("APPLICATION SUBMITTED");
    } catch (error) {
      console.error("Affiliate request failed", error);
      alert("Error submitting application");
    }
  };

  const handleAffiliateApproval = async (appId: string, approved: boolean) => {
    try {
      // 1. Update Application Status
      const status = approved ? 'approved' : 'rejected';
      const app = await updateAffiliateApplicationStatus(appId, status);

      // 2. Update Local State (Remove from pending list)
      setApplications(applications.filter(a => a.id !== appId));

      // 3. Update User Status if Approved
      if (approved) {
        const userId = app.user_id; // From DB return
        // Generate a simple code: First name + random number
        // We need to fetch the user name or just use a random code for now if name not available easily here
        // But actually getAffiliateApplications returns user name. 
        // Let's assume we can generate a code.
        const code = `fighter${Math.floor(Math.random() * 10000)}`;

        await updateUserAffiliateStatus(userId, true, 'active', code);
      } else {
        await updateUserAffiliateStatus(app.user_id, false, 'rejected'); // Update status to rejected
      }

    } catch (error) {
      console.error("Approval failed", error);
      alert("Action failed");
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
            <Route path="/owner" element={activeUser?.role === 'owner' ? <AdminDashboard bookings={bookings} applications={applications} handleApprove={handleAffiliateApproval} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/admin" element={activeUser?.role === 'admin' ? <AdminDashboard bookings={bookings} applications={applications} handleApprove={handleAffiliateApproval} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/analytics" element={(activeUser?.role === 'admin' || activeUser?.role === 'owner') ? <AnalyticsDashboard bookings={bookings} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
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


      </div>
    </HashRouter>
  );
};

export default App;