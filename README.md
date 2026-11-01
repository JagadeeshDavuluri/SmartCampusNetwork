# 🏫 Smart Campus Network: Access Control System

A full-stack, real-time **Smart Campus Access Control & Monitoring System** built with Next.js 16, Prisma, SQLite, Tailwind CSS and shadcn/ui. It combines RFID and biometric gate scanning, live monitoring, security alerts and IoT device status in a single admin dashboard.

> **Screenshots:** add images to `docs/screenshots/` and link them here, for example `![Dashboard](docs/screenshots/dashboard.png)`.

---

## 🚀 Features

| Tab | Description |
|---|---|
| **Dashboard** | Live stats, hourly access-flow chart with hover details, gate uptime, user mix, busiest gates, recent activity and active alerts |
| **Users** | Manage campus users (Students, Staff, Faculty, Visitors), filter/search, export to CSV |
| **Gates** | Add/update campus gates, change status (Online / Offline / Maintenance / Locked) |
| **Access Control** | Simulate RFID / Biometric / Manual scans and view real-time results |
| **Alerts** | View and resolve security alerts with severity levels (Low → Critical) |
| **Analytics** | Weekly trends, anomaly detection, occupancy tracking, peak-hours heatmap |
| **IoT Monitor** | Live IoT device connectivity panel: sensor readings, signal strength and remote actions |
| **Map** | Interactive campus map with gate pins, gate schedule and visitor pass generator |
| **Reports** | Export access logs to CSV and print reports |

### Additional

- 🔐 **Admin authentication:** JWT-based login/logout
- 💬 **AI chatbot assistant** for campus queries
- 🎨 **Solvik-style dark UI:** frosted cards, lime accents, pill tab bar with a sliding highlight
- ✨ **Motion:** blur-fade transition on every tab change, count-up numbers, self-drawing chart line, smooth scrolling
- 🔊 **Click sound** on tab changes (generated in the browser, mutable from the side rail, remembered between visits)
- ♿ **Accessibility:** keyboard-navigable tabs (← / →), visible focus states, and all animation and smooth scrolling are switched off when the OS "reduce motion" setting is on
- 📱 **Mobile-responsive** with a bottom navigation bar
- 🔄 **Auto-refresh:** dashboard every 30 s, IoT every 10 s

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Database | SQLite via Prisma ORM |
| Charts | Recharts, plus a custom SVG chart on the dashboard |
| Icons | Lucide React |
| Animation | Framer Motion (view transitions), GSAP + `@gsap/react` (counters, chart draw-on), Lenis (smooth scroll) |
| Audio | Web Audio API (synthesised click, no audio files) |
| Notifications | Sonner (toast) |
| Runtime | Node.js / Bun |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard (all tabs)
│   ├── layout.tsx            # Root layout (fonts, smooth scroll, toasters)
│   ├── globals.css           # Solvik theme tokens and utilities
│   ├── login/                # Login page
│   └── api/                  # API routes
│       └── access-control/
│           ├── dashboard/stats
│           ├── users/
│           ├── gates/
│           ├── access-logs/
│           ├── security-alerts/
│           ├── scan/
│           └── seed/
├── components/
│   ├── solvik/
│   │   ├── SolvikShell.tsx   # Top pill tabs, icon rail, blur-fade transition
│   │   └── SolvikOverview.tsx# Dashboard tab (stats, chart, gate cards)
│   ├── SmoothScroll.tsx      # Lenis + GSAP scroll setup
│   ├── IoTMonitor.tsx        # IoT device connectivity & monitoring
│   ├── CampusMap.tsx         # Interactive campus map
│   ├── Chatbot.tsx           # AI assistant chatbot
│   ├── AnomalyDetector.tsx
│   ├── OccupancyTracker.tsx
│   ├── WeeklyTrends.tsx
│   ├── PeakHoursHeatmap.tsx
│   ├── GateSchedule.tsx
│   ├── VisitorPass.tsx
│   ├── MobileNav.tsx
│   └── ui/                   # shadcn/ui components
├── hooks/
│   └── use-click-sound.ts    # Web Audio click sound + mute state
└── lib/
    ├── auth.ts               # Auth utilities
    ├── db.ts                 # Prisma client
    └── export.ts             # CSV / print utilities
prisma/
├── schema.prisma             # Database schema
└── dev.db                    # SQLite database (local only)
```

---

## ⚙️ Database Schema

| Model | Purpose |
|---|---|
| `Gate` | Campus entry/exit points |
| `CampusUser` | Students, Staff, Faculty, Visitors |
| `AccessLog` | Every gate scan record |
| `Authorization` | User-gate access rules (time-based) |
| `SecurityAlert` | System-generated alerts |
| `AdminUser` | Dashboard admin accounts |

---

## 🔁 How an Access Request Works

1. A user scans an RFID card, fingerprint, or is entered manually at a gate.
2. The scan is sent to `POST /api/access-control/scan`.
3. The API looks up the user, the gate and the user-gate `Authorization` rules (including time windows).
4. The result (**granted** or **denied**) is written to `AccessLog`. Suspicious patterns raise a `SecurityAlert`.
5. The dashboard picks the new data up on its next refresh and updates the charts, counters and alerts.

---

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.x
- npm or bun

### 1. Install dependencies

```bash
npm install
# or
bun install
```

If the animation packages are reported as missing, install them with:

```bash
npm i lenis gsap @gsap/react
```

### 2. Configure environment

Create a `.env` file in the project root (**never commit this file**):

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="replace-with-a-long-random-string"
```

### 3. Set up the database

```bash
npm run db:generate
npm run db:push
```

### 4. Start the development server

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. The app auto-seeds sample data on first load.

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server (uses Bun; see note below) |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:reset` | Reset the database |

> **Windows note:** the `start` script uses Bun and `tee`, which are not available in a default Windows shell. On Windows, run `npm run dev`, or use Bun or WSL for the production start.

---

## 🔑 Default Login (demo only)

After the first start, log in with the seeded admin account:

| Field | Value |
|---|---|
| Email | `admin@campus.edu` |
| Password | `admin123` |

These credentials are for local demos. Change them and set a strong `JWT_SECRET` before putting the app anywhere public.

---

## 📡 IoT Monitoring

The IoT tab provides a live device monitoring dashboard:

- 8 campus IoT nodes: Controllers, Sensors, RFID Readers, Cameras, Gateways
- Live sensor readings: Temperature, Humidity, CO₂, Power consumption
- Remote actions: Restart, Power On/Off, Run Diagnostics
- Auto-refresh every 10 seconds

---

## 🔒 Security Notes

- `.env` and the SQLite database must stay out of version control (see `.gitignore`).
- Admin routes are protected by JWT authentication.
- Rotate `JWT_SECRET` and the default admin password for any shared deployment.

---

## 🌿 Contributing (team workflow)

1. Create a branch per feature: `git checkout -b feature/short-name`
2. Commit with clear messages: `git commit -m "Add gate status filter"`
3. Push and open a Pull Request into `main`; at least one teammate reviews it.

---

## 👥 Team

**Smart Campus Network: Team Project**
IoT & RFID/Biometric Integration | Real-time Monitoring

| Name | Role |
|---|---|
| _Your name_ | _e.g. Frontend & UI_ |
| _Teammate_ | _e.g. Backend & database_ |
| _Teammate_ | _e.g. IoT & hardware integration_ |

---

## 📄 License

Add a license here (for example MIT), or state that the project is for academic use.
