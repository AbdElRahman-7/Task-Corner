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
    <header className="header">
      <div className="header__left">
        <Link href="/" className="header__logo">
          <div className="header__icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="4" width="5" height="16" rx="2" opacity="0.9" />
              <rect x="9.5" y="4" width="5" height="11" rx="2" opacity="0.6" />
              <rect x="16" y="4" width="5" height="8" rx="2" opacity="0.3" />
            </svg>
          </div>
          <h1 className="header__title">
            Task<span>Corner</span>
          </h1>
        </Link>
      </div>

      <div className="header__center">
        {!isAuthPage && <Filters compact={true} />}
      </div>

      <div className="header__right">
        {mounted && token && (
          <Link href="/main/admin/users" title="User Management">
            <Users className="w-5 h-5" />
          </Link>
        )}
        <ThemeToggle />
        {mounted && token && (
          <button onClick={handleLogout} className="logoutBtn" title="Logout">
            <LogOut />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;