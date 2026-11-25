import React from 'react';

export const AcademicBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* 1. Ambient Study Desk / Paper Wash */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.09),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.08),transparent_42%),radial-gradient(circle_at_75%_85%,rgba(16,185,129,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.16),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.10),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(79,70,229,0.12),transparent_50%)]" />

      {/* 2. Ruled Academic Graph-Notebook Grid */}
      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(99, 102, 241, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.09) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Notebook Left Margin Accent Line */}
      <div className="absolute top-0 bottom-0 left-6 hidden w-px bg-rose-300/45 xl:block dark:bg-rose-500/20" />

      {/* 3. Rich Study Doodles & Academic Symbols Tile */}
      <svg
        className="absolute inset-0 h-full w-full text-brand-900 opacity-[0.09] dark:text-brand-200 dark:opacity-[0.11]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="academic-grid-pattern"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            {/* Open Textbook with Bookmark */}
            <g
              transform="translate(22, 24)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h12a4 4 0 0 1 4 4v18a3 3 0 0 0-3-3H4z" />
              <path d="M36 6H24a4 4 0 0 0-4 4v18a3 3 0 0 1 3-3h13z" />
              <path d="M26 6v9l2.5-1.8L31 15V6" />
              <path d="M8 12h7M8 17h6" />
            </g>

            {/* Graduation Cap */}
            <g
              transform="translate(124, 22)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 7L3 14l17 7 17-7-17-7z" />
              <path d="M9 17v7c0 2.5 5 4.5 11 4.5s11-2 11-4.5v-7" />
              <path d="M35 15v10" />
            </g>

            {/* Study Desk Lamp */}
            <g
              transform="translate(214, 22)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 28h18" />
              <path d="M17 28V17l-7-7" />
              <path d="M6 10l8-6 6 6-8 6z" />
              <path d="M12 16l2 2M16 14l2 2" />
            </g>

            {/* Mathematical & Study Formulas */}
            <text
              x="28"
              y="122"
              fill="currentColor"
              fontSize="24"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              ∑ f(x)
            </text>
            <text
              x="148"
              y="108"
              fill="currentColor"
              fontSize="22"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              π ≈ 3.14
            </text>
            <text
              x="220"
              y="148"
              fill="currentColor"
              fontSize="24"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              ∫ dx
            </text>

            {/* Spiral Notebook */}
            <g
              transform="translate(116, 134)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="3" width="24" height="30" rx="3" />
              <path d="M3 9h5M3 15h5M3 21h5M3 27h5" />
              <path d="M12 11h12M12 17h12M12 23h8" />
            </g>

            {/* Pencil & Ruler */}
            <g
              transform="translate(28, 166) rotate(-20)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 22l4-1 15-15a2.1 2.1 0 0 0-3-3L5 18l-1 4z" />
              <path d="M17 6l3 3" />
            </g>

            {/* Stack of Textbooks */}
            <g
              transform="translate(30, 218)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="32" height="9" rx="2" />
              <rect x="6" y="13" width="32" height="9" rx="2" />
              <rect x="1" y="24" width="34" height="9" rx="2" />
              <path d="M8 6.5h10M12 17.5h12M7 28.5h14" />
            </g>

            {/* Study Coffee Mug */}
            <g
              transform="translate(132, 214)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h18v11a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V12z" />
              <path d="M23 14h3a3 3 0 0 1 0 6h-3" />
              <path d="M10 6c0 2 2 2 2 4M16 5c0 2 2 2 2 4" />
            </g>

            {/* A+ Checklist Badge */}
            <g
              transform="translate(206, 206)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="34" height="34" rx="7" />
              <path d="M9 12l3 3 5-5M9 24l3 3 5-5M20 12h10M20 24h10" />
            </g>

            {/* Grade / Target Accent */}
            <text
              x="184"
              y="186"
              fill="currentColor"
              fontSize="16"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              A+ • 75%
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#academic-grid-pattern)" />
      </svg>

      {/* 4. Subtle Corner Study Illustration Watermarks */}
      <svg
        className="absolute -bottom-12 -right-12 h-80 w-80 text-brand-700 opacity-[0.06] dark:text-brand-300 dark:opacity-[0.07]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M28 54h56a16 16 0 0 1 16 16v78a14 14 0 0 0-14-14H28z" />
        <path d="M172 54h-56a16 16 0 0 0-16 16v78a14 14 0 0 1 14-14h58z" />
        <path d="M44 78h34M44 96h34M44 114h24" />
        <path d="M122 78h34M122 96h34M122 114h24" />
        <circle cx="144" cy="40" r="14" />
        <path d="M144 18v4M144 58v4M122 40h4M162 40h4" />
      </svg>
    </div>
  );
};
