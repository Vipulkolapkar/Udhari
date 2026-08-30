# Udhari (उधारी) — Smart Ledger & Khata Book for Businesses

A modern, full-stack retail credit and ledger management application built with **Next.js 16 (App Router)**, **TypeScript**, **Vanilla CSS Design System**, and **Supabase (PostgreSQL, Auth & Real-Time Data)**.

---

## 🌟 Key Features

- **📊 Smart Dashboard & Analytics:** Real-time metrics for total market credit/debt, today's credit issued, collections, and active debtors.
- **🧾 Credit Billing & Down Payments:** Create itemized credit bills with instant on-spot partial down payment support.
- **💰 FIFO Debt Settlement:** Automated First-In, First-Out (FIFO) invoice clearing algorithm when recording payments.
- **📥 Customer Statement Export:** 1-click itemized statement generation (Excel / CSV) with running balances.
- **📱 WhatsApp Reminders:** Automated payment reminder templates with direct WhatsApp Web and App deep-linking.
- **🔐 Multi-Method Authentication:** Secure Google OAuth, Email OTP verification, and password authentication with complexity enforcement.
- **🌐 Bilingual Support:** Instant toggle between English and Marathi (मराठी).
- **🌓 Dual Theme:** Seamless Dark Mode and Light Mode with high-contrast typography.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Styling:** Modular CSS Tokens & Design Variables (Zero Tailwind bloat)

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/Vipulkolapkar/Udhari.git
cd Udhari/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## ☁️ Deployment

### Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Environment Variables.
5. Click **Deploy**.

---

## 📄 License
MIT License. Free for commercial and personal use.
