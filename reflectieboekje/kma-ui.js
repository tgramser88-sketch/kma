/*
 * KMA UI layer: shared by both apps. Loaded after the page's own scripts.
 *  - kmaIcon(name): consistent line icons (replaces emoji in buttons and headings)
 *  - kmaToast(msg): short confirmation that disappears by itself
 *  - kmaSheet(...): bottom sheet used for the "Delen" and "⋯" menus
 *  - answer boxes grow while typing
 *
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';

  /* ---------------- Icons ---------------- */
  var P = function (d) { return '<path d="' + d + '"/>'; };
  var ICONS = {
    share: P('M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13'),
    more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    settings: P('M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'),
    print: P('M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z'),
    file: P('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'),
    folder: P('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'),
    download: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3'),
    upload: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'),
    bluetooth: P('M7 7l10 10-5 5V2l5 5L7 17'),
    lock: '<rect x="4" y="11" width="16" height="11" rx="2"/>' + P('M8 11V7a4 4 0 0 1 8 0v4'),
    unlock: '<rect x="4" y="11" width="16" height="11" rx="2"/>' + P('M8 11V7a4 4 0 0 1 7.8-1.2'),
    moon: P('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'),
    sun: '<circle cx="12" cy="12" r="4"/>' + P('M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'),
    auto: '<circle cx="12" cy="12" r="9"/>' + P('M12 3a9 9 0 0 1 0 18z'),
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' + P('M14 14h3v3h-3zM21 14v.01M14 21h.01M17 21h4M21 17v4'),
    form: '<rect x="8" y="2" width="8" height="4" rx="1"/>' + P('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4'),
    refresh: P('M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'),
    trash: P('M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'),
    plus: P('M12 5v14M5 12h14'),
    edit: P('M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'),
    save: P('M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8'),
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/>' + P('M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8'),
    search: '<circle cx="11" cy="11" r="7"/>' + P('M21 21l-4.35-4.35'),
    user: '<circle cx="12" cy="8" r="4"/>' + P('M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1'),
    users: P('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2') + '<circle cx="9" cy="7" r="4"/>' + P('M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'),
    shield: P('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
    camera: P('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z') + '<circle cx="12" cy="13" r="4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/>' + P('M16 2v4M8 2v4M3 10h18'),
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    chart: P('M18 20V10M12 20V4M6 20v-6'),
    clock: '<circle cx="12" cy="12" r="10"/>' + P('M12 6v6l4 2'),
    clip: P('M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'),
    list: P('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
    check: P('M20 6L9 17l-5-5'),
    left: P('M15 18l-6-6 6-6'),
    right: P('M9 18l6-6-6-6'),
    down: P('M6 9l6 6 6-6'),
    x: P('M18 6L6 18M6 6l12 12'),
    book: P('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'),
    alert: P('M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01'),
    scale: P('M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z'),
    activity: P('M22 12h-4l-3 9L9 3l-3 9H2'),
    zap: P('M13 2L3 14h9l-1 8 10-12h-9l1-8z'),
    eye: P('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z') + '<circle cx="12" cy="12" r="3"/>',
    idea: P('M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z'),
    send: P('M22 2L11 13M22 2l-7 20-4-9-9-4z'),
    message: P('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
    bell: P('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0'),
    undo: P('M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8'),
    // Aanvulling (4.4.1): de laatste standaard-emoji als lijnicoon in dezelfde stijl
    talk: P('M14 9a2 2 0 0 1-2 2H6l-4 3V3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zM18 9h2a2 2 0 0 1 2 2v11l-4-3h-6a2 2 0 0 1-2-2v-1'),
    puzzle: P('M19.4 13.4a2 2 0 1 0 0-2.8V7a1 1 0 0 0-1-1h-3.6a2 2 0 1 0-2.8 0H8.4a1 1 0 0 0-1 1v3.6a2 2 0 1 0 0 2.8V17a1 1 0 0 0 1 1h3.6a2 2 0 1 1 2.8 0h3.6a1 1 0 0 0 1-1z'),
    compass: '<circle cx="12" cy="12" r="10"/>' + P('M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z'),
    medal: P('M7.2 2h9.6L14 8.5h-4zM8.5 2l3.5 6.5M15.5 2L12 8.5') + '<circle cx="12" cy="15" r="6"/>' + P('M12 12.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z'),
    trend: P('M23 6l-9.5 9.5-5-5L1 18M17 6h6v6'),
    repeat: P('M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3'),
    alarm: '<circle cx="12" cy="13" r="8"/>' + P('M12 9v4l2 2M5 3L2 6M22 6l-3-3M6.38 18.7L4 21M17.64 18.67L20 21'),
    gem: P('M6 3h12l4 6-10 12L2 9zM2 9h20M12 21L8 9l4-6 4 6z'),
    flag: P('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7'),
  };

  var VICONS = {"Verbondenheid": {"w": 36.8, "h": 24.04, "d": "M32.67 0.4L28.75 1.72C27.23 2.22 26.21 1.36 25.57 0.93C24.19 0 22.38 0.01 21.02 0.96C19.65 1.91 17.58 3.64 14.43 5.28C13.5 5.77 13.27 6.64 13.72 7.21C14.77 8.56 18.13 7.55 19.72 6.92C23.02 5.62 23.34 4.77 25.22 6.29L31.66 11.5C36.03 10.12 36.8 8.83 36.8 8.83ZM32.67 0.4M24.43 7.27C23.53 6.56 23.56 6.6 22.09 7.27C20.92 7.81 18.05 9.14 15.57 9.14C14.28 9.14 13.32 8.75 12.72 7.99C11.79 6.81 12.19 5.02 13.85 4.16C15.19 3.46 16.34 2.74 17.32 2.07L15.77 0.99C14.4 0.04 12.6 0.03 11.22 0.95C10.57 1.39 9.56 2.25 8.04 1.75L4.11 0.43L-0.01 8.86C-0.01 8.86 0.61 9.89 3.86 11.09C5.82 9.32 6.57 8.87 7.75 8.87C8.89 8.87 10.04 9.44 10.69 10.46C12.06 9.97 13.63 10.51 14.49 11.55C14.89 12.04 15.16 12.67 15.25 13.32C17.3 14.01 18.05 16.17 17.44 17.83C18.86 18.97 19.05 21 18.07 22.45C19.94 24.04 21.94 22.04 22.1 20.7C23.74 20.54 24.64 19.67 24.75 17.86C26.28 17.86 27.79 16.72 27.58 14.94C29.55 15.31 31.06 12.7 29.81 11.68C27.53 9.81 31.14 12.71 24.43 7.27M15.49 18.33L15.76 18.11C16.58 17.43 16.55 16.03 15.87 15.21C15.41 14.65 14.63 14.34 13.93 14.42C14.57 12.24 11.98 10.81 10.65 11.92L10 12.45C10.01 10.44 7.78 9.48 6.39 10.62L4.82 11.92C3.55 12.97 3.7 14.33 4.38 15.15C5.11 16.04 6.24 16.1 7.07 15.68C7.03 16.24 7.2 16.84 7.56 17.27C8.02 17.83 8.8 18.13 9.51 18.07C9.31 18.75 9.46 19.57 9.92 20.13C10.46 20.78 11.44 21.09 12.23 20.85C12.14 21.47 12.3 22.15 12.71 22.63C13.39 23.45 14.78 23.72 15.78 22.89L16.55 22.26C17.61 21.38 17.64 19.94 16.96 19.12C16.6 18.68 16.05 18.4 15.49 18.33"}, "Veiligheid": {"w": 27.25, "h": 24.0, "d": "M26.44 20.78L15.5 1.46C14.67 0 12.57 0 11.75 1.46L0.81 20.78C0 22.22 1.04 24 2.69 24L24.56 24C26.21 24 27.25 22.22 26.44 20.78M12.27 7.5L15.29 7.2L14.99 12.78L14.99 15.67L12.27 15.67ZM13.64 21.43C12.32 21.43 11.57 20.67 11.57 19.28C11.57 18.04 12.26 17.07 13.61 17.07C14.93 17.07 15.68 17.85 15.68 19.28C15.68 20.49 14.98 21.43 13.64 21.43"}, "Vertrouwen": {"w": 25.48, "h": 27.5, "d": "M18.18 1.61C14.53 -0.01 12.74 3.48 12.74 3.48C12.74 3.48 10.95 -0.01 7.3 1.61C3.69 3.22 3.94 11.16 12.38 15.59C12.6 15.7 12.87 15.7 13.1 15.59C21.54 11.16 21.78 3.22 18.18 1.61M23.22 9.55C22.94 10.77 22.65 12.39 22.44 13.69C22.61 13.76 22.78 13.86 22.94 14C23.85 14.78 23.95 16.04 23.24 17.31C21.62 20.17 19.85 21.47 19.47 21.73C19.37 21.81 19.31 21.79 19.27 21.75C19.27 21.75 19.27 21.75 19.27 21.75C20.88 19.95 21.73 18.72 22.46 17C23.01 15.7 22.71 14.91 22.24 14.62C21.78 14.35 21.3 14.5 20.81 15.21C19.17 17.64 17.99 18.91 16.35 20.84C15.2 22.18 14.42 23.85 14.44 25.55C14.45 26.63 14.52 27.22 14.56 27.49L20.3 27.49L20.78 24.73C20.85 24.35 21.02 23.99 21.28 23.7L24.42 20.52C25.07 19.78 25.44 18.84 25.48 17.85L25.48 7.59C25.48 7.59 23.81 7.04 23.22 9.55M4.66 15.21C4.18 14.5 3.7 14.35 3.24 14.62C2.76 14.91 2.46 15.7 3.02 17C3.75 18.72 4.6 19.95 6.21 21.75C6.21 21.75 6.21 21.75 6.21 21.75C6.17 21.79 6.11 21.81 6 21.73C5.63 21.47 3.86 20.17 2.24 17.31C1.53 16.04 1.62 14.78 2.54 14C2.7 13.86 2.87 13.76 3.04 13.69C2.83 12.39 2.54 10.77 2.26 9.55C1.67 7.04 0 7.59 0 7.59L0 17.85C0.03 18.84 0.41 19.78 1.06 20.52L4.19 23.7C4.45 23.99 4.63 24.35 4.69 24.73L5.18 27.49L10.91 27.49C10.95 27.22 11.03 26.63 11.03 25.55C11.05 23.85 10.27 22.18 9.13 20.84C7.49 18.91 6.3 17.64 4.66 15.21"}, "Verantwoordelijkheid": {"w": 33.97, "h": 30.4, "d": "M4.16 21.14C4.52 20.71 5.07 20.33 5.88 19.97L5.91 19.9C6.17 19.35 6.66 18.93 7.24 18.74L9.01 18.17C8.43 17.93 7.8 17.74 7.41 17.64C7.25 17.59 7.14 17.45 7.1 17.29C7.04 17.09 7.02 16.83 7.02 16.83C7.45 16.33 7.77 15.74 7.88 14.96C8.31 14.83 8.39 14.29 8.39 13.95C8.39 13.62 8.33 13.44 8.22 13.38C8.11 13.33 8.01 13.37 7.95 13.41C8.01 12.72 8.11 11.29 7.82 10.76C7.51 10.19 7.14 9.96 6.41 10.15C5.94 9.89 5.62 9.57 4.79 9.8C4.22 9.96 3.59 10.25 3.26 10.69C2.89 11.18 2.98 12.74 3.03 13.44C2.99 13.41 2.86 13.31 2.72 13.38C2.6 13.44 2.54 13.62 2.54 13.95C2.54 14.29 2.62 14.83 3.05 14.96C3.15 15.77 3.46 16.34 3.88 16.81C3.88 16.81 3.87 17.06 3.83 17.29C3.79 17.45 3.69 17.6 3.52 17.64C2.84 17.83 1.24 18.32 0.72 18.87C0.05 19.57 -0.01 22.21 -0.01 22.21L3.57 22.21C3.74 21.77 3.94 21.39 4.16 21.14M27.05 16.74C27 17.18 26.99 17.21 26.94 17.49C26.92 17.64 26.82 17.78 26.67 17.83C26.39 17.94 25.94 18.11 25.47 18.31L26.79 18.74C27.37 18.93 27.85 19.35 28.12 19.9L28.19 20.06C28.92 20.39 29.43 20.73 29.77 21.1C29.99 21.35 30.2 21.72 30.38 22.15L33.96 22.15C33.96 22.15 33.93 20 33.26 19.31C33.03 19.07 32.58 18.81 32.08 18.58C31.42 18.26 30.69 17.98 30.3 17.83C30.15 17.78 30.05 17.64 30.03 17.49C29.99 17.3 29.96 17.01 29.93 16.78C30.92 16.74 31.74 16.64 32.08 16.51C32.14 16.49 32.18 16.43 32.15 16.36C31.96 15.96 31.48 14.65 31.42 13.97C31.27 12.29 31.27 9.29 28.93 10.04C28.93 10.04 27.44 9.11 26.23 10.67C25.38 11.77 25.58 13.22 25.55 14.03C25.53 14.6 25.05 15.92 24.85 16.27C24.8 16.34 24.82 16.42 24.9 16.44C25.26 16.57 26.08 16.67 27.05 16.74M28.87 21.92C28.58 21.59 28.01 21.28 27.3 20.99L27.03 20.42C26.91 20.17 26.69 19.97 26.42 19.89L22.46 18.61C21.7 21.65 20.69 25.16 18.62 27.86C17.93 28.94 15.91 28.78 15.33 27.84C13.37 25.15 12.3 21.55 11.56 18.61L7.61 19.89C7.34 19.97 7.12 20.17 7 20.42L6.77 20.9C6.01 21.2 5.39 21.54 5.08 21.92C3.89 23.33 3.28 30.4 3.28 30.4L30.67 30.4C30.67 30.4 30.16 23.33 28.87 21.92M10.44 13.72C10.72 15.58 11.85 17.34 13.87 19.06C14.83 19.87 16.23 20.02 16.98 20.02C17.73 20.02 19.12 19.87 20.08 19.06C22.07 17.36 23.22 15.57 23.51 13.72C24.24 13.05 24.65 11.99 24.65 10.68C24.65 10.27 24.65 9.2 23.98 8.46C24.14 6.63 24.26 3.8 23.55 2.66C22.67 1.26 21.6 0.57 19.57 1.03C18.23 0.4 17.32 0 14.98 0.57C13.36 0.97 11.58 1.61 10.64 2.7C9.74 3.74 9.8 6.65 9.94 8.51C9.31 9.24 9.31 10.28 9.31 10.68C9.31 11.98 9.71 13.05 10.44 13.72M11.32 9.48C11.39 9.45 11.47 9.44 11.54 9.44C11.67 9.44 11.79 9.48 11.87 9.53C11.95 9.89 12.01 10.16 12.03 10.25C12.14 10.72 12.59 10.67 12.59 10.67L12.59 6.98C13.73 6.9 15.99 6.56 18.48 5.28L21.36 7.21L21.36 10.67C21.36 10.67 21.81 10.72 21.92 10.25C21.94 10.16 22 9.89 22.08 9.53C22.17 9.48 22.28 9.44 22.42 9.44C22.49 9.44 22.56 9.45 22.64 9.48C22.88 9.6 23.06 9.98 23.06 10.68C23.06 11.37 22.83 12.49 21.94 12.77C21.94 14.86 20.47 16.56 19.01 17.8C18.59 18.17 17.78 18.42 16.98 18.42C16.17 18.42 15.37 18.17 14.94 17.8C13.48 16.56 12.01 14.88 12.01 12.77C11.13 12.49 10.89 11.37 10.89 10.68C10.89 9.98 11.07 9.6 11.32 9.48"}};
  /* The four V's: the pictograms of the official Cadetbeoordeling form (filled, in the current text colour). */
  function kmaVIcon(v, cls) {
    if (typeof v === 'number') v = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'][v];
    var key = Object.keys(VICONS).find(function (k) { return k.toLowerCase() === String(v || '').toLowerCase(); });
    if (!key) return '';
    var ic = VICONS[key];
    return '<svg class="ki ki-v' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + ic.w + ' ' + ic.h + '" fill="currentColor" aria-hidden="true"><path d="' + ic.d + '"/></svg>';
  }
  window.kmaVIcon = kmaVIcon;

  function kmaIcon(name, cls) {
    var body = ICONS[name];
    if (!body) return '';
    return '<svg class="ki' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }
  window.kmaIcon = kmaIcon;

  /* Emoji → icon. Only in buttons and headings; status dots and ✓/✕ stay as they are. */
  var EMOJI = {
    '📝': 'edit', '🛡': 'shield', '🔒': 'lock', '🔓': 'unlock', '📄': 'file', '📅': 'calendar', '📆': 'calendar',
    '📑': 'form', '📋': 'form', '🤝': 'users', '👥': 'users', '⚖': 'scale', '🗑': 'trash', '🖨': 'print',
    '📊': 'chart', '👤': 'user', '🎯': 'target', '📥': 'download', '📤': 'upload', '🎙': 'mic', '🔍': 'search',
    '📱': 'qr', '🔄': 'refresh', '💤': 'moon', '🏃': 'activity', '💪': 'activity', '🏋': 'activity', '🧠': 'idea',
    '📶': 'bluetooth', '🌙': 'moon', '📂': 'folder', '💾': 'save', '📸': 'camera', '📷': 'camera', '⚠': 'alert',
    '📖': 'book', '➕': 'plus', '⚡': 'zap', '✍': 'edit', '✅': 'check', '📎': 'clip', '👁': 'eye', '⏱': 'clock',
    '🚀': 'send', '🗣': 'talk', '💬': 'message', '🧩': 'puzzle', '🧭': 'compass', '🎖': 'medal', '🏅': 'medal',
    '📈': 'trend', '🔁': 'repeat', '⏰': 'alarm', '💎': 'gem', '🚩': 'flag', '🏁': 'flag', '💡': 'idea', '🔔': 'bell'
  };
  var EMOJI_RE = new RegExp('(' + Object.keys(EMOJI).map(function (e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|') + ')\\uFE0F?\\s?', 'g');
  // "🤝 1. VERBONDENHEID", "🔒 Vertrouwen", "⚖️ Verantwoordelijkheid": the V's get their own pictogram
  var V_EMOJI_RE = /(🤝|🛡️?|🔒|⚖️?|💎)\s?(\d\.\s)?(VERBONDENHEID|VEILIGHEID|VERTROUWEN|VERANTWOORDELIJKHEID|Verbondenheid|Veiligheid|Vertrouwen|Verantwoordelijkheid)/g;
  // Overal waar tekst zichtbaar is (ook in kaartjes, chips en lijsten); niet in invoervelden en keuzelijsten.
  // Statusbolletjes (🟢🟠🔴), ✓ en ✕ staan niet in de lijst en blijven zoals ze zijn.
  var ICON_SKIP = 'textarea, option, select, input, script, style, svg, [contenteditable], .no-icons';
  // De KMA-formulieren zelf (officieel beoordelingsformulier, zelfbeoordeling) krijgen geen nieuwe symbolen of lege-schermtekening.
  var OFFICIAL = '#official-kma-form-modal, #kma-self-form-modal';

  function iconizeTextNode(node) {
    var text = node.nodeValue;
    if (!text || !EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;
    var parent = node.parentNode;
    if (!parent || parent.nodeType !== 1 || parent.closest(ICON_SKIP)) return;
    // In de KMA-formulieren alleen waar het al vóór 4.4.1 gebeurde (knoppen, koppen, labels): die blijven gelijk.
    if (parent.closest(OFFICIAL) && !parent.closest('button, .btn, .button, .btn-header, .fab-btn, h1, h2, h3, h4, .case-tab, .guidance-kicker, strong, label')) return;
    var solo = !text.replace(EMOJI_RE, '').replace(V_EMOJI_RE, '').trim();
    var html = text.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; })
      .replace(V_EMOJI_RE, function (m, e, num, v) { return kmaVIcon(v) + (num || '') + v; })
      .replace(EMOJI_RE, function (m, e) { return kmaIcon(EMOJI[e.replace('️', '')] || EMOJI[e]); });
    var span = document.createElement('span');
    span.className = solo ? 'ki-text ki-solo' : 'ki-text';
    span.innerHTML = html;
    parent.replaceChild(span, node);
  }

  function iconize(root) {
    if (!root || root.nodeType !== 1) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) { EMOJI_RE.lastIndex = 0; if (EMOJI_RE.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode); }
    EMOJI_RE.lastIndex = 0;
    nodes.forEach(iconizeTextNode);
    // V checkboxes (DTF logbook): pictogram before the name
    root.querySelectorAll('label > input[type="checkbox"][value]').forEach(function (cb) {
      var lab = cb.parentElement;
      if (!VICONS[cb.value] || lab.querySelector('.ki-v')) return;
      cb.insertAdjacentHTML('afterend', kmaVIcon(cb.value));
    });
    termify(root);
    chapterize(root);
    emptyize(root);
    // Placeholders can't hold an icon: drop the emoji, CSS adds a search icon.
    (root.matches && root.matches('input[placeholder]') ? [root] : []).concat(Array.prototype.slice.call(root.querySelectorAll('input[placeholder]'))).forEach(function (inp) {
      var ph = inp.getAttribute('placeholder');
      if (/^🔍/.test(ph)) { inp.setAttribute('placeholder', ph.replace(/^🔍️?\s*/, '')); inp.classList.add('has-search-icon'); }
    });
  }
  window.kmaIconize = iconize;

  /* ---------------- Hoofdstuksymbolen (4.4.1) ----------------
     Elk hoofdstuk heeft één vast symbool, overal hetzelfde: de inhoudsopgave en de koppen in het
     Reflectieboekje, het dossier en de reflecties in het CadetVolgSysteem en dus ook in de PDF.
     Herkend aan de titel (die verschilt soms een beetje tussen de apps). De 4V-pictogrammen blijven zoals ze zijn. */
  var CHAPTER_ICONS = [
    [/cadet\s?informatie|^cadet informatie/i, 'user'], [/introductie|drijfveren/i, 'flag'], [/ontwikkelbiografie|levenslijn/i, 'clock'],
    [/persoonlijkheid|ipip/i, 'chart'], [/datum-tijd-feit|\bdtf\b/i, 'calendar'], [/gedragscode/i, 'shield'],
    [/zelfbeoordelingsformulier/i, 'form'], [/ik als officier/i, 'medal'], [/zelfreflectie|5g-t/i, 'eye'], [/smart/i, 'target'],
    [/procesreflectie|korthagen/i, 'repeat'], [/probleem/i, 'puzzle'], [/begrippen|jargon/i, 'book'], [/voorbereiding/i, 'talk'],
    [/fitheid/i, 'activity'], [/toetsing/i, 'list'], [/groei/i, 'trend'], [/curriculum|\bcv\b/i, 'file']
  ];
  function kmaChapterIcon(title) {
    for (var i = 0; i < CHAPTER_ICONS.length; i++) if (CHAPTER_ICONS[i][0].test(title)) return CHAPTER_ICONS[i][1];
    return '';
  }
  window.kmaChapterIcon = kmaChapterIcon;
  var CHAP_SCOPE = 'h1, h2, h3, h4, .step-copy strong, #step-title, .kma-chap-head';
  function chapterTitleOf(el) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    var m = /^Hoofdstuk \d+\s*:\s*(.+)$/.exec(t);
    if (m) return m[1];
    var s0 = ''; try { s0 = (typeof steps !== 'undefined' && steps[0] && steps[0].title) || ''; } catch (e) {}
    if (s0 && t === s0 && (el.id === 'step-title' || el.matches('.step-copy strong'))) return t;
    return '';
  }
  function chapterize(root) {
    if (!root || root.nodeType !== 1) return;
    var els = root.matches && root.matches(CHAP_SCOPE) ? [root] : [];
    els = els.concat(Array.prototype.slice.call(root.querySelectorAll(CHAP_SCOPE)));
    if (!els.length && root.parentElement && root.parentElement.matches && root.parentElement.matches(CHAP_SCOPE)) els = [root.parentElement];
    els.forEach(function (el) {
      if (el.closest(OFFICIAL)) return;
      var title = chapterTitleOf(el); if (!title) return;
      var name = kmaChapterIcon(title); if (!name) return;
      var first = el.querySelector('svg.ki');
      if (first && first.getAttribute('data-chap') === name) return;
      // Een eerder (standaard) symbool vooraan vervangen; de 4V-pictogrammen (.ki-v) blijven staan.
      if (first && !first.classList.contains('ki-v')) {
        var before = document.createRange(); before.setStart(el, 0); before.setEndBefore(first);
        if (!before.toString().trim()) first.remove();
      }
      el.insertAdjacentHTML('afterbegin', kmaIcon(name, 'ki-chap').replace('<svg ', '<svg data-chap="' + name + '" '));
    });
  }
  window.kmaChapterize = chapterize;

  /* ---------------- PDF in huisstijl (4.4.1) ----------------
     Bovenaan elke PDF/afdruk van het boekje en het dossier: embleem, "Koninklijke Militaire Academie", wat het
     is, de naam van de cadet en de datum, met een gouden lijn eronder (en onder elk hoofdstuk, zie kma-ui.css).
     Alleen zichtbaar bij afdrukken. Het officiële KMA-beoordelingsformulier en de zelfbeoordeling blijven
     ongewijzigd (die worden ook niet via deze kop gemaakt; zie de print-regels). Het portfolio en de
     samenvatting hebben hun eigen voorblad. De kop wordt bijgewerkt bij elke tik, dus ook vlak voor "PDF". */
  function printHead() {
    var h = document.getElementById('kma-print-head');
    if (!h) {
      h = document.createElement('div');
      h.id = 'kma-print-head'; h.className = 'kma-print-head no-icons'; h.setAttribute('aria-hidden', 'true');
      h.innerHTML = '<img src="kma-embleem.svg" alt=""><div class="t"><small>Koninklijke Militaire Academie</small><strong></strong></div><div class="r"><b></b><span></span></div>';
      document.body.insertBefore(h, document.body.firstChild);
    }
    var what = 'Reflectieboekje', who = '';
    try {
      if (typeof cadets !== 'undefined') {
        var id = typeof activeCadetId !== 'undefined' ? activeCadetId : null;
        var c = id != null && document.body.classList.contains('kma-detail-open') ? cadets.filter(function (x) { return x.id === id; })[0] : null;
        if (!c && id != null) { var dv = document.getElementById('detail-view'); if (dv && dv.classList.contains('active')) c = cadets.filter(function (x) { return x.id === id; })[0]; }
        what = c ? 'Cadetdossier' : 'CadetVolgSysteem · overzicht';
        who = c ? c.name : '';
      } else if (typeof answers !== 'undefined') {
        who = String(answers['Voornaam & Achternaam:'] || '');
      }
    } catch (e) {}
    h.querySelector('strong').textContent = what;
    h.querySelector('b').textContent = who;
    h.querySelector('span').textContent = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  window.kmaPrintHead = printHead;
  function startPrintHead() {
    printHead();
    document.addEventListener('click', function () { try { printHead(); } catch (e) {} }, true);
    window.addEventListener('beforeprint', function () { try { printHead(); } catch (e) {} });
  }
  if (document.body) startPrintHead(); else document.addEventListener('DOMContentLoaded', startPrintHead);

  /* ---------------- Lege schermen (4.4.1) ----------------
     "Nog geen gespreksverslag." enz.: een klein schild in de stijl van het embleem (goud lijnwerk) met een
     passend symbool erin, en de tekst eronder. Alleen bij lijsten die nog leeg zijn, niet bij elke
     "nog niet beantwoord" in het dossier. Niet in de PDF. */
  var EMPTY_RE = /^(Nog geen (gespreksverslag|reflecties|observatoren|360°-observatoren|momenten|metingen|beoordelingen|gebeurtenissen|plan|bijlagen|feiten|5G-T-reflecties|Korthagen-reflecties|DTF-logboeknotities|senior-|SMART-leervraag|persoonlijkheidsprofiel)|Geen open punten)/;
  var EMPTY_ICON = [[/gesprek/i, 'talk'], [/reflecties/i, 'repeat'], [/observatoren|instructeurs/i, 'users'], [/momenten|gebeurtenissen/i, 'clock'],
    [/metingen/i, 'activity'], [/beoordelingen/i, 'form'], [/plan/i, 'compass'], [/bijlagen/i, 'clip'], [/feiten|DTF/i, 'calendar'],
    [/punten/i, 'list'], [/SMART/i, 'target'], [/persoonlijkheid/i, 'chart']];
  function emptyArt(name, cls) {
    var body = ICONS[name] || ICONS.flag;
    return '<svg class="kma-empty-art' + (cls ? ' ' + cls : '') + '" viewBox="0 0 64 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M32 3l26 8v23c0 18-12 29-26 35C18 63 6 52 6 34V11z" stroke-width="2"/>' +
      '<path d="M32 9.5l20 6.2V34c0 14.2-9 23.4-20 28.4C21 57.4 12 48.2 12 34V15.7z" fill="currentColor" fill-opacity=".07" stroke-width="1" stroke-opacity=".55"/>' +
      '<path d="M24 6.2l8-2.4 8 2.4" stroke-width="1.2" stroke-opacity=".6"/>' +
      '<g transform="translate(20 22)" stroke-width="2">' + body + '</g></svg>';
  }
  window.kmaEmptyArt = emptyArt;
  function emptyize(root) {
    if (!root || root.nodeType !== 1) return;
    var ps = root.matches && root.matches('p') ? [root] : [];
    ps = ps.concat(Array.prototype.slice.call(root.querySelectorAll('p')));
    ps.forEach(function (p) {
      if (p.classList.contains('kma-empty-note') || p.closest('.kma-qa, .kma-empty, .no-icons, .kma-toast-host, ' + OFFICIAL)) return;
      var t = (p.textContent || '').trim();
      if (!EMPTY_RE.test(t)) return;
      var name = 'flag';
      for (var i = 0; i < EMPTY_ICON.length; i++) if (EMPTY_ICON[i][0].test(t)) { name = EMPTY_ICON[i][1]; break; }
      p.classList.add('kma-empty-note');
      // De tekst in één span, zodat begrippen en vet gewoon in de zin blijven staan.
      var txt = document.createElement('span'); txt.className = 'kma-empty-txt';
      while (p.firstChild) txt.appendChild(p.firstChild);
      p.appendChild(txt);
      p.insertAdjacentHTML('afterbegin', emptyArt(name));
    });
    var big = root.matches && root.matches('.kma-empty') ? [root] : Array.prototype.slice.call(root.querySelectorAll('.kma-empty'));
    big.forEach(function (e) {
      if (e.querySelector(':scope > .kma-empty-art')) return;
      e.insertAdjacentHTML('afterbegin', emptyArt(/gevonden/.test(e.textContent) ? 'search' : 'users', 'is-big'));
    });
  }

  /* ---------------- Begrippen: tik voor uitleg (headings, labels, table heads) ---------------- */
  var TERMS = {
    'DTF': 'Datum-Tijd-Feit: een concrete waarneming met datum en tijd, zonder oordeel. Gebruikt als bewijs.',
    '5G-T': 'Reflectiemodel in 4 stappen: 5G (Gebeurtenis, Gevoel, Gedachtes, Gedrag, Gevolg), Verdieping, Invloed en Toekomst.',
    'NTB': 'Niet te beoordelen: het gedrag is niet zichtbaar geweest of kon niet worden beoordeeld.',
    'SWOT': 'Sterke kanten, valkuilen (zwakke kanten), kansen en bedreigingen.',
    'SMART': 'Een leervraag die Specifiek, Meetbaar, Acceptabel, Realistisch en Tijdgebonden is.',
    'ALACT': 'De reflectiecirkel van Korthagen: Actie, Terugblik, Bewustwording, Alternatieven, Uitproberen.',
    'OER': 'Onderwijs- en Examenreglement: hierin staan de normen voor het totaaloordeel.',
    'OPCO': 'Operationeel commando (krijgsmachtdeel), bijvoorbeeld CLAS, CZSK, CLRS of KMar.',
    'Korthagen': 'Reflectiemodel van Fred Korthagen (de ALACT-cirkel) om te leren van een ervaring.',
    'Kernkwadrant': 'Model van Ofman: kwaliteit, valkuil (te veel van de kwaliteit), uitdaging en allergie.'
  };
  var TERM_RE = new RegExp('(^|[^\\w-])(' + Object.keys(TERMS).map(function (t) { return t.replace(/[-]/g, '\\-'); }).join('|') + ')(?![\\w-])');
  var TERM_SCOPE = 'h2, h3, h4, h5, label, summary, th, .kma-sheet-title, .question-label, .kcb-legend';
  function termify(root) {
    if (!root || root.nodeType !== 1) return;
    var targets = root.matches && root.matches(TERM_SCOPE) ? [root] : [];
    targets = targets.concat(Array.prototype.slice.call(root.querySelectorAll(TERM_SCOPE)));
    targets.forEach(function (el) {
      if (el.querySelector('.kma-term') || el.closest('button, a, select, option, textarea, .no-terms, svg')) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node;
      while ((node = walker.nextNode())) {
        if (node.parentNode.closest('button, a, select, svg')) continue;
        var m = TERM_RE.exec(node.nodeValue);
        if (!m) continue;
        var start = m.index + m[1].length, term = m[2];
        var after = node.splitText(start); after.splitText(term.length);
        var ab = document.createElement('abbr');
        ab.className = 'kma-term'; ab.setAttribute('data-term', term); ab.setAttribute('tabindex', '0'); ab.title = TERMS[term];
        ab.textContent = term;
        after.parentNode.replaceChild(ab, after);
        break; // one per element is enough
      }
    });
  }
  var tip = null;
  function hideTip() { if (tip) { tip.remove(); tip = null; } }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.kma-term');
    if (!t) { hideTip(); return; }
    e.preventDefault(); e.stopPropagation();
    hideTip();
    tip = document.createElement('div');
    tip.className = 'kma-tip'; tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<strong></strong><span></span>';
    tip.querySelector('strong').textContent = t.getAttribute('data-term');
    tip.querySelector('span').textContent = TERMS[t.getAttribute('data-term')] || '';
    document.body.appendChild(tip);
    var r = t.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 24);
    tip.style.width = w + 'px';
    tip.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
    var top = r.bottom + 8; if (top + tip.offsetHeight > window.innerHeight - 10) top = r.top - tip.offsetHeight - 8;
    tip.style.top = Math.max(8, top) + 'px';
  }, true);
  window.addEventListener('scroll', hideTip, { passive: true });
  window.kmaTerms = TERMS;

  /* ---------------- Weergave: grotere tekst, hoog contrast ---------------- */
  function uiPref(k) { try { return (window.kmaStore || localStorage).getItem('kma-ui-' + k) === '1'; } catch (e) { return false; } }
  function applyDisplay() {
    document.documentElement.classList.toggle('kma-large', uiPref('large'));
    document.documentElement.classList.toggle('kma-contrast', uiPref('contrast'));
  }
  window.kmaDisplayToggle = function (k) {
    try { (window.kmaStore || localStorage).setItem('kma-ui-' + k, uiPref(k) ? '0' : '1'); } catch (e) {}
    applyDisplay();
    kmaToast(k === 'large' ? (uiPref('large') ? 'Grotere tekst aan' : 'Grotere tekst uit') : (uiPref('contrast') ? 'Hoog contrast aan' : 'Hoog contrast uit'));
  };
  window.kmaDisplayPref = uiPref;
  applyDisplay();

  /* ---------------- Toasts ---------------- */
  var toastHost = null;
  function kmaToast(message, kind, ms) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'kma-toast-host';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    var t = document.createElement('div');
    t.className = 'kma-toast' + (kind === 'error' ? ' is-error' : '');
    t.innerHTML = kmaIcon(kind === 'error' ? 'alert' : 'check') + '<span></span>';
    t.querySelector('span').textContent = String(message).replace(/^(?:\s|✅|✓|⚠️)+/, '');
    toastHost.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () {
      t.classList.remove('in');
      setTimeout(function () { t.remove(); }, 300);
    }, ms || 2600);
    try { sessionStorage.setItem('kma-ui-toast', JSON.stringify({ m: message, k: kind || '', t: Date.now() })); } catch (e) {}
  }
  window.kmaToast = kmaToast;
  /** Toast with an "Ongedaan maken" button (6 seconds). */
  window.kmaUndoToast = function (message, undo) {
    kmaToast(message, '', 6500);
    var t = toastHost && toastHost.lastElementChild;
    if (!t) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'kma-undo'; b.textContent = 'Ongedaan maken';
    b.addEventListener('click', function () { try { undo(); } catch (e) {} t.remove(); kmaToast('Hersteld'); });
    t.appendChild(b); t.classList.add('has-undo');
  };

  // Success/info messages become toasts; errors and warnings stay as dialogs.
  var SUCCESS = /(succesvol|ingesteld|opgeslagen|gekopieerd|verwijderd|uitgeschakeld|toegevoegd|bijgewerkt|geëxporteerd|geïmporteerd|bewaard|gedeeld|aangemaakt)/i;
  var PROBLEM = /(fout|mislukt|ongeldig|niet |geen |kan |kon |maximum|minimaal|vul |voer |⚠|let op|zorg)/i;
  var nativeAlert = window.alert.bind(window);
  window.alert = function (msg) {
    var s = String(msg == null ? '' : msg);
    if (SUCCESS.test(s) && !PROBLEM.test(s) && s.length < 160) { kmaToast(s); return; }
    nativeAlert(s);
  };

  /* ---------------- Bottom sheet / menu ---------------- */
  var openSheet = null;
  function closeSheet() {
    if (!openSheet) return;
    var s = openSheet;
    openSheet = null;
    s.classList.remove('in');
    setTimeout(function () { s.remove(); }, 220);
  }
  /**
   * kmaSheet({ title, items: [{ icon, label, hint, onClick, danger, checked } | { section: 'Titel' }] })
   */
  function kmaSheet(opts) {
    closeSheet();
    var overlay = document.createElement('div');
    overlay.className = 'kma-sheet-overlay';
    var sheet = document.createElement('div');
    sheet.className = 'kma-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    var html = '<div class="kma-sheet-grip"></div>';
    if (opts.title) html += '<div class="kma-sheet-title">' + opts.title + '</div>';
    html += '<div class="kma-sheet-items"></div>';
    sheet.innerHTML = html;
    var list = sheet.querySelector('.kma-sheet-items');
    (opts.items || []).filter(Boolean).forEach(function (it) {   // 4.5.4: lege plekken (null) overslaan
      if (it.section) {
        var h = document.createElement('div');
        h.className = 'kma-sheet-section';
        h.textContent = it.section;
        list.appendChild(h);
        return;
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kma-sheet-item' + (it.danger ? ' is-danger' : '') + (it.checked ? ' is-checked' : '');
      b.innerHTML = kmaIcon(it.icon || 'right') + '<span class="kma-sheet-label"><strong></strong>' +
        (it.hint ? '<small></small>' : '') + '</span>' + (it.checked ? kmaIcon('check', 'kma-sheet-check') : '');
      b.querySelector('strong').textContent = it.label;
      if (it.hint) b.querySelector('small').textContent = it.hint;
      b.addEventListener('click', function () {
        closeSheet();
        setTimeout(function () { it.onClick && it.onClick(); }, 60);
      });
      list.appendChild(b);
    });
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSheet(); });
    document.body.appendChild(overlay);
    openSheet = overlay;
    requestAnimationFrame(function () { overlay.classList.add('in'); });
  }
  window.kmaSheet = kmaSheet;
  window.kmaCloseSheet = closeSheet;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* ---------------- Answer boxes grow while typing ---------------- */
  function grow(t) {
    if (!t || t.tagName !== 'TEXTAREA' || t.closest('.no-autogrow') || t.offsetParent === null) return;
    t.style.height = 'auto';
    t.style.height = Math.max(t.scrollHeight + 2, 0) + 'px';
  }
  window.kmaGrow = grow;
  document.addEventListener('input', function (e) { grow(e.target); }, true);

  /* ---------------- Watch for re-rendered content ---------------- */
  var pending = [];
  var scheduled = false;
  var mo = new MutationObserver(function (records) {
    records.forEach(function (r) {
      r.addedNodes.forEach(function (n) {
        if (n.nodeType === 1) pending.push(n);
        else if (n.nodeType === 3 && n.parentNode && n.parentNode.nodeType === 1) pending.push(n.parentNode);
      });
    });
    if (!scheduled && pending.length) {
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        var batch = pending; pending = [];
        batch.forEach(function (n) {
          if (!n.isConnected || (n.closest && n.closest('.kma-toast-host'))) return;
          iconize(n);
          if (n.querySelectorAll) n.querySelectorAll('textarea').forEach(grow);
        });
      });
    }
  });

  function start() {
    iconize(document.body);
    document.querySelectorAll('textarea').forEach(grow);
    mo.observe(document.body, { childList: true, subtree: true });
    // A confirmation shown right before a reload (e.g. after importing a backup)
    try {
      var last = JSON.parse(sessionStorage.getItem('kma-ui-toast') || 'null');
      sessionStorage.removeItem('kma-ui-toast');
      if (last && Date.now() - last.t < 1500 && performance.getEntriesByType('navigation')[0] && performance.getEntriesByType('navigation')[0].type === 'reload') {
        kmaToast(last.m, last.k);
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ---------------- Cijferpaneel voor de pincode (4.3.6) ----------------
   Bij elk pincodeveld (4 cijfers) staat een eigen cijferpaneel, zodat het toetsenbord van de telefoon niet open hoeft.
   Op een aanraakscherm opent het toetsenbord niet meer; op een computer kun je ook gewoon typen.
   Op een inlogscherm gaat de app vanzelf verder na 4 cijfers. Meerdere velden in één venster delen één paneel. */
(function () {
  'use strict';
  var SEL = 'input[type="password"][maxlength="4"]';
  var AUTO = { 'pin-verify-input': 1, 'cvs-pin-input': 1 };
  var touch = false; try { touch = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
  function box(inp) { return inp.closest('.kma-sheet, .modal-card, .modal-content, .pin-modal-overlay, [id$="lock-screen"]') || inp.parentElement; }
  function okBtn(c) {
    return c.querySelector('[data-x="save"], button.button.primary, button.kma-icon-btn.is-primary') ||
      Array.prototype.filter.call(c.querySelectorAll('button.btn'), function (b) { return !b.classList.contains('btn-outline'); }).pop() || null;
  }
  function inputs(c) { return Array.prototype.slice.call(c.querySelectorAll(SEL)); }
  function mark(c, inp) {
    inputs(c).forEach(function (i) { i.classList.toggle('kma-pin-active', i === inp); });
    c._kmaPinActive = inp;
  }
  function active(c) {
    var list = inputs(c), a = c._kmaPinActive;
    if (a && list.indexOf(a) >= 0) return a;
    return list.find(function (i) { return i.value.length < 4; }) || list[0];
  }
  function press(c, k) {
    var inp = active(c); if (!inp) return;
    if (k === 'del') inp.value = inp.value.slice(0, -1);
    else if (k === 'ok') { var b = okBtn(c); if (b) b.click(); return; }
    else if (inp.value.length < 4) inp.value += k;
    mark(c, inp);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    if (k !== 'del' && inp.value.length === 4) {
      var list = inputs(c), next = list[list.indexOf(inp) + 1];
      if (next) { mark(c, next); return; }
      if (AUTO[inp.id]) setTimeout(function () { var b = okBtn(c); if (b && inp.value.length === 4) b.click(); }, 120);
    }
  }
  function pad(c) {
    var p = document.createElement('div');
    p.className = 'kma-pinpad';
    p.setAttribute('role', 'group'); p.setAttribute('aria-label', 'Cijfers voor de pincode');
    p.innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(function (k) {
      var lab = k === 'del' ? '⌫' : k === 'ok' ? '✓' : k;
      var aria = k === 'del' ? 'Wissen' : k === 'ok' ? 'Bevestigen' : k;
      return '<button type="button" class="kma-pinkey' + (k === 'ok' ? ' is-ok' : k === 'del' ? ' is-del' : '') + '" data-pin="' + k + '" aria-label="' + aria + '">' + lab + '</button>';
    }).join('');
    // pointerdown: the field keeps its focus and nothing else gets selected
    p.addEventListener('pointerdown', function (e) { if (e.target.closest('[data-pin]')) e.preventDefault(); });
    p.addEventListener('click', function (e) { var b = e.target.closest('[data-pin]'); if (b) press(c, b.getAttribute('data-pin')); });
    return p;
  }
  function enhance(inp) {
    if (inp._kmaPin) return; inp._kmaPin = true;
    var c = box(inp);
    inp.setAttribute('inputmode', 'none'); inp.setAttribute('autocomplete', 'off');
    if (touch) { inp.readOnly = true; if (document.activeElement === inp) inp.blur(); }
    inp.addEventListener('focus', function () { mark(c, inp); });
    inp.addEventListener('click', function () { mark(c, inp); });
    inp.addEventListener('input', function () { var v = inp.value.replace(/\D/g, '').slice(0, 4); if (v !== inp.value) inp.value = v; });
    var old = c.querySelector(':scope .kma-pinpad'); if (old) old.remove();
    var list = inputs(c), last = list[list.length - 1];
    var anchor = last.closest('.kma-role-pin') || (last.parentElement === c ? last : last.parentElement);
    if (anchor.tagName === 'LABEL') anchor = anchor.parentElement;
    anchor.insertAdjacentElement('afterend', pad(c));
  }
  function scan(root) { Array.prototype.forEach.call((root || document).querySelectorAll(SEL), enhance); }
  function start() {
    scan();
    try { new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (n.matches && n.matches(SEL)) enhance(n); else scan(n); } }); }); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  window.kmaPinPadScan = scan;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/*
 * Toegankelijkheid (4.3.8): elk invoerveld krijgt een naam voor schermlezers.
 * Velden zonder <label>, aria-label of title krijgen als aria-label de tekst die er zichtbaar bij staat
 * (de tekst ervoor, anders de placeholder, anders de kop van het blok). Er verandert verder niets:
 * alleen dit kenmerk wordt gezet, en alleen als het veld nog geen naam heeft.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var VELD = 'input:not([type=hidden]):not([type=file]),textarea,select';
  var VORM = /^(INPUT|TEXTAREA|SELECT|BUTTON|SCRIPT|STYLE|SVG)$/;
  function schoon(t) { t = String(t || '').replace(/\s+/g, ' ').trim().replace(/[:：]\s*$/, ''); return t.length > 2 && t.length <= 140 ? t : ''; }
  function heeftNaam(el) {
    if ((el.getAttribute('aria-label') || '').trim() || el.getAttribute('aria-labelledby') || (el.getAttribute('title') || '').trim()) return true;
    return !!(el.labels && Array.prototype.some.call(el.labels, function (l) { return l.textContent.trim(); }));
  }
  var LABELACHTIG = /^(LABEL|SPAN|STRONG|B|SMALL|EM|H[1-6]|LEGEND|DT)$/;
  /* De tekst direct voor het veld. streng: alleen een label-achtig element (kopje, vet, klein). */
  function tekstVoor(el, streng) {
    for (var p = el.previousElementSibling; p; p = p.previousElementSibling) {
      if (VORM.test(p.tagName) || (p.querySelector && p.querySelector(VELD + ',button'))) return '';
      var t = schoon(p.textContent); if (!t) continue;
      if (streng && !LABELACHTIG.test(p.tagName)) return '';
      return streng || t.length <= 80 ? t : '';
    }
    return '';
  }
  function naamVoor(el) {
    var ouder = el.parentElement && !el.previousElementSibling ? el.parentElement : null;
    var t = tekstVoor(el, true) || (ouder && tekstVoor(ouder, true));
    if (!t) t = schoon(el.getAttribute('placeholder'));
    if (!t) t = tekstVoor(el, false) || (ouder && tekstVoor(ouder, false));
    if (!t) { var blok = el.closest('.widget-box, .kma-card-block, .question-card, section, .modal-content, .kma-sheet');
      var kop = blok && blok.querySelector('h1,h2,h3,h4,h5,legend,strong'); t = kop ? schoon(kop.textContent) : ''; }
    return t;
  }
  function benoem(root) {
    var lijst = (root && root.querySelectorAll ? root : document).querySelectorAll(VELD);
    Array.prototype.forEach.call(lijst, function (el) { if (!heeftNaam(el)) { var t = naamVoor(el); if (t) el.setAttribute('aria-label', t); } });
  }
  var gepland = false;
  function later() { if (gepland) return; gepland = true; (window.requestAnimationFrame || setTimeout)(function () { gepland = false; try { benoem(document); } catch (e) {} }); }
  function start() {
    benoem(document);
    try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  window.kmaBenoemVelden = benoem;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/*
 * Toegankelijkheid (4.8.0): vensters en koppen.
 *  1. Elk venster dat over de pagina heen komt (menu, vel, melding: role="dialog" met aria-modal) krijgt de focus,
 *     houdt Tab binnen het venster en geeft de focus bij sluiten terug aan de knop waarmee het werd geopend.
 *     Een venster zonder naam krijgt zijn titel als naam voor schermlezers. Op een aanraakscherm gaat de focus naar
 *     het venster zelf en niet naar het eerste veld, zodat het toetsenbord niet ongevraagd opent.
 *  2. Koppen krijgen een niveau dat klopt met hun plek (aria-level): een schermlezer kan dan van kop naar kop
 *     springen zonder niveaus over te slaan. De opmaak verandert niet.
 */
(function () {
  'use strict';
  if (window.__kmaA11yVensters) return; window.__kmaA11yVensters = true;
  var MODAAL = '[role="dialog"][aria-modal="true"], [role="alertdialog"]';
  var FOCUS = 'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var stapel = [];   // { el, terug }
  function zichtbaar(e) { return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); }
  function bovenste() { while (stapel.length && !document.body.contains(stapel[stapel.length - 1].el)) sluit(stapel.pop()); return stapel.length ? stapel[stapel.length - 1] : null; }
  function sluit(v) { var t = v.terug; if (t && document.body.contains(t) && zichtbaar(t) && !bovensteZonder()) { try { t.focus({ preventScroll: true }); } catch (e) {} } }
  function bovensteZonder() { return stapel.some(function (s) { return document.body.contains(s.el); }); }
  function open(el) {
    if (stapel.some(function (s) { return s.el === el; })) return;
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      var kop = el.querySelector('.kma-sheet-title, .kma-dlg-t, h1, h2, h3, strong');
      var t = kop && kop.textContent.replace(/\s+/g, ' ').trim();
      if (t) el.setAttribute('aria-label', t.slice(0, 80));
    }
    stapel.push({ el: el, terug: document.activeElement && document.activeElement !== document.body ? document.activeElement : null });
    setTimeout(function () {
      if (!document.body.contains(el) || el.contains(document.activeElement)) return;
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (e) {}
    }, 80);
  }
  function kijk() {
    Array.prototype.forEach.call(document.querySelectorAll(MODAAL), function (el) { if (zichtbaar(el)) open(el); });
    bovenste();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var v = bovenste(); if (!v) return;
    var lijst = Array.prototype.filter.call(v.el.querySelectorAll(FOCUS), zichtbaar);
    if (!lijst.length) { e.preventDefault(); return; }
    var eerste = lijst[0], laatste = lijst[lijst.length - 1], nu = document.activeElement;
    if (!v.el.contains(nu) || nu === v.el) { e.preventDefault(); (e.shiftKey ? laatste : eerste).focus(); }
    else if (e.shiftKey && nu === eerste) { e.preventDefault(); laatste.focus(); }
    else if (!e.shiftKey && nu === laatste) { e.preventDefault(); eerste.focus(); }
  }, true);

  /* Koppen: niveau volgens de plek. De eerste kop is niveau 1; een kop die dieper ligt dan de vorige komt precies één
     niveau dieper, en koppen die in de opmaak even diep zijn krijgen hetzelfde niveau. */
  function koppen() {
    var pad = [];   // [eigen niveau, toegekend niveau]
    Array.prototype.forEach.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'), function (h) {
      if (!zichtbaar(h) || h.closest('[aria-hidden="true"]')) return;
      var tag = /^H[1-6]$/.test(h.tagName) ? +h.tagName.charAt(1) : 0;
      if (!h.hasAttribute('data-kma-niveau')) h.setAttribute('data-kma-niveau', tag || +(h.getAttribute('aria-level') || 2));
      var eigen = +h.getAttribute('data-kma-niveau');
      while (pad.length && pad[pad.length - 1][0] >= eigen) pad.pop();
      var n = pad.length ? pad[pad.length - 1][1] + 1 : 1;
      pad.push([eigen, n]);
      if (tag === n) { if (h.hasAttribute('aria-level')) h.removeAttribute('aria-level'); }
      else if (h.getAttribute('aria-level') !== String(n)) h.setAttribute('aria-level', n);
    });
    /* Een tabel die opzij schuift moet ook met het toetsenbord te bereiken zijn. */
    Array.prototype.forEach.call(document.querySelectorAll('.kma-week-table, .kma-heat-table, .kma-fb-form table, .kma-heat-wrap'), function (t) {
      if (t.hasAttribute('tabindex') || !zichtbaar(t) || t.scrollWidth <= t.clientWidth + 2) return;
      t.setAttribute('tabindex', '0');
      if (!t.getAttribute('aria-label') && t.tagName !== 'TABLE') t.setAttribute('aria-label', 'Tabel, schuif opzij voor meer');
    });
  }
  var gepland = false;
  function later() { if (gepland) return; gepland = true; setTimeout(function () { gepland = false; try { kijk(); koppen(); } catch (e) {} }, 60); }
  function start() {
    later();
    try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); } catch (e) {}
  }
  window.kmaA11y = { vensters: kijk, koppen: koppen };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/*
 * kmaAfter(name, fn): voer fn uit na de globale functie window[name] (sinds 4.4.1).
 * In plaats van dat elke module de functie zelf opnieuw omwikkelt, staat er één omhulsel met een lijst.
 * fn krijgt (resultaat, argumenten); een fout in één module stopt de andere niet meer.
 * Eigenschappen van de oorspronkelijke functie (zoals __kmaHidden) blijven behouden.
 */
