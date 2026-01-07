"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkSession } from "@/app/actions/auth";

export default function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSession().then((result) => {
      setIsLoggedIn(result.isLoggedIn);
      setRedirectUrl(result.redirectUrl);
    });
  }, []);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 flex justify-center pointer-events-none pt-2"
    >
      <div
        className={`pointer-events-auto flex items-center justify-between rounded-full border-[3px] border-[color:var(--periwinkle)] transition-all duration-500 ease-in-out ${isScrolled
            ? "w-[88%] h-[48px] bg-[color:var(--white)]/90 px-3 backdrop-blur-sm mt-0 sm:w-[90%] sm:h-14 sm:px-4 md:w-[620px]"
            : "w-[94%] h-[56px] bg-transparent px-3 mt-1 shadow-none backdrop-blur-none sm:w-[95%] sm:h-20 sm:px-6 md:w-[90%]"
          }`}
      >
        <Link href="/" className="flex items-center">
          <img
            src="/moooday_black-removed.png"
            alt="The Mooody"
            className={`block w-auto self-center transition-all duration-500 ${isScrolled ? "h-7 sm:h-9" : "h-8 sm:h-12"
              }`}
          />
        </Link>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {isLoggedIn ? (
            // Logged in - show "Back to app" button
            <Link
              href={redirectUrl || "/dashboard"}
              className={`cursor-pointer rounded-full border border-[color:var(--charcoal)] bg-[color:var(--orange)] font-semibold text-[color:var(--charcoal)] transition-all duration-500 ease-in-out hover:brightness-95 ${isScrolled
                  ? "px-2.5 py-0.5 text-[10px] sm:px-5 sm:py-2 sm:text-sm"
                  : "px-3 py-1 text-[10px] sm:px-6 sm:py-2.5 sm:text-sm"
                }`}
            >
              Back to App
            </Link>
          ) : (
            // Not logged in - show Login and Try for Free buttons
            <>
              <Link
                href="/sign-in"
                className={`cursor-pointer rounded-full border border-[color:var(--charcoal)] bg-[color:var(--white)] font-semibold text-foreground transition-all duration-500 ease-in-out hover:bg-surface-strong ${isScrolled
                    ? "px-2 py-0.5 text-[10px] sm:px-4 sm:py-2 sm:text-sm"
                    : "px-2.5 py-1 text-[10px] sm:px-5 sm:py-2.5 sm:text-sm"
                  }`}
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className={`cursor-pointer rounded-full border border-[color:var(--charcoal)] bg-[color:var(--orange)] font-semibold text-[color:var(--charcoal)] transition-all duration-500 ease-in-out hover:brightness-95 ${isScrolled
                    ? "px-2.5 py-0.5 text-[10px] sm:px-5 sm:py-2 sm:text-sm"
                    : "px-3 py-1 text-[10px] sm:px-6 sm:py-2.5 sm:text-sm"
                  }`}
              >
                Try for Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
