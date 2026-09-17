import React, { useState } from 'react';
import { ChevronRight, User, Settings, HelpCircle, LogOut } from 'lucide-react';

const Header = ({ user, handleLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 w-full sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Left side empty for now as requested */}
      </div>
      <div className="flex items-center gap-5">
        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors outline-none"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
              style={{ backgroundColor: '#0b5299', color: '#ffffff' }}
            >
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-sm font-bold text-slate-800">{user?.username || 'Suresh Pantham'}</span>
              <span className="text-[11px] text-slate-500 leading-none mt-0.5">{user?.role || 'Administrator'}</span>
            </div>
            <ChevronRight size={16} className={`text-slate-400 ml-1 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
          </button>

          {showProfileMenu && (
            <>
              {/* Invisible overlay to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              ></div>

              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-2 flex flex-col gap-1 z-50">
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium outline-none">
                  <User size={16} /> My Profile
                </button>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium outline-none">
                  <Settings size={16} /> Settings
                </button>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium outline-none">
                  <HelpCircle size={16} /> Help & Support
                </button>
                <div className="h-px bg-slate-100 my-1 w-full"></div>
                <button
                  onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors outline-none"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
