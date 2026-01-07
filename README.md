# Windows Estimate Pro

Professional estimate and job management for window contractors.

## Features

- ✅ User accounts with company branding
- ✅ Customer management (name, contact, address)
- ✅ Products/services library with pricing
- ✅ Line item estimates (add from products or manual)
- ✅ Job status tracking (Quote → Sold → Scheduled → In Progress → Completed → Paid)
- ✅ Professional PDF generation
- ✅ Dashboard with pipeline stats
- ✅ Dark mode (auto + manual toggle)
- ✅ Mobile responsive

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Railway)
- **Auth:** JWT with bcrypt
- **PDF:** jsPDF + jsPDF-AutoTable

---

## Deployment Instructions

### 1. Initialize Database

Go to Railway → your PostgreSQL service → **Data** tab → **Query** and run the contents of `schema.sql`:

```sql
-- Copy and paste the entire contents of schema.sql
```

### 2. Push to GitHub

```bash
cd windows-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/windows-estimate-pro.git
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:rUMxgjeqHCVskCedvnnIIVaxgMszuVWK@mainline.proxy.rlwy.net:11405/railway` |
| `JWT_SECRET` | `your-secret-key-here-make-it-long-and-random` |

5. Click **Deploy**

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env .env.local

# Push database schema (requires DATABASE_URL in .env)
npx prisma db push

# Run development server
npm run dev
```

Visit http://localhost:3000

---

## Project Structure

```
windows-app/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Login, register, logout
│   │   │   ├── customers/ # Customer CRUD
│   │   │   ├── products/  # Products CRUD
│   │   │   └── estimates/ # Estimates CRUD
│   │   ├── dashboard/     # Protected pages
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   └── estimates/
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── DashboardNav.tsx
│   │   └── ThemeProvider.tsx
│   └── lib/
│       ├── auth.ts        # JWT, password hashing
│       └── prisma.ts      # Database client
├── schema.sql             # SQL for manual DB setup
└── package.json
```

---

## Usage

1. **Register** - Create your account with company info
2. **Add Products** - Set up your windows, doors, labor rates
3. **Add Customers** - Enter customer details
4. **Create Estimates** - Select customer, add line items, set pricing
5. **Track Jobs** - Update status as jobs progress
6. **Download PDF** - Professional estimates for customers

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens (make it long and random) |
