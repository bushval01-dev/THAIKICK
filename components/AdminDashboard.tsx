import React, { useState } from 'react';
import { Shield, Check, X, Users, DollarSign, Activity } from 'lucide-react';
import { USERS } from '../lib/auth-data';
import { Booking, AffiliateApplication } from '../lib/types';

interface AdminDashboardProps {
  bookings: Booking[];
  applications: AffiliateApplication[];
  handleApprove: (id: string, ok: boolean) => void;
}

// Internal Sub-components for structure
const BlockTable: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="border-2 border-brand-charcoal bg-white h-full">
    <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
      <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-brand-charcoal"></div>
        <div className="w-2 h-2 border border-brand-charcoal"></div>
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ bookings, applications, handleApprove }) => {
  // We use local state for specific admin-only view toggles if needed, 
  // but mostly rely on props for the shared application state.
  
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal">
      {/* Header */}
      <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex justify-between items-end">
        <div>
          <Mono className="text-brand-blue">System Administration</Mono>
          <h1 className="text-4xl font-black uppercase text-brand-charcoal mt-2">Overseer Console</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase">
          <Shield className="w-4 h-4" />
          Master Access
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
          <div>
            <Mono className="text-brand-blue">Total Platform Revenue</Mono>
            <div className="text-3xl font-black mt-2">฿{totalRevenue.toLocaleString()}</div>
          </div>
          <DollarSign className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
          <div>
            <Mono className="text-brand-blue">Affiliate Payouts</Mono>
            <div className="text-3xl font-black mt-2">฿{totalCommission.toLocaleString()}</div>
          </div>
          <Users className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
           <div>
            <Mono className="text-brand-blue">Pending Requests</Mono>
            <div className="text-3xl font-black mt-2">{applications.length}</div>
          </div>
          <Activity className="w-8 h-8 text-brand-red animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Actions */}
        <div className="space-y-12">
          
          {/* Affiliate Approval Section */}
          <BlockTable title="Pending Affiliates" icon={<Users className="w-4 h-4" />}>
            {applications.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm text-gray-400">NO PENDING APPLICATIONS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {applications.map(app => (
                  <div key={app.id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-brand-bone border border-brand-charcoal flex items-center justify-center font-bold text-xs">
                           {app.userName.charAt(0)}
                         </div>
                         <div>
                           <div className="font-black text-sm uppercase text-brand-charcoal">{app.userName}</div>
                           <Mono className="text-gray-400">ID: {app.id}</Mono>
                         </div>
                      </div>
                      <div className="bg-brand-blue text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        Action Reqd
                      </div>
                    </div>
                    
                    <div className="mb-6 pl-11">
                      <p className="font-mono text-xs text-brand-blue mb-1 uppercase font-bold">Statement:</p>
                      <p className="text-sm text-gray-600 font-mono bg-brand-bone p-3 border border-gray-200 italic">
                        "{app.reason}"
                      </p>
                    </div>

                    <div className="flex gap-4 pl-11">
                      <button 
                        onClick={() => handleApprove(app.id, true)} 
                        className="flex-1 bg-brand-charcoal text-white font-bold uppercase text-xs py-3 hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleApprove(app.id, false)} 
                        className="flex-1 border-2 border-brand-charcoal text-brand-charcoal font-bold uppercase text-xs py-3 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

           {/* User Registry (Read-only from auth-data) */}
           <BlockTable title="User Registry (Auth Data)" icon={<Shield className="w-4 h-4" />}>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-bone font-mono text-xs font-bold text-brand-blue uppercase sticky top-0">
                  <tr>
                    <th className="p-4 border-b-2 border-brand-charcoal">User</th>
                    <th className="p-4 border-b-2 border-brand-charcoal">Role</th>
                    <th className="p-4 border-b-2 border-brand-charcoal text-right">Affiliate</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {USERS.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-brand-bone/50">
                      <td className="p-4">
                        <div className="font-bold text-brand-charcoal">{user.name}</div>
                        <div className="text-gray-400">{user.email}</div>
                      </td>
                      <td className="p-4 uppercase text-gray-600">{user.role}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 border ${
                          user.affiliateStatus === 'active' ? 'border-green-600 text-green-700 bg-green-50' : 
                          user.affiliateStatus === 'pending' ? 'border-brand-blue text-brand-blue bg-blue-50' : 'border-gray-200 text-gray-400'
                        }`}>
                          {user.affiliateStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </BlockTable>

        </div>

        {/* Right Column: Data */}
        <div className="space-y-12">
          {/* Booking Ledger */}
          <BlockTable title="Transaction Ledger" icon={<Activity className="w-4 h-4" />}>
              {bookings.length === 0 ? (
                 <div className="p-8 text-center font-mono text-sm text-gray-400">NO TRANSACTIONS</div>
              ) : (
                <div className="divide-y-2 divide-gray-100">
                   {bookings.slice().reverse().map(b => (
                     <div key={b.id} className="p-4 hover:bg-gray-50 transition-colors">
                       <div className="flex justify-between items-center mb-2">
                         <span className="font-mono text-xs text-gray-400">{b.date}</span>
                         <span className={`font-mono text-[10px] font-bold px-2 uppercase ${b.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-brand-blue bg-blue-50'}`}>
                           {b.status}
                         </span>
                       </div>
                       <div className="flex justify-between items-center">
                         <div>
                            <div className="font-bold text-sm text-brand-charcoal uppercase">{b.gymName}</div>
                            <div className="font-mono text-xs text-gray-500">User: {b.userName.split(' ')[0]}</div>
                         </div>
                         <div className="text-right">
                            <div className="font-black text-brand-charcoal">฿{b.totalPrice}</div>
                            {b.commissionAmount > 0 && (
                              <div className="font-mono text-[10px] text-brand-red">
                                Comm: ฿{b.commissionAmount}
                              </div>
                            )}
                         </div>
                       </div>
                     </div>
                   ))}
                </div>
              )}
          </BlockTable>

           {/* System Logs (Static) */}
           <div className="bg-brand-charcoal text-gray-400 p-6 border-2 border-brand-charcoal font-mono text-[10px] space-y-2">
             <div className="text-white font-bold border-b border-gray-600 pb-2 mb-2">SYSTEM LOGS</div>
             <p>> [SYSTEM] Initialized 3 Gym nodes</p>
             <p>> [SYSTEM] Loaded {USERS.length} user profiles from auth-data</p>
             <p>> [AFFILIATE] Tracking cookie expiry set to 30 days</p>
             <p>> [BOT] Kru AI agent connected successfully</p>
             <p className="animate-pulse">> [MONITOR] Watching for new bookings...</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;