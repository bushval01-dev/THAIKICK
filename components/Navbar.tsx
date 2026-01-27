import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../lib/types';

interface NavbarProps {
  activeUser: User | null;
  loginAs: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeUser, loginAs }) => {
  return (
    <nav className="h-[100px] border-b border-brand-charcoal/10 sticky top-0 bg-[#F9F9F9]/90 backdrop-blur-md z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-black text-2xl text-brand-blue tracking-tighter flex items-center gap-1 group">
          THAI<span className="text-brand-red group-hover:text-brand-charcoal transition-colors">KICK</span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex gap-10">
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Gyms</Link>
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Camps</Link>
          {activeUser && (
            <Link 
              to={activeUser.role === 'customer' ? '/dashboard' : activeUser.role === 'owner' ? '/owner' : '/admin'} 
              className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <select 
                className="bg-transparent font-mono text-[10px] uppercase text-right focus:outline-none cursor-pointer text-gray-500 hover:text-brand-charcoal"
                onChange={(e) => loginAs(e.target.value)}
                value={activeUser?.id || ''}
              >
                <option value="">GUEST</option>
                <option value="u_cust1">ALEX (User)</option>
                <option value="u_owner1">SOMCHAI (Owner)</option>
                <option value="u_admin">MASTER (Admin)</option>
              </select>
              {activeUser && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  <span className="font-bold text-xs uppercase text-brand-charcoal">{activeUser.name.split(' ')[0]}</span>
                </div>
              )}
           </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;