window.kmaAfter = function (name, fn) {
  var f = window[name];
  if (typeof f !== 'function') return false;
  if (!f.__kmaAfter) {
    var orig = f, list = [];
    f = function () {
      var r = orig.apply(this, arguments), args = arguments, self = this;
      list.forEach(function (h) { try { h.call(self, r, args); } catch (e) { console.error('kmaAfter ' + name, e); } });
      return r;
    };
    Object.keys(orig).forEach(function (k) { f[k] = orig[k]; });
    f.__kmaAfter = list;
    window[name] = f;
  }
  f.__kmaAfter.push(fn);
  return true;
};

/*
 * 4.5.0: afwerking die in beide apps hetzelfde werkt.
 *  1. Overgangen (~200 ms) bij een ander hoofdstuk, een ander tabblad en het openen van een dossier.
 *  2. "Opslaan…" / "Opgeslagen ✓" bij het veld waarin je typt; mislukt het opslaan, dan rood met "tik om opnieuw".
 *  3. Drie introschermen na het akkoord met de gebruiksvoorwaarden (over te slaan, terug te lezen via ⋮ › Uitleg).
 */
(function () {
  'use strict';
  if (window.__kmaPolish) return; window.__kmaPolish = true;
  var reduce = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  var isCvs = function () { return typeof cadets !== 'undefined' || !!document.getElementById('detail-view'); };

  /* ---------- 1. Overgangen ---------- */
  function enter(el, dir) {
    if (!el || reduce()) return;
    el.classList.remove('kma-enter', 'kma-enter-l', 'kma-enter-r');
    void el.offsetWidth;
    el.classList.add(dir === 'l' ? 'kma-enter-l' : dir === 'r' ? 'kma-enter-r' : 'kma-enter');
    setTimeout(function () { el.classList.remove('kma-enter', 'kma-enter-l', 'kma-enter-r'); }, 320);
  }
  window.kmaEnter = enter;
  var lastStep = null;
  function hookNav() {
    if (window.goToStep && !window.goToStep.__kmaTrans) {
      kmaAfter('goToStep', function (r, args) {
        var to = Number(args && args[0]), dir = lastStep == null || isNaN(to) ? '' : to > lastStep ? 'r' : to < lastStep ? 'l' : '';
        lastStep = isNaN(to) ? lastStep : to;
        enter(document.querySelector('.content-panel'), dir);
      });
      window.goToStep.__kmaTrans = true;
    }
    if (window.openDetailView && !window.openDetailView.__kmaTrans) {
      kmaAfter('openDetailView', function () { enter(document.getElementById('detail-view'), 'r'); });
      window.openDetailView.__kmaTrans = true;
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.kma-tab, .case-tab, [data-gctab], [data-jmode]'); if (!t) return;
    setTimeout(function () {
      var vis = document.querySelectorAll('.kma-tab-visible');
      if (vis.length && t.classList.contains('kma-tab') && t.hasAttribute('data-tab')) vis.forEach(function (v) { enter(v, ''); });
      else enter(document.getElementById('widget-container'), '');
    }, 0);
  }, true);

  /* ---------- 2. Opgeslagen ---------- */
  var lastWrite = 0, lastFail = 0;
  function wrapStore() {
    var S = window.kmaStore; if (!S || S.__kmaSaved) return;
    var set = S.setItem;
    S.setItem = function () {
      try { var r = set.apply(this, arguments); lastWrite = Date.now(); return r; } catch (e) { lastFail = Date.now(); throw e; }
    };
    S.__kmaSaved = true;
  }
  var chip = null, chipFor = null, hideT = 0, pollT = 0;
  function place() {
    if (!chip || !chipFor || !document.body.contains(chipFor)) { if (chip) chip.classList.remove('on'); return; }
    var r = chipFor.getBoundingClientRect();
    if (!r.width) { chip.classList.remove('on'); return; }
    // In een tekstvak rechtsonder in het vak (daar staat meestal geen tekst); bij een invoerregel eronder.
    var inside = chipFor.tagName === 'TEXTAREA' && r.height >= 56;
    chip.style.top = Math.round((inside ? r.bottom - chip.offsetHeight - 6 : r.bottom + 4) + window.scrollY) + 'px';
    chip.style.left = Math.round(Math.max(8, r.right + window.scrollX - chip.offsetWidth - (inside ? 8 : 0))) + 'px';
  }
  function show(state) {
    if (!chip) {
      chip = document.createElement('div'); chip.className = 'kma-saved'; chip.setAttribute('role', 'status'); chip.setAttribute('aria-live', 'polite');
      chip.addEventListener('click', function () {
        if (!chip.classList.contains('fail') || !chipFor) return;
        chipFor.dispatchEvent(new Event('input', { bubbles: true })); chipFor.dispatchEvent(new Event('change', { bubbles: true }));
      });
      document.body.appendChild(chip);
    }
    chip.className = 'kma-saved on ' + state;
    chip.textContent = state === 'busy' ? 'Opslaan…' : state === 'ok' ? 'Opgeslagen ✓' : 'Niet opgeslagen, tik om opnieuw te proberen';
    place();
    clearTimeout(hideT);
    if (state === 'ok') hideT = setTimeout(function () { chip.classList.remove('on'); }, 3000);
  }
  function watched(el) {
    if (!el || !el.matches) return false;
    if (!el.matches('textarea, input[type=text], input[type=date], input[type=number], input:not([type])')) return false;
    if (el.closest('[id*="pin"], #kma-eula, .kma-eula, .kma-intro, [data-no-saved]') || el.type === 'search' || /zoek|search/i.test(el.id + ' ' + (el.placeholder || ''))) return false;
    return true;
  }
  document.addEventListener('input', function (e) {
    var el = e.target; if (!watched(el)) return;
    wrapStore();
    var t0 = Date.now(); chipFor = el;
    var shown = false;
    clearInterval(pollT);
    var n = 0;
    pollT = setInterval(function () {
      n++;
      if (lastFail >= t0) { clearInterval(pollT); show('fail'); return; }
      if (lastWrite >= t0) { if (!shown) { show('busy'); shown = true; return; } clearInterval(pollT); show('ok'); return; }
      if (n > 8) { clearInterval(pollT); if (shown) show('ok'); }
    }, 300);
  }, true);
  window.addEventListener('scroll', function () { if (chip && chip.classList.contains('on')) place(); }, { passive: true });

  /* ---------- 3. Introschermen ---------- */
  var SEEN = 'kma-ui-intro';
  var TEXT = {
    boek: [
      { k: 'Welkom', h: 'Jouw reflectieboekje voor de hele opleiding', p: 'Je werkt aan je leervraag, legt feiten vast met datum en tijd, en reflecteert op wat je meemaakt. Zo zie je je eigen groei, en heb je bewijs bij elk gesprek met je teamleider.' },
      { k: 'Wie ziet wat', h: 'Jij bepaalt wat je deelt', rows: [['lock', 'Alles staat op jouw telefoon', 'Versleuteld, met je pincode of vingerafdruk ervoor.'], ['users', 'Je teamleider ziet wat jij deelt', 'Per hoofdstuk zet je "Gedeeld met teamleider" aan of uit.'], ['eye', 'Privé blijft privé', 'Wat je niet deelt, gaat nooit mee.']] },
      { k: 'Hoe deel je', h: 'Delen in drie stappen', steps: [['Tik op Delen', 'Rechtsboven in de app.'], ['Kies hoe', 'QR-code laten scannen, een bestand sturen, of automatisch via de gedeelde map van je peloton.'], ['Feedback komt terug', 'Je ziet hem op de startpagina en bij het hoofdstuk waar hij over gaat.']] }
    ],
    cvs: [
      { k: 'Welkom', h: 'Het volgsysteem voor je peloton', p: 'Je ontvangt de dossiers van je cadetten, legt waarnemingen vast met datum, tijd en feit, en geeft gerichte feedback. Alles op één plek, ook zonder internet.' },
      { k: 'Wie ziet wat', h: 'De cadet bepaalt wat hij deelt', rows: [['lock', 'Alles staat op dit toestel', 'Versleuteld, met je pincode of vingerafdruk ervoor.'], ['users', 'Rollen bepalen wat je ziet', 'Teamleider, senior- en junior-instructeur hebben elk hun eigen rechten.'], ['eye', 'Jij kiest wat de cadet ziet', 'DTF-notities en feedback gaan alleen mee als jij ze deelt.']] },
      { k: 'Hoe werkt het', h: 'Feedback in drie stappen', steps: [['Dossier ontvangen', 'Via QR-code, een bestand of automatisch via de deelmap.'], ['Feedback schrijven', 'Bij elk hoofdstuk: waar werkt de cadet naartoe, hoe gaat het nu en wat is de volgende stap.'], ['Terugsturen', 'In het dossier via ⋮ › Feedback naar cadet sturen.']] }
    ]
  };
  function seen() { try { return !!(window.kmaStore || localStorage).getItem(SEEN); } catch (e) { return true; } }
  function markSeen() { try { (window.kmaStore || localStorage).setItem(SEEN, new Date().toISOString()); } catch (e) {} }
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function slideHtml(s) {
    var ic = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
    return '<p class="kma-intro-k">' + esc(s.k) + '</p><h2 id="kma-intro-h">' + esc(s.h) + '</h2>' +
      (s.p ? '<p class="kma-intro-p">' + esc(s.p) + '</p>' : '') +
      (s.rows ? '<ul class="kma-intro-rows">' + s.rows.map(function (r) { return '<li><span class="kma-intro-ic" aria-hidden="true">' + ic(r[0]) + '</span><div><strong>' + esc(r[1]) + '</strong><span>' + esc(r[2]) + '</span></div></li>'; }).join('') + '</ul>' : '') +
      (s.steps ? '<ol class="kma-intro-steps">' + s.steps.map(function (r, i) { return '<li><span class="kma-intro-n" aria-hidden="true">' + (i + 1) + '</span><div><strong>' + esc(r[0]) + '</strong><span>' + esc(r[1]) + '</span></div></li>'; }).join('') + '</ol>' : '');
  }
  function openIntro() {
    if (document.getElementById('kma-intro')) return;
    var list = TEXT[isCvs() ? 'cvs' : 'boek'], i = 0;
    var ov = document.createElement('div');
    ov.id = 'kma-intro'; ov.className = 'kma-intro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'kma-intro-h');
    function draw(dir) {
      ov.innerHTML = '<div class="kma-intro-top"><img src="kma-embleem.svg" alt="KMA">' + (i < list.length - 1 ? '<button type="button" class="kma-intro-skip" data-ki="skip">Overslaan</button>' : '') + '</div>' +
        '<div class="kma-intro-body">' + slideHtml(list[i]) + '</div>' +
        '<div class="kma-intro-foot"><div class="kma-intro-dots" aria-label="Stap ' + (i + 1) + ' van ' + list.length + '">' + list.map(function (x, j) { return '<span class="' + (j === i ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
        '<button type="button" class="kma-intro-next" data-ki="next">' + (i < list.length - 1 ? 'Volgende' : 'Aan de slag') + '</button></div>';
      enter(ov.querySelector('.kma-intro-body'), dir);
      var b = ov.querySelector('.kma-intro-next'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
    }
    function close() { markSeen(); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, reduce() ? 0 : 200); }
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ki]'); if (!b) return;
      if (b.getAttribute('data-ki') === 'skip') return close();
      if (i < list.length - 1) { i++; draw('r'); } else close();
    });
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && i < list.length - 1) { i++; draw('r'); }
      if (e.key === 'ArrowLeft' && i > 0) { i--; draw('l'); }
    });
    var x0 = null;
    ov.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ov.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx < -50 && i < list.length - 1) { i++; draw('r'); } else if (dx > 50 && i > 0) { i--; draw('l'); }
    });
    document.body.appendChild(ov);
    draw('');
  }
  window.kmaIntro = { open: openIntro, seen: seen };
  function locked() {
    return ['pin-lock-screen', 'cvs-pin-lock-screen'].some(function (id) { var el = document.getElementById(id); return el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'); }) ||
      !!document.querySelector('.kma-eula-ov, #kma-eula');
  }
  function maybe() {
    if (seen() || (navigator.webdriver && !window.__kmaIntroForce)) return;
    if (!window.kmaEula || !kmaEula.accepted()) return;
    if (locked()) { setTimeout(maybe, 800); return; }
    openIntro();
  }
  document.addEventListener('kma-eula-akkoord', function () { setTimeout(maybe, 250); });
  /* ---------- 4. Systeembalken: statusbalk in de kleur van de kop, navigatiebalk in de kleur van de pagina ---------- */
  function hex(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ''); if (!m || (m[4] != null && +m[4] < 0.5)) return null;
    return '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
  }
  var lastBars = '';
  function syncBars() {
    var A = window.Android; if (!A || typeof A.setBars !== 'function') return;
    var st, nv;
    if (document.getElementById('kma-intro')) { st = nv = '#09140f'; }
    else {
      var h = document.querySelector('.site-header');
      st = (h && hex(getComputedStyle(h).backgroundColor)) || '#0c140f';
      nv = hex(getComputedStyle(document.body).backgroundColor) || hex(getComputedStyle(document.documentElement).backgroundColor) || st;
    }
    if (st + nv === lastBars) return;
    lastBars = st + nv;
    try { A.setBars(st, nv); } catch (e) {}
  }
  window.kmaSyncBars = function () { lastBars = ''; syncBars(); };
  var barsT = 0;
  function soon() { clearTimeout(barsT); barsT = setTimeout(syncBars, 60); }
  function watchBars() {
    try {
      var mo = new MutationObserver(soon);
      mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'], childList: true });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    } catch (e) {}
    document.addEventListener('visibilitychange', function () { if (!document.hidden) window.kmaSyncBars(); });
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', soon); } catch (e) {}
    syncBars();
  }

  function init() { hookNav(); wrapStore(); watchBars(); setTimeout(maybe, 600); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();

/*
 * 4.5.1: de handleiding in de app (⋮ › Handleiding). Het Reflectieboekje toont alleen deel A, het
 * CadetVolgSysteem alleen deel B. Het bestand (kma-handleiding-boek.js / -cvs.js) wordt pas geladen als je hem opent.
 * Bij elk hoofdstuk staat een knop die dat hoofdstuk in de app opent; kmaHandleiding.open() zonder sectie opent
 * bij het hoofdstuk waar je nu bent.
 */
(function () {
  'use strict';
  if (window.kmaHandleiding) return;
  var isCvs = function () { return typeof cadets !== 'undefined' || !!document.getElementById('detail-view'); };
  var loading = null;
  function load() {
    if (window.KMA_HANDLEIDING) return Promise.resolve(window.KMA_HANDLEIDING);
    if (loading) return loading;
    var first = isCvs() ? 'cvs' : 'boek';
    function tryLoad(name) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script'); s.src = 'kma-handleiding-' + name + '.js';
        s.onload = function () { window.KMA_HANDLEIDING ? res(window.KMA_HANDLEIDING) : rej(new Error('leeg')); };
        s.onerror = function () { s.remove(); rej(new Error('niet gevonden')); };
        document.head.appendChild(s);
      });
    }
    // In de CadetVolgSysteem-app zit alleen het CVS-deel, ook voor het tabblad Cadet-app.
    loading = tryLoad(first).catch(function () { return tryLoad(first === 'cvs' ? 'boek' : 'cvs'); });
    loading.catch(function () { loading = null; });
    return loading;
  }
  /** 4.28.0 (blok T): in de Dashboard-weergave volgt de handleiding mee: "Meer → …" in plaats van "⋮ → …" en
   *  bovenaan een verwijzing naar het deel over de Dashboard-weergave (A26 in het boekje, B13 in het CVS). */
  function weergaveHtml(data) {
    var h = String(data.html || '');
    if (!window.kmaWeergave || !kmaWeergave.dash()) return h;
    h = h.replace(/(<(?:b|i)>)⋮(\s*→)/g, '$1Meer$2').replace(/menu ⋮/g, 'menu Meer');
    var doel = data.app === 'cvs' ? 'B13' : 'A26';
    var kop = '<p class="lead" style="background:#f3efde;border-radius:10px;padding:10px 12px">Je gebruikt de <b>Dashboard-weergave</b>. De weg naar een onderdeel loopt via de knoppen onderin; <i>Meer</i> is het menu. Uitleg: <a class="ref" href="#' + doel + '">' + doel + '</a>.</p>';
    return h.replace('</h1>', '</h1>' + kop);
  }
  var ESC = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var EXTRA = 'html{background:#fff}body{margin:0;padding:16px 16px 48px;max-width:760px;margin:0 auto;font-family:"KMA Tekst",system-ui,sans-serif;color:#172019;font-size:15px;line-height:1.55;-webkit-text-size-adjust:100%}' +
    '.sec{page-break-before:auto!important;break-before:auto!important;margin:28px 0 0;padding:0;min-height:0!important;height:auto!important}' +
    '.sec h2{font-size:22px;line-height:1.25}.kicker{font-size:13px}.tut.row,.row2,.twocol{display:block!important}' +
    '.phones{display:flex!important;flex-wrap:wrap;gap:10px}.phone{width:46%!important;max-width:200px;margin:0!important}.phone img{width:100%!important;height:auto!important}' +
    'img{max-width:100%;height:auto}a{color:#6f5f22}a.ref{font-weight:700}' +
    '.ho-top h1{font-size:28px;margin:0 0 6px}.ho-toc{margin:16px 0 8px}.ho-toc .toc-row{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #e3e1d6;text-decoration:none;color:#172019;font-size:15px}' +
    '.ho-toc .toc-row .n{min-width:40px;color:#6f5f22;font-weight:700}.toc-part{margin-top:16px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6f5f22}' +
    '.ho-open{display:inline-flex;align-items:center;min-height:44px;margin:8px 0 4px;padding:0 16px;border-radius:12px;border:0;background:#c5b983;color:#111a14;font:inherit;font-weight:700;cursor:pointer}' +
    '.ho-hl{outline:3px solid #c5b983;outline-offset:6px;border-radius:6px}' +
    'a.ho-go{color:#5c4e14;text-decoration:underline;text-decoration-color:#c5b983;text-decoration-thickness:2px;text-underline-offset:3px;cursor:pointer}a.ho-go b,a.ho-go i{color:inherit}a.ho-go::after{content:"\\2197";font-size:.8em;margin-left:2px;text-decoration:none;display:inline-block}' +
    '@media print{.ho-open{display:none}}';
  /* 4.5.2: links in de tekst die meteen naar de app gaan.
     data-step: een hoofdstuk van het Reflectieboekje; data-menu: een onderdeel van het menu ⋮ (in het
     CadetVolgSysteem eerst het hoofdmenu, anders het menu van een dossier); data-share: een onderdeel van Delen;
     data-click: een knop in de app. */
  function sheetPick(label) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.kma-sheet-item'));
    var it = items.find(function (b) { var s = b.querySelector('strong'); return s && s.textContent.trim().toLowerCase().indexOf(label.toLowerCase()) === 0; });
    if (it) { it.click(); return true; }
    return false;
  }
  function viaButton(sel, label) {
    return new Promise(function (res) {
      var btn = document.querySelector(sel);
      if (!btn || btn.offsetParent === null) { res(false); return; }
      btn.click();
      setTimeout(function () { if (sheetPick(label)) { res(true); return; } if (window.kmaCloseSheet) kmaCloseSheet(); else { var o = document.querySelector('.kma-sheet-overlay'); if (o) o.remove(); } res(false); }, 260);
    });
  }
  function goApp(g) {
    var step = g.getAttribute('data-step'), menu = g.getAttribute('data-menu'), share = g.getAttribute('data-share'), click = g.getAttribute('data-click');
    var miss = function () { if (window.kmaToast) kmaToast('Dit onderdeel staat niet op dit scherm. Kijk in het menu ⋮.', 'error'); };
    if (step != null) {
      var n = Number(step);
      if (typeof goToStep === 'function' && typeof steps !== 'undefined' && steps[n]) { goToStep(n); try { window.scrollTo(0, 0); } catch (x) {} } else miss();
      return;
    }
    if (click) { var el = document.querySelector(click); if (el && el.offsetParent !== null) el.click(); else miss(); return; }
    if (share) { viaButton('#kma-share-btn', share).then(function (ok) { if (!ok) miss(); }); return; }
    if (menu) {
      viaButton('#kma-more-btn', menu).then(function (ok) {
        if (ok || !isCvs()) { if (!ok) miss(); return; }
        // In het CadetVolgSysteem: het menu van een dossier. Is er geen dossier open, dan het eerste.
        var open = typeof activeCadetId !== 'undefined' && activeCadetId != null && document.getElementById('kma-det-more') && document.getElementById('kma-det-more').offsetParent !== null;
        if (!open && typeof cadets !== 'undefined' && cadets.length && typeof openDetailView === 'function') openDetailView(cadets[0].id);
        setTimeout(function () { viaButton('#kma-det-more', menu).then(function (ok2) { if (!ok2) miss(); }); }, open ? 0 : 350);
      });
    }
  }
  function stepFor(data, sid) { return data.steps ? data.steps[sid] : undefined; }
  function sidForStep(data, idx) { var k = Object.keys(data.steps || {}); for (var i = 0; i < k.length; i++) if (data.steps[k[i]] === idx) return k[i]; return null; }
  function open(sid) {
    if (document.getElementById('kma-ho')) return;
    var ov = document.createElement('div');
    ov.id = 'kma-ho'; ov.className = 'kma-ho'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Handleiding');
    ov.innerHTML = '<div class="kma-ho-bar"><strong>Handleiding</strong><span class="kma-ho-sp"></span><button type="button" class="kma-ho-btn" data-ho="top">Inhoud</button><button type="button" class="kma-ho-btn" data-ho="x" aria-label="Sluiten">' + (window.kmaIcon ? kmaIcon('x') : '×') + '</button></div>' +
      '<div class="kma-ho-body"><p class="kma-ho-wait">Handleiding laden…</p></div>';
    document.body.appendChild(ov);
    if (window.kmaEnter) kmaEnter(ov, 'r');
    var close = function () { ov.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    load().then(function (data) {
      if (!sid && !isCvs() && typeof currentStepIndex !== 'undefined') sid = sidForStep(data, currentStepIndex);
      var fr = document.createElement('iframe'); fr.className = 'kma-ho-frame'; fr.title = 'Handleiding';
      fr.srcdoc = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="fonts/fonts.css"><style>' + data.css + EXTRA + '</style></head><body>' + weergaveHtml(data) + '</body></html>';
      var body = ov.querySelector('.kma-ho-body'); body.innerHTML = ''; body.appendChild(fr);
      fr.addEventListener('load', function () {
        var d = fr.contentDocument; if (!d) return;
        var go = function (id) { var el = d.getElementById(id); if (!el) return; el.scrollIntoView({ block: 'start' }); el.classList.add('ho-hl'); setTimeout(function () { el.classList.remove('ho-hl'); }, 1600); };
        d.addEventListener('click', function (e) {
          var g = e.target.closest('.ho-go');
          if (g) { e.preventDefault(); close(); goApp(g); return; }
          var b = e.target.closest('.ho-open');
          if (b) {
            var n = Number(b.getAttribute('data-step')); close();
            if (typeof goToStep === 'function' && typeof steps !== 'undefined' && steps[n]) { goToStep(n); try { window.scrollTo(0, 0); } catch (x) {} }
            return;
          }
          var a = e.target.closest('a[href^="#"]');
          if (a) { e.preventDefault(); go(a.getAttribute('href').slice(1)); }
        });
        ov._go = go;
        if (sid) go(sid);
      });
    }).catch(function () {
      ov.querySelector('.kma-ho-body').innerHTML = '<p class="kma-ho-wait">De handleiding zit niet in deze versie van de app. Je vindt hem ook als PDF in het publicatiepakket.</p>';
    });
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ho]'); if (!b) return;
      if (b.getAttribute('data-ho') === 'x') close();
      else { var fr = ov.querySelector('iframe'); if (fr && fr.contentWindow) fr.contentWindow.scrollTo(0, 0); }
    });
  }
  window.kmaHandleiding = { open: open, load: load };
})();

