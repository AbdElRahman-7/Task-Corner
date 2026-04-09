"use client";

import Link from "next/link";
import Filters from "../Filters/Filters";
import ThemeToggle from "@components/ThemeProvider/ThemeToggle";

const Header = () => {
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
        <Filters compact={true} />
      </div>

      <div className="header__right">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;