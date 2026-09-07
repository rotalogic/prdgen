import React from 'react';

// Fixed background for every wizard step (product type through result).
// Unlike CosmicBackground, this one isn't user-configurable at all.
export const WizardBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#04060C]">
    <img
      src="/assets/wallpaper/wizard-bg.jpg"
      alt=""
      className="absolute inset-0 w-full h-full object-cover object-center"
    />
    <div className="absolute inset-0 bg-[#050711]/70" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-[#070A16]/50 to-[#03050B]/70" />
  </div>
);
