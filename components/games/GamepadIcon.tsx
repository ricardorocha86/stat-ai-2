import React from 'react';

export default function GamepadIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7h9c2 0 3 1.5 3.5 3.5l1 6c.5 3-2 4-3.5 2L15 16H9l-2.5 2.5c-1.5 2-4 1-3.5-2l1-6C4.5 8.5 5.5 7 7.5 7Z" />
      <path strokeLinecap="round" d="M7 10v4m-2-2h4m7-1h.01m2 2h.01" />
    </svg>
  );
}
