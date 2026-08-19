import React, { useState } from "react";
import { HardHat } from "lucide-react";

export default function Logo({
  className = "",
  showText = true,
  darkText = false,
  logoSrc = "/logo.png",
}: {
  className?: string;
  showText?: boolean;
  darkText?: boolean;
  logoSrc?: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Bare Logo Icon */}
      <div className="relative flex items-center justify-center h-9 sm:h-10 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105">
        {!hasError ? (
          <img
            src={logoSrc}
            alt="Логотип БелТехКомпания"
            className="h-full w-auto object-contain drop-shadow-sm"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-9 w-9 text-white">
            <HardHat className="w-6 h-6 stroke-[2.5]" />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex items-center select-none text-left font-sans leading-none">
          <span
            className={`font-heading font-black text-lg sm:text-xl tracking-tight leading-none ${
              darkText ? "text-[#1a1a1a]" : "text-white"
            }`}
          >
            БелТех<span className={darkText ? "text-[#f5901e]" : "text-neutral-100"}>Компания</span>
          </span>
        </div>
      )}
    </div>
  );
}