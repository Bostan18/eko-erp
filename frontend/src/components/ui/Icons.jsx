/**
 * Bibliothèque d'icônes SVG (style Lucide, stroke 1.8).
 * Toutes prennent `className` et héritent `currentColor` — la couleur
 * se contrôle via la classe Tailwind du parent (ex. `text-forest-500`).
 *
 *   <IconBox className="w-5 h-5 text-forest-500" />
 */

const base = (paths, props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {paths}
  </svg>
)

/* ─── Documents & facturation ────────────────────────────── */

export const IconDocument = (p) => base(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h4" />
  </>, p)

export const IconInvoice = (p) => base(
  <>
    <path d="M5 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-3-2V4z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </>, p)

export const IconFile = (p) => base(
  <>
    <path d="M4 6a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
  </>, p)

export const IconClipboard = (p) => base(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M9 11h6M9 15h4" />
  </>, p)

export const IconTicket = (p) => base(
  <>
    <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4 2 2 0 0 1-2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4 2 2 0 0 1 2-2z" />
    <path d="M13 5v2M13 11v2M13 17v2" strokeDasharray="0.1 2" />
  </>, p)

/* ─── États / signaux ────────────────────────────────────── */

export const IconCheck = (p) => base(
  <>
    <path d="M20 6 9 17l-5-5" />
  </>, p)

export const IconClock = (p) => base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>, p)

export const IconHourglass = (p) => base(
  <>
    <path d="M6 3h12M6 21h12" />
    <path d="M6 3v3l6 6 6-6V3" />
    <path d="M6 21v-3l6-6 6 6v3" />
  </>, p)

export const IconAlert = (p) => base(
  <>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </>, p)

export const IconX = (p) => base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-6 6M9 9l6 6" />
  </>, p)

export const IconCornerUpLeft = (p) => base(
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a4 4 0 0 1 4 4v6" />
  </>, p)

/* ─── Argent & finance ───────────────────────────────────── */

export const IconCoins = (p) => base(
  <>
    <circle cx="9" cy="9" r="6" />
    <path d="M9 5v1M9 12v1M11.5 7H8a1 1 0 0 0 0 2h2a1 1 0 0 1 0 2H6.5" />
    <path d="M15 15.5a6 6 0 1 1-8-8" />
  </>, p)

export const IconWallet = (p) => base(
  <>
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13" />
    <circle cx="17" cy="13" r="1.2" fill="currentColor" />
  </>, p)

export const IconCard = (p) => base(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h2M10 15h4" />
  </>, p)

export const IconBank = (p) => base(
  <>
    <path d="M3 10 12 4l9 6" />
    <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
    <path d="M3 19h18" />
  </>, p)

/* ─── Graphes / direction ────────────────────────────────── */

export const IconChartBar = (p) => base(
  <>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </>, p)

export const IconTrendUp = (p) => base(
  <>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </>, p)

export const IconTrendDown = (p) => base(
  <>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M14 17h7v-7" />
  </>, p)

export const IconArrowUp = (p) => base(
  <>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </>, p)

export const IconArrowDown = (p) => base(
  <>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </>, p)

export const IconRefresh = (p) => base(
  <>
    <path d="M3 12a9 9 0 0 1 14.5-7.1L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-14.5 7.1L3 16" />
    <path d="M3 21v-5h5" />
  </>, p)

export const IconDownload = (p) => base(
  <>
    <path d="M12 4v12M6 12l6 6 6-6" />
    <path d="M5 20h14" />
  </>, p)

export const IconUpload = (p) => base(
  <>
    <path d="M12 20V8M6 12l6-6 6 6" />
    <path d="M5 4h14" />
  </>, p)

/* ─── People / RH ────────────────────────────────────────── */

export const IconUsers = (p) => base(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>, p)

export const IconBriefcase = (p) => base(
  <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </>, p)

export const IconHardHat = (p) => base(
  <>
    <path d="M3 18a9 9 0 0 1 18 0" />
    <path d="M3 18h18v2H3z" />
    <path d="M9 9V6h6v3" />
  </>, p)

export const IconTool = (p) => base(
  <>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.94 7.94L6.6 21.4a2.12 2.12 0 0 1-3-3l7.96-7.96a6 6 0 0 1 7.94-7.94l-3.79 3.79z" />
  </>, p)

export const IconHandshake = (p) => base(
  <>
    <path d="m11 17 2 2a1 1 0 0 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 0 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 0 1-1.41 0l-2.71-2.71a3 3 0 0 0-4.24 0L2 9.41" />
    <path d="m21 3-2 2" />
  </>, p)

export const IconPhone = (p) => base(
  <>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </>, p)

/* ─── Lieux / objets ─────────────────────────────────────── */

export const IconBuilding = (p) => base(
  <>
    <path d="M3 21V8l5-3 5 3v13" />
    <path d="M13 21V11l5-3 3 2v11" />
    <path d="M3 21h18" />
    <path d="M7 12v.01M7 16v.01M17 14v.01M17 18v.01" />
  </>, p)

export const IconBox = (p) => base(
  <>
    <path d="m3 7 9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </>, p)

export const IconFolder = (p) => base(
  <>
    <path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
  </>, p)

export const IconTruck = (p) => base(
  <>
    <path d="M3 17h12V6H3zM15 11h4l2 3v3h-6" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>, p)

export const IconTarget = (p) => base(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </>, p)

export const IconTrophy = (p) => base(
  <>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3" />
    <path d="M17 6h3v2a3 3 0 0 1-3 3" />
  </>, p)

export const IconMoon = (p) => base(
  <>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </>, p)

export const IconFlask = (p) => base(
  <>
    <path d="M9 3h6" />
    <path d="M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3" />
    <path d="M7.5 15h9" />
  </>, p)

export const IconLink = (p) => base(
  <>
    <path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12 6.3" />
    <path d="M14 10a4 4 0 0 0-5.7 0L4.7 13.6a4 4 0 0 0 5.7 5.7L12 17.7" />
  </>, p)

export const IconChart = (p) => base(
  <>
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 4 4 6-6" />
  </>, p)

/* ─── Navigation (Sidebar / Topbar) ──────────────────────── */

export const IconDashboard = (p) => base(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>, p)

export const IconProjects = (p) => base(
  <>
    <path d="M2 20h20M5 20V8l7-5 7 5v12" />
    <path d="M9 20v-5h6v5" />
  </>, p)

export const IconCRM = (p) => base(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>, p)

export const IconStocks = (p) => base(
  <>
    <path d="M5 8h14M5 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-14 0-2-4h18l-2 4" />
  </>, p)

export const IconShoppingBag = (p) => base(
  <>
    <path d="M2 7h20l-1.5 10.5a2 2 0 0 1-2 1.5H5.5a2 2 0 0 1-2-1.5L2 7Z" />
    <path d="M8 7V5a4 4 0 0 1 8 0v2" />
  </>, p)

export const IconExcavator = (p) => base(
  <>
    <path d="M3 17h14v-5a3 3 0 0 0-3-3H3v8Z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="15" cy="18" r="2" />
    <path d="M17 12h3l1 2v3h-4" />
  </>, p)

export const IconShield = (p) => base(
  <>
    <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
    <path d="M9 12l2 2 4-4" />
  </>, p)

export const IconSettings = (p) => base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>, p)

export const IconUser = (p) => base(
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>, p)

export const IconLogout = (p) => base(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </>, p)

/* ─── Actions CRUD sur lignes de tableau ─────────────────── */

export const IconEye = (p) => base(
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>, p)

export const IconPencil = (p) => base(
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
  </>, p)

export const IconTrash = (p) => base(
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>, p)
