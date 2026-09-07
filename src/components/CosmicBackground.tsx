import React from 'react';

interface CosmicBackgroundProps {
  dimOpacity?: number; // 0 to 1, default ~0.25 to 0.35 for readability
}

// Homepage-only backdrop (hidden behind the 3D hero's own opaque content, so
// its only real visible use today is the vignette showing through gaps).
// High-fidelity Cosmic Lava Mountain & Fiery Eclipse Planet, vector-drawn.
export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  dimOpacity = 0.2
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#04060C]">
      {/* 1. Deep Space Canvas with Stars and Nebulae */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1920 1080"
      >
        <defs>
          {/* Cosmic Nebula Gradients */}
          <radialGradient id="spaceNebula" cx="75%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#ff4500" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#bd2a06" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#0B0F1F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#03050A" stopOpacity="1" />
          </radialGradient>

          {/* Fiery Corona Glow for the Eclipsed Celestial Body */}
          <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#FFA028" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#FF4500" stopOpacity="0.6" />
            <stop offset="95%" stopColor="#B31A00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Planet Edge Incandescent Rim */}
          <linearGradient id="planetRimGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE89C" />
            <stop offset="30%" stopColor="#FF6A00" />
            <stop offset="70%" stopColor="#E62200" />
            <stop offset="100%" stopColor="#120402" />
          </linearGradient>

          {/* Mountain Granite Texture Gradients */}
          <linearGradient id="peakDark1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E2838" />
            <stop offset="40%" stopColor="#0F1624" />
            <stop offset="100%" stopColor="#050811" />
          </linearGradient>

          <linearGradient id="peakDark2" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#2D3A4F" />
            <stop offset="30%" stopColor="#151E2D" />
            <stop offset="100%" stopColor="#080C14" />
          </linearGradient>

          {/* Glowing Molten Lava Fissure Gradient */}
          <linearGradient id="lavaVein" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1800" />
            <stop offset="50%" stopColor="#FF6200" />
            <stop offset="90%" stopColor="#FFAE00" />
            <stop offset="100%" stopColor="#FFF2A8" />
          </linearGradient>

          {/* Atmospheric Blur Filters */}
          <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="16" result="blur1" />
            <feGaussianBlur stdDeviation="32" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="coronaBlur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>

        {/* Space Base */}
        <rect width="1920" height="1080" fill="url(#spaceNebula)" />

        {/* Dense Starfield */}
        <g opacity="0.85">
          {/* Individual bright distant stars */}
          {[
            [120, 90, 1.5], [240, 150, 1], [350, 80, 2], [480, 220, 1.2],
            [610, 110, 1.8], [750, 190, 1], [880, 70, 2.2], [970, 260, 1.2],
            [1100, 140, 1.6], [1280, 190, 1.4], [1420, 95, 2], [1560, 210, 1.1],
            [170, 310, 1], [310, 380, 1.4], [520, 340, 1.8], [820, 310, 1.2],
            [1040, 390, 1.5], [1210, 340, 2], [1680, 120, 1.5], [1810, 240, 1.8],
            [90, 480, 1.2], [280, 520, 1.5], [440, 460, 1], [670, 490, 1.4]
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={0.4 + (i % 5) * 0.12} />
          ))}
        </g>

        {/* Space Nebula Smoke Clouds in Upper Sky */}
        <path
          d="M0,0 Q600,120 1200,40 T1920,200 L1920,0 Z"
          fill="#ff4d00"
          opacity="0.08"
          filter="url(#coronaBlur)"
        />
        <path
          d="M800,0 Q1400,280 1920,100 L1920,0 Z"
          fill="#ff7700"
          opacity="0.12"
          filter="url(#coronaBlur)"
        />

        {/* =========================================================================
            2. GIANT GLOWING ECLIPSE PLANET (Top Right)
           ========================================================================= */}
        <g transform="translate(1620, 240)">
          {/* Giant Atmospheric Backlight Halo */}
          <circle cx="0" cy="0" r="440" fill="url(#sunCorona)" filter="url(#coronaBlur)" />
          <circle cx="0" cy="0" r="320" fill="#FF4500" opacity="0.35" filter="url(#coronaBlur)" />

          {/* The Dark Planet Sphere Body */}
          <circle cx="0" cy="0" r="280" fill="#070A12" />

          {/* Blazing Crescent Rim Atmosphere */}
          <path
            d="M -198,-198 A 280 280 0 1 1 198,198 A 260 260 0 1 0 -185,-185 Z"
            fill="url(#planetRimGlow)"
            filter="url(#intenseGlow)"
          />

          {/* Molten Surface Fissures on Planet Face */}
          <path
            d="M 60,-180 Q 120,-100 80,0 Q 40,80 120,160 Q 90,90 110,-20 Z"
            fill="#FF5500"
            opacity="0.4"
            filter="url(#intenseGlow)"
          />
          <path
            d="M 120,-120 Q 180,-40 140,60"
            stroke="#FFA834"
            strokeWidth="3"
            fill="none"
            opacity="0.75"
            filter="url(#intenseGlow)"
          />
        </g>

        {/* Ambient Warm Glow behind the mountain ridges */}
        <path
          d="M 400,680 Q 1100,520 1800,620 L 1920,1080 L 0,1080 Z"
          fill="#ff4d00"
          opacity="0.18"
          filter="url(#coronaBlur)"
        />

        {/* =========================================================================
            3. DISTANT MOUNTAIN RANGE (Layer 1)
           ========================================================================= */}
        <polygon
          points="0,820 180,720 340,790 520,680 720,770 940,630 1120,710 1340,580 1560,670 1780,590 1920,680 1920,1080 0,1080"
          fill="#0B111D"
          opacity="0.9"
        />

        {/* Distant Ridge Lava Glow */}
        <path
          d="M 940,630 L 1120,710 L 1340,580 L 1560,670 L 1780,590"
          stroke="#FF4500"
          strokeWidth="4"
          fill="none"
          opacity="0.7"
          filter="url(#intenseGlow)"
        />

        {/* =========================================================================
            4. MIDGROUND MOUNTAINS (Layer 2 - High peaks with Snow Highlights)
           ========================================================================= */}
        {/* Peak Left */}
        <polygon
          points="60,1080 220,760 380,840 560,710 740,880 820,1080"
          fill="url(#peakDark1)"
        />
        {/* Snow on Peak Left */}
        <polygon
          points="220,760 250,810 200,820"
          fill="#BAC7DB"
          opacity="0.7"
        />
        <polygon
          points="560,710 600,770 540,780"
          fill="#BAC7DB"
          opacity="0.7"
        />

        {/* Central Dominant Jagged Peaks (Matching the uploaded image) */}
        <polygon
          points="580,1080 820,720 1020,590 1260,450 1480,680 1680,540 1920,720 1920,1080"
          fill="url(#peakDark2)"
        />

        {/* High Mountain Snow Summit Facets */}
        <polygon
          points="1260,450 1310,530 1250,560 1220,510"
          fill="#E2E8F0"
          opacity="0.85"
        />
        <polygon
          points="1020,590 1060,660 990,670"
          fill="#CBD5E1"
          opacity="0.8"
        />
        <polygon
          points="1680,540 1730,620 1660,640"
          fill="#CBD5E1"
          opacity="0.85"
        />

        {/* Snow slope crags */}
        <path
          d="M 1260,450 L 1290,560 L 1350,650 L 1400,740"
          stroke="#94A3B8"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 1020,590 L 1050,690 L 1090,780"
          stroke="#94A3B8"
          strokeWidth="2.5"
          fill="none"
          opacity="0.55"
        />

        {/* =========================================================================
            5. GLOWING MOLTEN LAVA VEINS & FISSURES (Intense Incandescent Orange)
           ========================================================================= */}
        {/* Ridge molten seam leading down from main peak */}
        <path
          d="M 1260,450 L 1230,530 L 1180,620 L 1120,710 L 980,830 L 880,950 L 820,1080"
          stroke="url(#lavaVein)"
          strokeWidth="8"
          fill="none"
          filter="url(#intenseGlow)"
        />
        <path
          d="M 1260,450 L 1230,530 L 1180,620 L 1120,710 L 980,830 L 880,950 L 820,1080"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="none"
          opacity="0.9"
        />

        {/* Valley Magma River */}
        <path
          d="M 1120,710 L 1200,780 L 1320,840 L 1460,910 L 1600,990 L 1740,1080"
          stroke="url(#lavaVein)"
          strokeWidth="10"
          fill="none"
          filter="url(#intenseGlow)"
        />
        <path
          d="M 1120,710 L 1200,780 L 1320,840 L 1460,910 L 1600,990 L 1740,1080"
          stroke="#FFF4C2"
          strokeWidth="3"
          fill="none"
        />

        {/* Right slope volcanic magma fractures */}
        <path
          d="M 1680,540 L 1640,640 L 1580,730 L 1520,820 L 1460,910"
          stroke="url(#lavaVein)"
          strokeWidth="6"
          fill="none"
          filter="url(#intenseGlow)"
        />
        <path
          d="M 1480,680 L 1540,760 L 1650,830 L 1800,910 L 1920,960"
          stroke="url(#lavaVein)"
          strokeWidth="7"
          fill="none"
          filter="url(#intenseGlow)"
        />

        {/* Base lava lake glow */}
        <ellipse
          cx="1280"
          cy="980"
          rx="520"
          ry="110"
          fill="#FF3700"
          opacity="0.32"
          filter="url(#coronaBlur)"
        />
        <ellipse
          cx="1350"
          cy="990"
          rx="320"
          ry="60"
          fill="#FFAA00"
          opacity="0.25"
          filter="url(#intenseGlow)"
        />

        {/* =========================================================================
            6. FOREGROUND PEAKS (Layer 3)
           ========================================================================= */}
        <polygon
          points="800,1080 1140,840 1280,750 1440,890 1620,1080"
          fill="#060912"
        />
        <polygon
          points="1280,750 1310,810 1260,820"
          fill="#94A3B8"
          opacity="0.5"
        />
        <path
          d="M 1280,750 L 1240,830 L 1210,920 L 1180,1080"
          stroke="url(#lavaVein)"
          strokeWidth="5"
          fill="none"
          filter="url(#intenseGlow)"
        />

        {/* Rising Ember Sparks */}
        {[
          [920, 810, 2], [1160, 680, 2.5], [1280, 580, 1.8], [1340, 640, 2.2],
          [1420, 720, 1.5], [1520, 610, 2], [1610, 530, 2.5], [1720, 480, 1.8],
          [1080, 740, 2], [1220, 630, 2.8], [1390, 790, 2], [1550, 700, 2.2]
        ].map(([cx, cy, r], idx) => (
          <circle
            key={`ember-${idx}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="#FFAA33"
            filter="url(#intenseGlow)"
            opacity={0.8}
          />
        ))}
      </svg>

      {/* 7. Soft Vignette Overlay for UI Legibility (Ensures content remains readable) */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-[#050711] via-[#070A16]/60 to-[#03050B]/80 transition-opacity duration-300"
        style={{ opacity: dimOpacity }}
      />
    </div>
  );
};
