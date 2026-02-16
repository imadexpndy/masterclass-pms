/* ===== Master Class POS — SVG Icon Library ===== */
const I = ({ d, size = 20, color = 'currentColor', ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
const F = ({ d, size = 20, color = 'currentColor', ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...p}>{d}</svg>
);

// ===== Navigation =====
export const IconDashboard = (p) => <I {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />;
export const IconCart = (p) => <I {...p} d={<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>} />;
export const IconTable = (p) => <I {...p} d={<><path d="M3 9h18" /><path d="M5 9v10" /><path d="M19 9v10" /><path d="M4 5h16a1 1 0 0 1 1 1v2H3V6a1 1 0 0 1 1-1z" /></>} />;
export const IconChef = (p) => <I {...p} d={<><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z" /><line x1="6" y1="17" x2="18" y2="17" /></>} />;
export const IconChart = (p) => <I {...p} d={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>} />;
export const IconBox = (p) => <I {...p} d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>} />;
export const IconUsers = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />;
export const IconMenuBoard = (p) => <I {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>} />;

// ===== Actions =====
export const IconMoney = (p) => <I {...p} d={<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} />;
export const IconReceipt = (p) => <I {...p} d={<><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /></>} />;
export const IconClock = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />;
export const IconPrint = (p) => <I {...p} d={<><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>} />;
export const IconFire = (p) => <I {...p} d={<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></>} />;
export const IconCheck = (p) => <I {...p} d={<><polyline points="20 6 9 17 4 12" /></>} />;
export const IconPlus = (p) => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
export const IconMinus = (p) => <I {...p} d={<><line x1="5" y1="12" x2="19" y2="12" /></>} />;
export const IconTrash = (p) => <I {...p} d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />;
export const IconCreditCard = (p) => <I {...p} d={<><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>} />;
export const IconCash = (p) => <I {...p} d={<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" /></>} />;
export const IconArrowLeft = (p) => <I {...p} d={<><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>} />;
export const IconSearch = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />;
export const IconSettings = (p) => <I {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} />;
export const IconX = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />;
export const IconLogout = (p) => <I {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>} />;
export const IconSend = (p) => <I {...p} d={<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} />;
export const IconEye = (p) => <I {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />;
export const IconCalendar = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />;
export const IconChevronDown = (p) => <I {...p} d={<><polyline points="6 9 12 15 18 9" /></>} />;
export const IconRefresh = (p) => <I {...p} d={<><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>} />;
export const IconMaximize = (p) => <I {...p} d={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></>} />;
export const IconMinimize = (p) => <I {...p} d={<><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></>} />;
export const IconDownload = (p) => <I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />;
export const IconUpload = (p) => <I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>} />;
export const IconFilter = (p) => <I {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>} />;

// ===== Theme =====
export const IconSun = (p) => <I {...p} d={<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>} />;
export const IconMoon = (p) => <I {...p} d={<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>} />;

// ===== Status =====
export const IconCircle = ({ filled, size = 10, color = 'currentColor', ...p }) => (
    <svg width={size} height={size} viewBox="0 0 10 10" {...p}>
        <circle cx="5" cy="5" r="4" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" />
    </svg>
);

// ===== Category Icons (replace emojis) =====
export const IconBreakfast = (p) => <I {...p} d={<><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>} />;
export const IconSalad = (p) => <I {...p} d={<><path d="M7 21h10" /><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z" /><path d="M12 3c-1.5 0-2.9.5-4 1.5a6.96 6.96 0 0 0-2 5.5h12a6.96 6.96 0 0 0-2-5.5A5.96 5.96 0 0 0 12 3z" /></>} />;
export const IconTagine = (p) => <I {...p} d={<><ellipse cx="12" cy="17" rx="9" ry="4" /><path d="M12 3l-4 10h8L12 3z" /></>} />;
export const IconPizza = (p) => <I {...p} d={<><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" /><path d="M12 2l-3 18" /><path d="M12 2l3 18" /><path d="M5 9h14" /></>} />;
export const IconPasta = (p) => <I {...p} d={<><path d="M16 2s3 4 3 10-3 10-3 10" /><path d="M8 2s-3 4-3 10 3 10 3 10" /><path d="M2 12h20" /><path d="M7 7h10" /><path d="M7 17h10" /></>} />;
export const IconSteak = (p) => <I {...p} d={<><path d="M13 3C8 3 4 7 4 12s4 9 9 9c2.5 0 4.5-1 6-2.5 1.5-1.5 2-3.5 2-5.5C21 8 17.5 3 13 3z" /><path d="M9 12s1-2 3-2 3 2 3 2" /></>} />;
export const IconWrap = (p) => <I {...p} d={<><path d="M4 20L20 4" /><path d="M4 4c0 8 4 16 16 16" /><path d="M4 4c8 0 16 4 16 16" /></>} />;
export const IconSandwich = (p) => <I {...p} d={<><path d="M3 11h18l-1.5-5A2 2 0 0 0 17.6 4H6.4a2 2 0 0 0-1.9 1.4L3 11z" /><path d="M3 15h18" /><path d="M5 19h14a2 2 0 0 0 2-2H3a2 2 0 0 0 2 2z" /><path d="M3 11v4h18v-4" /></>} />;
export const IconJuice = (p) => <I {...p} d={<><path d="M8 2h8l-2 18H10L8 2z" /><path d="M6 6h12" /><path d="M7 10h10" /></>} />;
export const IconCoffee = (p) => <I {...p} d={<><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>} />;
export const IconDessert = (p) => <I {...p} d={<><path d="M12 2v6" /><path d="M8 8l4-2 4 2" /><path d="M5 12a7 7 0 0 0 14 0" /><path d="M5 12H3l2-4h14l2 4h-2" /><path d="M10 22v-4" /><path d="M14 22v-4" /></>} />;

// ===== Misc =====
export const IconBell = (p) => <I {...p} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>} />;
export const IconWifi = (p) => <I {...p} d={<><path d="M5 12.55a11 11 0 0 1 14 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></>} />;
export const IconWifiOff = (p) => <I {...p} d={<><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></>} />;
export const IconCoins = (p) => <I {...p} d={<><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><line x1="7" y1="6" x2="7.01" y2="6" /><line x1="9" y1="10" x2="9.01" y2="10" /></>} />;
export const IconTarget = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>} />;
export const IconClipboard = (p) => <I {...p} d={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>} />;
export const IconHome = (p) => <I {...p} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />;
export const IconBuilding = (p) => <I {...p} d={<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></>} />;
export const IconTreePalm = (p) => <I {...p} d={<><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" /><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-2l-1-1-1 1h-3" /><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 4.24-4.24c1.96 1.96 1.8 5.28-.35 7.43" /><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c-.83-2-1.5-4-1-6.5" /></>} />;
export const IconGlobe = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />;
