"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@store/index";
import { logout } from "@store/authSlice";
import { toast } from "react-hot-toast";
import Filters from "../Filters/Filters";
import ThemeToggle from "@components/ThemeProvider/ThemeToggle";
import type { AppDispatch } from "@store/index";
import { usePathname } from "next/navigation";
import { LogOut, Users } from "lucide-react";

const Header = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  const isAuthPage = pathname?.includes("/auth/") || pathname === "/login" || pathname === "/signup";

  return (
    <header className="header px-4 md:px-8">
      <div className="header__left">
        <Link href="/" className="header__logo">
          <div className="header__icon bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="4" width="5" height="16" rx="2" />
              <rect x="9.5" y="4" width="5" height="11" rx="2" />
              <rect x="16" y="4" width="5" height="8" rx="2" />
            </svg>
          </div>
          <h1 className="header__title hidden sm:block">
            Task<span>Corner</span>
          </h1>
        </Link>
      </div>

      <div className="header__center flex-1 max-w-xl px-4 hidden md:block">
        {!isAuthPage && <Filters compact={true} />}
      </div>

      <div className="header__right gap-2 md:gap-4">
        {mounted && token && (
          <Link 
            href="/main/admin/users" 
            title="User Management"
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all text-gray-500 dark:text-gray-400"
          >
            <Users size={20} strokeWidth={2.5} />
          </Link>
        )}
        
        <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block" />
        
        <ThemeToggle />
        
        {mounted && token && (
          <button 
            onClick={handleLogout} 
            className="logoutBtn flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-bold transition-all active:scale-95" 
            title="Logout"
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span className="hidden md:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;