/*
 * 4.5.2: Demo-cadetten. Drie fictieve cadetten met een volledig ingevuld dossier (kma-demo.js, gemaakt door
 * tools/demo/maak_demo.js), om de apps te leren kennen of uit te leggen.
 *  - CadetVolgSysteem: ⋮ → Demo-cadetten voegt de drie dossiers toe (gemarkeerd als demo) of haalt ze weer weg.
 *  - Reflectieboekje: ⋮ → Demodossier zet het boekje van één demo-cadet neer. Dat kan alleen in een leeg boekje,
 *    zodat niemand per ongeluk zijn eigen antwoorden overschrijft.
 */
(function () {
  'use strict';
  if (window.kmaDemo) return;
  var loading = null;
  function load() {
    if (window.KMA_DEMO) return Promise.resolve(window.KMA_DEMO);
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = 'kma-demo.js';
      s.onload = function () { window.KMA_DEMO ? res(window.KMA_DEMO) : rej(new Error('leeg')); };
      s.onerror = function () { s.remove(); loading = null; rej(new Error('niet gevonden')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  var toast = function (t, k) { if (window.kmaToast) kmaToast(t, k); else alert(t); };
  var fail = function () { toast('De demo-cadetten zitten niet in deze versie van de app', 'error'); };

  /* ---------- Reflectieboekje ---------- */
  function boekHasData() {
    try {
      var a = typeof answers !== 'undefined' ? answers : {};
      var filled = Object.keys(a).filter(function (k) { return typeof a[k] === 'string' && a[k].trim(); }).length;
      return filled > 0 || (typeof dtfItems !== 'undefined' && dtfItems.length > 0) || (typeof cases5GT !== 'undefined' && cases5GT.some(function (c) { return window.KMA5GT && KMA5GT.anyFilled(c); }));
    } catch (e) { return true; }
  }
  function boek() {
    if (boekHasData()) {
      toast('Een demodossier kan alleen in een leeg boekje. Maak eerst een back-up (⋮ → Back-up maken) en wis daarna je boekje, of probeer het op een ander toestel.', 'error');
      return;
    }
    load().then(function (D) {
      kmaSheet({ title: 'Demodossier', items: (D.namen || []).map(function (n) {
        return { icon: 'user', label: n.name, hint: 'Fictieve cadet, groep ' + n.group + ' · volledig ingevuld', onClick: function () {
          kmaConfirm('Het boekje van ' + n.name + ' (fictief) neerzetten? Je kunt het later weer wissen met ⋮ → Alles wissen.', { ok: 'Neerzetten', danger: false }).then(function (ok) { if (!ok) return;
          try { kmaStore.setItem('kma-x-demo', JSON.stringify(n.key)); } catch (e) {}
          var f = new File([JSON.stringify(D.boek[n.key])], 'KMA_Demo_' + n.key + '.json', { type: 'application/json' });
          if (typeof importBackupFile === 'function') importBackupFile({ target: { files: [f] } });
        });
} };
      }) });
    }, fail);
  }

  /* ---------- CadetVolgSysteem ---------- */
  function demoCount() { return typeof cadets !== 'undefined' ? cadets.filter(function (c) { return c && c.demo; }).length : 0; }
  function cvsRefresh() { if (typeof saveCVS === 'function') saveCVS(); if (typeof renderCadets === 'function') renderCadets(); }
  function cvsAdd() {
    load().then(function (D) {
      var now = Date.now(), n = 0;
      (D.cvs || []).forEach(function (c, i) {
        if (cadets.some(function (x) { return x.demo && x.name === c.name; })) return;
        var o = JSON.parse(JSON.stringify(c)); o.id = now + i; o.demo = true; cadets.push(o); n++;
      });
      cvsRefresh();
      toast(n ? n + ' demo-cadetten toegevoegd' : 'De demo-cadetten staan er al');
    }, fail);
  }
  function cvsRemove() {
    var n = demoCount(); if (!n) return;
    kmaConfirm('De ' + n + ' demo-cadetten en alles wat je bij hen hebt ingevuld verwijderen?', { ok: 'Verwijderen', danger: true }).then(function (ok) { if (!ok) return;
    var keep = cadets.filter(function (c) { return !(c && c.demo); });
    cadets.length = 0; Array.prototype.push.apply(cadets, keep);
    cvsRefresh();
    toast('Demo-cadetten verwijderd');
  });
}
  function cvs() {
    kmaSheet({ title: 'Demo-cadetten', items: [
      { icon: 'plus', label: 'Demo-cadetten toevoegen', hint: 'Drie fictieve cadetten met een volledig dossier: Daan, Noor en Ruben', onClick: cvsAdd },
      demoCount() ? { icon: 'trash', label: 'Demo-cadetten verwijderen', hint: demoCount() + ' in je lijst', danger: true, onClick: cvsRemove } : null
    ].filter(Boolean) });
  }
  window.kmaDemo = { load: load, boek: boek, cvs: cvs, cvsAdd: cvsAdd, cvsRemove: cvsRemove, count: demoCount, boekHasData: boekHasData };
})();

/*
 * 4.5.2: overal hetzelfde invoerveld, met microfoon.
 * Tekstvakken die de apps zelf al met een microfoon tekenen (de vragen, 5G-T, Korthagen) blijven zoals ze zijn.
 * Alle andere tekstvakken (textarea) en lange tekstregels (maxlength 100 of meer, of data-mic) krijgen hier
 * dezelfde microfoonknop: als-dan-plannen, de check-in, feedback in het CadetVolgSysteem, gespreksverslagen,
 * plannen enzovoort. Zet data-nomic op een veld dat geen microfoon mag krijgen.
 */
(function () {
  'use strict';
  if (window.kmaDictate) return;
  var seq = 0;
  function dictate(el, btn) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (window.kmaToast) kmaToast('Inspreken werkt niet in deze browser. Typ je tekst.', 'error'); else alert('Inspreken werkt niet in deze browser. Typ je tekst.'); return; }
    if (btn && btn.classList.contains('listening') && btn.__rec) { try { btn.__rec.stop(); } catch (e) {} return; }
    var r = new SR(); r.lang = 'nl-NL'; r.continuous = true; r.interimResults = false;
    if (btn) btn.__rec = r;
    r.onstart = function () { if (btn) btn.classList.add('listening'); };
    r.onresult = function (ev) {
      var t = '';
      for (var i = ev.resultIndex; i < ev.results.length; ++i) if (ev.results[i].isFinal) t += ev.results[i][0].transcript;
      if (!t) return;
      var max = Number(el.getAttribute('maxlength')) || 0, v = el.value ? el.value + ' ' + t : t;
      el.value = max ? v.slice(0, max) : v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    r.onerror = r.onend = function () { if (btn) btn.classList.remove('listening'); };
    try { r.start(); } catch (e) { if (btn) btn.classList.remove('listening'); }
  }
  window.kmaDictate = dictate;
  function eligible(el) {
    if (el.__kmaMic || el.hasAttribute('data-nomic') || el.readOnly || el.disabled) return false;
    if (el.closest('[data-nomic], .kma-test, #kma-eula, .kma-pin-pad, #pin-lock-screen')) return false;
    if (el.tagName === 'INPUT') {
      if ((el.type || 'text') !== 'text') return false;
      if (!el.hasAttribute('data-mic') && !(Number(el.getAttribute('maxlength')) >= 100)) return false;
    }
    if (/search|zoek|pin|code|naam|name/i.test(el.id || '') && !el.hasAttribute('data-mic')) return false;
    var p = el.parentElement;
    if (!p || p.querySelector(':scope > .btn-mic')) return false;
    return true;
  }
  function add(el) {
    el.__kmaMic = true;
    if (!el.id) el.id = 'kma-f' + (++seq);
    var wrap = document.createElement('span'); wrap.className = 'kma-mic-wrap' + (el.tagName === 'TEXTAREA' ? ' is-area' : '');
    var had = document.activeElement === el, s0 = had ? el.selectionStart : null, s1 = had ? el.selectionEnd : null;
    el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
    if (had) { try { el.focus({ preventScroll: true }); if (s0 != null) el.setSelectionRange(s0, s1); } catch (e) {} }
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn-mic kma-mic-auto'; b.title = 'Spreek in'; b.setAttribute('aria-label', 'Inspreken');
    b.id = 'mic-btn-' + el.id;
    b.innerHTML = window.kmaIcon ? kmaIcon('mic') : '🎙️';
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); dictate(el, b); });
    wrap.appendChild(b);
  }
  var queued = false;
  function scan() {
    queued = false;
    var list = document.querySelectorAll('textarea, input[type=text][maxlength], input[data-mic]');
    for (var i = 0; i < list.length; i++) if (eligible(list[i])) add(list[i]);
  }
  function later() { if (!queued) { queued = true; (window.requestAnimationFrame || setTimeout)(scan); } }
  function start() { scan(); try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

/* 4.5.3: zwevende knop krimpt tot een plusje bij naar beneden scrollen en komt terug bij omhoog scrollen of bovenaan */
(function () {
  if (window.__kmaFabMini) return; window.__kmaFabMini = true;
  var last = new WeakMap(), docLast = 0;
  function pos(t) { return (t === document || t === document.documentElement || t === document.body) ? (window.scrollY || document.documentElement.scrollTop || 0) : t.scrollTop; }
  document.addEventListener('scroll', function (e) {
    var t = e.target, y = pos(t);
    var isDoc = (t === document || t === document.documentElement || t === document.body);
    var prev = isDoc ? docLast : (last.get(t) || 0);
    if (isDoc) docLast = y; else last.set(t, y);
    if (!isDoc && t.scrollHeight - t.clientHeight < 120) return; // kleine lijstjes en tabbalken tellen niet mee
    var b = document.body; if (!b) return;
    // een data-attribuut, geen class: wijzigingen in de class laten de systeembalken opnieuw kleuren
    if (y < 40 || y < prev - 6) { if (b.hasAttribute('data-kma-fab')) b.removeAttribute('data-kma-fab'); }
    else if (y > prev + 6) { if (!b.hasAttribute('data-kma-fab')) b.setAttribute('data-kma-fab', 'mini'); }
  }, { capture: true, passive: true });
})();

/*
 * 4.6.0: één geheel.
 *  1. kmaAlert / kmaConfirm: meldingen en vragen in de stijl van de app, in plaats van de losse vensters van de
 *     browser of de telefoon. Een melding die nog openstond als de pagina herlaadt (bijvoorbeeld "Back-up
 *     teruggezet"), komt na het herladen terug. In automatische tests (navigator.webdriver) blijven de gewone
 *     vensters, tenzij window.__kmaDialogTest aan staat.
 *  2. kmaCheck: een vinkje dat zichzelf tekent bij afvinken (check-in, afspraak, verwerkt, taak klaar).
 *  3. Getallen tellen even op naar hun waarde (voortgang, groeitegels); balken lopen vol (in CSS).
 *  4. Terug: window.kmaBack() sluit eerst een open venster of menu, gaat dan een stap terug (dossier dicht,
 *     vorig hoofdstuk). De Android-terugknop vraagt dit eerst; op de iPhone en iPad doet vegen vanaf de
 *     linkerrand hetzelfde.
 * Alle beweging staat uit als op het toestel "Beweging beperken" aan staat.
 */
(function () {
  'use strict';
  if (window.__kmaBeleving) return; window.__kmaBeleving = true;
  var reduce = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var nativeAlert = window.alert, nativeConfirm = window.confirm;
  function useNative() { return navigator.webdriver && !window.__kmaDialogTest; }

  /* ---------- 1. Meldingen en vragen ---------- */
  var queue = [], showing = null, PEND = 'kma-ui-melding';
  /** Tekst met lege regels en opsommingen (• of -) netjes als alinea's en lijst. */
  function format(text) {
    var parts = String(text == null ? '' : text).split(/\n{2,}/), title = '';
    if (parts.length > 1 && parts[0].length <= 70 && !/\n/.test(parts[0])) title = parts.shift();
    var body = parts.map(function (p) {
      var lines = p.split('\n');
      if (lines.every(function (l) { return /^\s*[•\-–]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + esc(l.replace(/^\s*[•\-–]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + lines.map(esc).join('<br>') + '</p>';
    }).join('');
    return { title: title, body: body };
  }
  function next() {
    if (showing || !queue.length) return;
    var d = queue.shift(); showing = d;
    var f = format(d.text);
    var ov = document.createElement('div'); ov.className = 'kma-dlg-ov';
    var box = document.createElement('div'); box.className = 'kma-dlg'; box.setAttribute('role', d.buttons.length > 1 ? 'alertdialog' : 'dialog'); box.setAttribute('aria-modal', 'true');
    var id = 'kma-dlg-' + Date.now();
    box.innerHTML = '<div class="kma-sheet-grip" aria-hidden="true"></div>' + (d.icon ? '<span class="kma-dlg-ic ' + (d.danger ? 'is-danger' : '') + '" aria-hidden="true">' + (window.kmaIcon ? kmaIcon(d.icon) : '') + '</span>' : '') +
      (f.title ? '<h3 id="' + id + '-h">' + esc(f.title) + '</h3>' : '') + '<div class="kma-dlg-body" id="' + id + '-b">' + f.body + '</div>' +
      '<div class="kma-dlg-act">' + d.buttons.map(function (b, i) { return '<button type="button" class="kma-dlg-b' + (b.kind ? ' is-' + b.kind : '') + '" data-dlg="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div>';
    if (f.title) box.setAttribute('aria-labelledby', id + '-h'); box.setAttribute('aria-describedby', id + '-b');
    ov.appendChild(box); document.body.appendChild(ov);
    var prev = document.activeElement;
    function close(v) {
      if (!showing) return;
      document.removeEventListener('keydown', key, true);
      ov.classList.add('out');
      setTimeout(function () { ov.remove(); }, reduce() ? 0 : 160);
      showing = null;
      if (d.pending) { try { sessionStorage.removeItem(PEND); } catch (e) {} }
      try { if (prev && prev.focus && document.body.contains(prev)) prev.focus({ preventScroll: true }); } catch (e) {}
      d.done(v);
      setTimeout(next, reduce() ? 0 : 170);
    }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(d.cancelValue); }
      else if (e.key === 'Tab') {   // focus binnen het venster houden
        var bs = box.querySelectorAll('button'), first = bs[0], last = bs[bs.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', key, true);
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-dlg]'); if (b) close(d.buttons[+b.getAttribute('data-dlg')].value); });
    ov.addEventListener('click', function (e) { if (e.target === ov && d.buttons.length > 1) close(d.cancelValue); });
    ov.__kmaClose = function () { close(d.cancelValue); };
    var pri = box.querySelector('.kma-dlg-b.is-pri, .kma-dlg-b.is-danger') || box.querySelector('.kma-dlg-b');
    setTimeout(function () { try { (d.buttons.length > 1 && d.danger ? box.querySelector('.kma-dlg-b') : pri).focus(); } catch (e) {} }, 30);
  }
  function dialog(opts) {
    return new Promise(function (ok) {
      opts.done = ok; queue.push(opts);
      if (document.body) next(); else document.addEventListener('DOMContentLoaded', next);
    });
  }
  /** Melding in de stijl van de app. Geeft een Promise die klaar is als de melding is weggetikt. */
  window.kmaAlert = function (text, opt) {
    opt = opt || {};
    if (useNative()) { nativeAlert.call(window, String(text)); return Promise.resolve(); }
    try { sessionStorage.setItem(PEND, String(text)); } catch (e) {}
    return dialog({ text: text, icon: opt.icon || (/(niet gelukt|mislukt|fout|ongeldig|kan niet|kon niet)/i.test(String(text)) ? 'alert' : ''), pending: true, buttons: [{ label: opt.ok || 'OK', value: true, kind: 'pri' }], cancelValue: true });
  };
  /**
   * Vraag in de stijl van de app. kmaConfirm(tekst, { ok: 'Verwijderen', cancel: 'Annuleren', danger: true }) → Promise<boolean>.
   * Met { third: 'Label' } komen er drie knoppen; de derde geeft 'third'.
   */
  window.kmaConfirm = function (text, opt) {
    opt = opt || {};
    // Verwijderen met "Ongedaan maken" (4.4.0) vraagt niets: dan meteen ja, en zonder te wachten (synchroon)
    if (window.__kmaConfirmYes) return { then: function (f) { return Promise.resolve(f ? f(true) : true); } };
    if (useNative()) { var r = nativeConfirm.call(window, String(text)); return Promise.resolve(r ? true : (opt.nativeFalse != null ? opt.nativeFalse : false)); }
    var danger = opt.danger != null ? opt.danger : /verwijder|wissen|wis |ontkoppel|vervang|uitzetten/i.test(String(text));
    var b = [{ label: opt.cancel || 'Annuleren', value: false }];
    if (opt.third) b.push({ label: opt.third, value: 'third' });
    b.push({ label: opt.ok || (danger ? 'Verwijderen' : 'Doorgaan'), value: true, kind: danger ? 'danger' : 'pri' });
    return dialog({ text: text, danger: danger, icon: danger ? 'trash' : '', buttons: b, cancelValue: false });
  };
  if (!useNative()) {
    window.alert = function (m) { window.kmaAlert(m); };
  }
  // Een melding die nog openstond toen de pagina herlaadde, opnieuw tonen.
  (function () {
    var m = null; try { m = sessionStorage.getItem(PEND); } catch (e) {}
    if (m && !useNative()) setTimeout(function () { window.kmaAlert(m); }, 600);
  })();
  window.kmaDialogOpen = function () { return !!showing; };

  /* ---------- 2. Vinkje ---------- */
  /** Tekent een vinkje op de plek van el (of op x, y), en laat het weer verdwijnen. */
  window.kmaCheck = function (el, x, y) {
    if (reduce() || !document.body) return;
    var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    var cx = x != null ? x : r ? r.left + r.width / 2 : innerWidth / 2, cy = y != null ? y : r ? r.top + r.height / 2 : innerHeight / 2;
    var d = document.createElement('div'); d.className = 'kma-check-pop'; d.setAttribute('aria-hidden', 'true');
    d.style.left = Math.round(cx - 22) + 'px'; d.style.top = Math.round(cy - 22) + 'px';
    d.innerHTML = '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20"/><path d="M13 22.5l6 6 12-13"/></svg>';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 900);
  };
  // Gelukt (check-in bij de SMART-leervraag en per als-dan-plan), Verwerkt (feedback), taak klaar (agenda), leervraag voltooid
  var CHECK_SEL = '[data-pci="2"], [data-ci="2"], [data-fbr-act="ok"], [data-agenda-tick], [data-lv="voltooi-ok"]';
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest(CHECK_SEL);
    var vd = !t && e.target.closest && e.target.closest('#kma-vandaag [data-vd]');
    if (vd && /^(Gedaan|Verwerkt|Klaar)$/i.test((vd.textContent || '').trim())) t = vd;
    if (!t) return;
    if (t.type === 'checkbox' && !t.checked) return;
    var r = t.getBoundingClientRect(); window.kmaCheck(null, r.left + r.width / 2, r.top + r.height / 2);
  }, true);

  /* ---------- 3. Getallen tellen op ---------- */
  function countUp(el, to, suffix, from) {
    if (!el) return;
    suffix = suffix || '';
    if (reduce() || from === to) { el.textContent = to + suffix; return; }
    var t0 = performance.now(), dur = 520;
    if (el.__kmaCount) cancelAnimationFrame(el.__kmaCount);
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e2) + suffix;
      if (k < 1) el.__kmaCount = requestAnimationFrame(step); else el.__kmaCount = 0;
    })(t0);
  }
  window.kmaCountUp = countUp;
  var lastPct = null;
  function hookCounts() {
    if (typeof window.updateProgress === 'function' && !window.updateProgress.__kmaCount && window.kmaAfter) {
      kmaAfter('updateProgress', function () {
        var el = document.getElementById('progress-percentage'); if (!el) return;
        var v = parseInt(el.textContent, 10); if (isNaN(v)) return;
        var from = lastPct == null ? 0 : lastPct; lastPct = v;
        if (from !== v) countUp(el, v, '%', from);
      });
      window.updateProgress.__kmaCount = true;
    }
  }
  /** Kort na het openen van een scherm: nieuwe balken lopen vol (CSS) en tegels tellen op. */
  var animT = 0;
  function animWindow() {
    if (reduce() || !document.body) return;
    document.body.classList.add('kma-anim-in');
    clearTimeout(animT); animT = setTimeout(function () { document.body.classList.remove('kma-anim-in'); }, 900);
    setTimeout(function () {
      document.querySelectorAll('.kma-groei-tile > strong, .kma-tile-n').forEach(function (el) {
        if (el.__kmaCounted) return; var m = /^(\d{1,4})$/.exec((el.textContent || '').trim()); if (!m) return;
        el.__kmaCounted = true; countUp(el, +m[1], '', 0);
      });
    }, 40);
  }
  window.kmaAnimWindow = animWindow;
  function hookAnim() {
    ['goToStep', 'openDetailView', 'renderStep'].forEach(function (f) {
      if (typeof window[f] === 'function' && !window[f]['__kmaAnim'] && window.kmaAfter) { kmaAfter(f, animWindow); window[f]['__kmaAnim'] = true; }
    });
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.kma-tab, .kma-tabs button, [role="tab"]')) setTimeout(animWindow, 0); }, true);

  /* ---------- 4. Terug ---------- */
  function visible(el) { return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  var LOCKED = '#pin-lock-screen, #cvs-pin-lock-screen, #kma-eula, .kma-eula, #kma-role-ov, .kma-role-ov';
  /** Het bovenste open venster of menu (niet het pincodescherm of de gebruiksvoorwaarden). */
  function topOverlay() {
    var c = Array.prototype.slice.call(document.querySelectorAll('.kma-dlg-ov, .kma-sheet-overlay, .modal-overlay.active, #kma-ho, .kma-ws-ov, .kma-plan-ov, [role="dialog"][aria-modal="true"]'))
      .filter(function (el) { return visible(el) && !el.matches(LOCKED) && !el.closest(LOCKED); });
    var top = c[c.length - 1] || null;
    // een venster binnen een overlay: de overlay zelf sluiten
    return top ? (top.closest('.kma-dlg-ov, .kma-sheet-overlay, .modal-overlay, .kma-ws-ov, .kma-plan-ov, #kma-ho') || top) : null;
  }
  function closeOverlay(el) {
    var ov = el.closest('.kma-dlg-ov') || el;
    if (ov.__kmaClose) { ov.__kmaClose(); return true; }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (!document.body.contains(el) || !visible(el)) return true;
    // een sluitknop in het venster
    var x = el.querySelector('[data-act$="close"], [data-close], .kma-close, [aria-label="Sluiten"], [onclick*="close"], .modal-close');
    if (x) { x.click(); if (!document.body.contains(el) || !visible(el)) return true; }
    if (el.classList.contains('kma-sheet-overlay') || el.classList.contains('kma-plan-ov') || el.classList.contains('kma-ws-ov')) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // een menu sluit met een korte animatie: dan is 'in' al weg terwijl het er nog even staat
      if (!document.body.contains(el) || !visible(el) || (el.classList.contains('kma-sheet-overlay') && !el.classList.contains('in'))) return true;
    }
    if (el.classList.contains('modal-overlay')) { el.classList.remove('active'); return true; }
    if (el.id === 'kma-ho') { el.remove(); return true; }
    return !document.body.contains(el) || !visible(el);
  }
  var stepStack = [], goingBack = false;
  /** Terug: venster dicht, dossier dicht, vorig hoofdstuk. Geeft true als er iets gebeurde. */
  window.kmaBack = function () {
    try {
      var ov = topOverlay();
      if (ov) return closeOverlay(ov);
      if (document.body.classList.contains('kma-detail-open')) {
        if (typeof window.closeDetailView === 'function') window.closeDetailView();
        else { var back = document.querySelector('.kma-det-back, #kma-det-back, [data-act="det-back"]'); if (back) back.click(); else history.back(); }
        return true;
      }
      // een verplicht venster (pincode, gebruiksvoorwaarden, eerste keer de rol kiezen): niets doen
      if (document.querySelector(LOCKED) && Array.prototype.some.call(document.querySelectorAll(LOCKED), visible)) return false;
      if (typeof window.goToStep === 'function' && typeof currentStepIndex !== 'undefined') {
        // Het begin is de basis: daar betekent terug "de app uit" (zoals elke Android-app)
        if (currentStepIndex === 0) { stepStack = []; return false; }
        while (stepStack.length && stepStack[stepStack.length - 1] === currentStepIndex) stepStack.pop();
        if (stepStack.length) { goingBack = true; try { goToStep(stepStack.pop()); } finally { goingBack = false; } return true; }
        if (currentStepIndex !== 0) { goingBack = true; try { goToStep(0); } finally { goingBack = false; } return true; }
      }
    } catch (e) { console.error('kmaBack', e); }
    return false;
  };

  /* Vegen naar beneden sluit een menu of venster dat van onderen opkomt (4.8.1). Alleen als de inhoud bovenaan
     staat, zodat gewoon scrollen in een lang menu blijft werken. Velden, schuifjes en tekenvlakken doen niet mee. */
  (function () {
    var PANEL = '.kma-sheet, .kma-dlg, .modal-overlay.active > .modal-card', SKIP = 'input, textarea, select, [contenteditable="true"], canvas, input[type="range"], .kma-no-swipe';
    // Grote formulieren en de test sluiten niet met een veeg: daar zou je per ongeluk werk kwijtraken.
    var GROOT = '#hexaco-test-modal, #official-kma-form-modal, #kma-self-form-modal, #pin-setup-modal, #cvs-pin-setup-modal';
    var d = null;
    function scrolledDown(el, stop) {
      for (var n = el; n && n !== stop.parentElement; n = n.parentElement) { if (n.scrollTop > 0) return true; if (n === stop) break; }
      return false;
    }
    function buzz() {
      try { if (window.KMA_CAP && window.KMA_CAP.haptic) window.KMA_CAP.haptic('light'); else if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    }
    function reset(panel) { panel.style.transition = ''; panel.style.transform = ''; var ov = panel.parentElement; if (ov) ov.style.background = ''; }
    document.addEventListener('touchstart', function (e) {
      d = null;
      if (e.touches.length !== 1 || !e.target.closest) return;
      var panel = e.target.closest(PANEL); if (!panel || e.target.closest(SKIP)) return;
      if (panel.closest(GROOT)) return;
      var ov = topOverlay(); if (!ov || !ov.contains(panel)) return;
      if (scrolledDown(e.target, ov)) return;
      var t = e.touches[0];
      d = { panel: panel, ov: ov, x: t.clientX, y: t.clientY, t: Date.now(), dy: 0, on: false };
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!d) return;
      var t = e.touches[0], dy = t.clientY - d.y, dx = t.clientX - d.x;
      if (!d.on) {
        if (dy < -6 || Math.abs(dx) > Math.abs(dy) + 4) { d = null; return; }
        if (dy < 10) return;
        d.on = true; d.panel.style.transition = 'none';
      }
      d.dy = Math.max(0, dy);
      d.panel.style.transform = 'translateY(' + d.dy + 'px)';
      // een tikje als de veeg ver genoeg is om te sluiten (en weer als je terugschuift en opnieuw over de grens gaat)
      var far = d.dy > Math.min(140, (d.h || (d.h = d.panel.getBoundingClientRect().height || 400)) * 0.3);
      if (far && !d.far) buzz();
      d.far = far;
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    function end() {
      if (!d) return; var x = d; d = null;
      if (!x.on) return;
      var h = x.panel.getBoundingClientRect().height || 400, v = x.dy / Math.max(1, Date.now() - x.t);
      x.panel.style.transition = 'transform 180ms ease';
      if (x.dy > Math.min(140, h * 0.3) || (v > 0.6 && x.dy > 40)) {
        if (!x.far) buzz();   // snel weggeveegd: dan nu het tikje
        x.panel.style.transform = 'translateY(' + Math.round(h + 40) + 'px)';
        setTimeout(function () {
          closeOverlay(x.ov);
          // een menu dat blijft bestaan (hergebruikt) weer in de beginstand zetten
          setTimeout(function () { reset(x.panel); }, 260);
        }, 170);
      } else {
        x.panel.style.transform = '';
        setTimeout(function () { x.panel.style.transition = ''; }, 200);
      }
    }
    document.addEventListener('touchend', end, { passive: true });
    document.addEventListener('touchcancel', end, { passive: true });
  })();
  function hookSteps() {
    if (typeof window.goToStep === 'function' && !window.goToStep.__kmaBack) {
      var orig = window.goToStep;
      var w = function (idx) {
        var from = typeof currentStepIndex !== 'undefined' ? currentStepIndex : null;
        if (!goingBack && from != null && from !== idx) { stepStack.push(from); if (stepStack.length > 30) stepStack.shift(); }
        return orig.apply(this, arguments);
      };
      Object.keys(orig).forEach(function (k) { w[k] = orig[k]; });
      w.__kmaBack = true;
      window.goToStep = w; try { goToStep = w; } catch (e) {}
    }
  }
  // Vegen vanaf de linkerrand (iPhone en iPad in de app; op Android doet de telefoon dit zelf met de terugknop).
  var IOS_APP = window.KMA_PLATFORM === 'ios';
  if (IOS_APP) {
    var sx = 0, sy = 0, st = 0, track = false, hint = null;
    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t || t.clientX > 22 || e.touches.length > 1) { track = false; return; }
      track = true; sx = t.clientX; sy = t.clientY; st = Date.now();
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!track) return; var t = e.touches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
      if (dy > 60) { track = false; if (hint) { hint.remove(); hint = null; } return; }
      if (dx > 12) {
        if (!hint) { hint = document.createElement('div'); hint.className = 'kma-back-hint'; hint.innerHTML = window.kmaIcon ? kmaIcon('left') : '‹'; document.body.appendChild(hint); }
        var k = Math.min(1, dx / 90); hint.style.transform = 'translate(' + Math.round(-40 + 56 * k) + 'px,-50%)'; hint.style.opacity = String(0.3 + 0.7 * k);
        hint.classList.toggle('ready', dx >= 80);
      }
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!track) return; track = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
      if (hint) { hint.remove(); hint = null; }
      if (dx >= 80 && dy < 60 && Date.now() - st < 900) window.kmaBack();
    }, { passive: true });
  }

  function init() { hookCounts(); hookAnim(); hookSteps(); animWindow(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
  window.addEventListener('load', function () { setTimeout(function () { hookCounts(); hookAnim(); hookSteps(); }, 50); });
})();

/*
 * 4.6.0: lege schermen. kmaEmpty({ icon, title, text, btn, attrs, small }) geeft een kleine illustratie in de
 * huisstijl (gouden ring met pictogram), een kopje, één zin en hooguit één knop om te beginnen.
 * attrs zijn de data-attributen van de knop, bijvoorbeeld 'data-act="dtf-open"' (bestaande knoppen) of
 * 'data-empty-step="dtf-logbook"' (naar dat hoofdstuk).
 */
(function () {
  'use strict';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.kmaEmptyArt = function (icon) {
    return '<span class="kma-empty-art" aria-hidden="true"><svg viewBox="0 0 88 88"><circle class="r1" cx="44" cy="44" r="40"/><circle class="r2" cx="44" cy="44" r="29"/>' +
      '<circle class="d" cx="12" cy="24" r="2.5"/><circle class="d" cx="78" cy="62" r="2"/><circle class="d" cx="70" cy="14" r="1.6"/></svg>' + (window.kmaIcon ? kmaIcon(icon || 'file') : '') + '</span>';
  };
  window.kmaEmpty = function (o) {
    o = o || {};
    return '<div class="kma-empty-state' + (o.small ? ' small' : '') + '">' + window.kmaEmptyArt(o.icon) +
      '<div class="kma-empty-txt"><strong>' + esc(o.title || '') + '</strong>' + (o.text ? '<span>' + esc(o.text) + '</span>' : '') +
      (o.btn ? '<button type="button" class="kma-icon-btn is-primary kma-empty-btn" ' + (o.attrs || '') + '>' + (window.kmaIcon ? kmaIcon(o.btnIcon || 'plus') : '') + esc(o.btn) + '</button>' : '') + '</div></div>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-empty-step]'); if (!b || typeof steps === 'undefined' || typeof goToStep !== 'function') return;
    var w = b.getAttribute('data-empty-step'), i = steps.findIndex(function (s) { return s.widget === w || new RegExp(w, 'i').test(s.title || ''); });
    if (i >= 0) goToStep(i);
  });
})();

/*
 * 4.8.3: knop "Naar boven". Verschijnt linksonder als je in een lang hoofdstuk of dossier ver naar beneden bent
 * gescrold en weer een stukje omhoog scrolt (dan zoek je iets). Eén tik brengt je naar het begin van de pagina.
 * Niet zichtbaar als er een menu of venster openstaat, en niet bij het afdrukken.
 */
(function () {
  'use strict';
  if (window.__kmaNaarBoven) return; window.__kmaNaarBoven = true;
  var btn = null, last = 0, shown = false;
  function reduce() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function make() {
    if (btn || !document.body) return btn;
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'kma-top'; btn.setAttribute('aria-label', 'Naar boven'); btn.title = 'Naar boven';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    btn.addEventListener('click', function () {
      try { window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
      show(false);
      // de focus naar het begin van de pagina, voor wie met een schermlezer of toetsenbord werkt
      var h = document.querySelector('#step-title, .kma-det-head h2, main h1, main h2');
      if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} }
    });
    document.body.appendChild(btn);
    return btn;
  }
  function overlayOpen() {
    return !!document.querySelector('.kma-dlg-ov, .kma-sheet-overlay.in, .modal-overlay.active, #kma-ho, #kma-ob, .kma-ws-ov, .kma-plan-ov');
  }
  function show(on) {
    if (on === shown) return; shown = on;
    var b = make(); if (!b) return;
    b.classList.toggle('in', on); b.tabIndex = on ? 0 : -1; b.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  window.addEventListener('scroll', function () {
    var y = window.scrollY || document.documentElement.scrollTop || 0, h = window.innerHeight || 800;
    if (y < h * 1.5 || overlayOpen()) show(false);
    else if (y < last - 8) show(true);        // omhoog aan het scrollen, ver van boven
    else if (y > last + 8) show(false);       // weer naar beneden: niet in de weg zitten
    last = y;
  }, { passive: true });
  window.kmaNaarBoven = { show: show };
})();
