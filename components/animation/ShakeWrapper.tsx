"use client";

import { ReactNode } from "react";

interface ShakeWrapperProps {
  active: boolean;
  children: ReactNode;
}

export default function ShakeWrapper({ active, children }: ShakeWrapperProps) {
  return (
    <>
      <div className={active ? "animate-seoul-shake" : ""}>
        {children}
      </div>

      <style jsx global>{`
        @keyframes seoul-shake {
          0% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-5px, 0, 0); }
          40% { transform: translate3d(5px, 0, 0); }
          60% { transform: translate3d(-4px, 0, 0); }
          80% { transform: translate3d(4px, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        .animate-seoul-shake {
          animation: seoul-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          will-change: transform;
        }
      `}</style>
    </>
  );
}