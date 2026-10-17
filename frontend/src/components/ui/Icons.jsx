const base = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
};

export const IconHome = () => (
  <svg {...base}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const IconDashboard = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const IconDoctor = () => (
  <svg {...base}>
    <path d="M6 3v6a4 4 0 008 0V3" />
    <path d="M10 13v2a5 5 0 0010 0v-1" />
    <circle cx="20" cy="12" r="2" />
  </svg>
);

export const IconPatients = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M17 4.5a3.5 3.5 0 010 7" />
    <path d="M21.5 20c0-2.8-1.7-4.8-4-5.6" />
  </svg>
);

export const IconCalendar = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconMenu = () => (
  <svg {...base} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const BrandMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
