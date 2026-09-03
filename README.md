# 🛍️ Swapnobaz – Premium B2B + B2C Multi-Vendor Dropshipping Platform & SaaS

Welcome to **Swapnobaz**, an enterprise-grade multi-tenant dropshipping, B2B manufacturing catalog, and multi-vendor SaaS e-commerce platform built with Next.js 15, Tailwind CSS, shadcn/ui, and MongoDB.

---

## 📑 Complete Documentation Directory
All technical and handover documentations required by the project agreement are organized inside the [`/docs`](./docs) folder:

1. **[Database Schema & Collections Guide](./docs/DATABASE_SCHEMA.md)** – Comprehensive schema specifications for all 29 MongoDB collections, indexes, and relations.
2. **[REST API & Postman/Swagger Reference](./docs/API_DOCUMENTATION.md)** – Complete backend endpoint specification, payloads, authentication, and Postman collection format.
3. **[Deployment & Server Configuration Guide](./docs/DEPLOYMENT_GUIDE.md)** – Production VPS setup, Nginx reverse proxy, SSL, Redis, PM2, and environment variables.

---

## 🛠️ Technology Stack

- **Frontend & Backend Framework:** Next.js (App Router, Server Actions, Route Handlers, Node.js runtime)
- **Database:** MongoDB with Mongoose (Tenant-keyed logical data isolation)
- **Styling:** Tailwind CSS with dynamic CSS Variables (`src/app/theme.css`)
- **UI Components:** shadcn/ui, Sonner (Toasts)
- **Administrative Alerts:** SweetAlert2 (Admin validations and confirmations)
- **Icons:** Lucide React
- **Queue & Background Jobs:** Redis + BullMQ
- **Authentication:** NextAuth.js (Auth.js v5) with 7 distinct role tiers
- **AI Integrations:** Google Gemini API & OpenAI API for product descriptions and customer chat

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 18.17.0
- MongoDB instance (local or MongoDB Atlas)
- Redis server (optional for background queues; local dev works without Redis using fallbacks)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/swapnobaz?retryWrites=true&w=majority

# NextAuth Authentication
NEXTAUTH_SECRET=your_nextauth_jwt_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Base Domain
NEXT_PUBLIC_BASE_DOMAIN=swapnobaz.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Redis (for background BullMQ sync)
REDIS_URL=redis://127.0.0.1:6379

# Storage / Cloudinary (if configured)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Seed Test Users and Sample Data
Seed default accounts across all 7 user roles:
```bash
node scripts/seed-users.js
node scripts/seed-categories.js
node scripts/seed-products.js
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 System Roles & Default Test Credentials

🔑 **Default Password for All Seeded Accounts:** `Password123!`

| Role | Test Email | Permissions & Accessible Scope |
| :--- | :--- | :--- |
| **`super_admin`** | `imranshuvo101@gmail.com` | Full root control: System Design, Component Switcher (V1-V6), Project Expiration, Tenant Oversight. |
| **`admin`** | `admin1@swapnobaz.com` | Operational control: Orders, Inventory, Reseller Management, Fraud Checker, Payouts, Chalans. |
| **`manager`** | `manager1@swapnobaz.com` | Catalog management, Categories, Offers, Blog CMS, Subscriber lists. |
| **`moderator`** | `moderator1@swapnobaz.com` | Customer service, manual order booking, delivery verification. |
| **`supplier`** | `supplier1@swapnobaz.com` | Supplier portal, stock uploads, wholesale purchase bills, payout records. |
| **`reseller`** | `reseller1@swapnobaz.com` | Dedicated Reseller Panel (`/reseller/dashboard`), custom pricing, wallet & profit logs. |
| **`user`** (Customer) | `user1@swapnobaz.com` | Storefront shopping, wishlist, cart, live order tracking (`/track-order`). |

---

## 🌟 Key Platform Capabilities

1. **Multi-Tenant SaaS Subdomain Engine:**
   - Automatic storefront generation for each registered reseller (`resellername.swapnobaz.com` or custom domain via CNAME).
2. **Reverse Order Routing Workflow:**
   - Order flow: Customer $\rightarrow$ Reseller $\rightarrow$ Mother Website $\rightarrow$ Supplier $\rightarrow$ Courier API (Steadfast/Pathao/RedX) $\rightarrow$ Reseller Wallet Credit.
3. **B2B Bulk Order Form (Grid Mode):**
   - 2D matrix (Colors $\times$ Sizes) for rapid wholesale purchasing in a single click.
4. **Thermal Sticker Invoice Generator:**
   - Automated 100mm × 100mm courier shipping labels with Code39 barcodes and QR tracking codes.
5. **BD Courier Fraud Detection Engine:**
   - Analyzes customer phone delivery success rates using BD Courier API to eliminate fake or return-risk orders.
6. **Dynamic System Design Switcher (`/admin/system-design`):**
   - Live switching between 6 Navbar designs, 6 Footer variants, 6 Product Card designs, and customizable brand color themes.
7. **Virtual Wallets & Automated Accounting:**
   - Real-time commission credit upon delivery with double-entry ledger transactions.

---

## 📦 Project Handover Checklist
- [x] Complete Source Code (Frontend + Backend Next.js App Router)
- [x] MongoDB Schemas & Logical Multi-Tenant Isolation
- [x] Courier Integrations (Steadfast, Pathao, RedX)
- [x] Payment Integrations (bKash, Nagad, SSLCommerz)
- [x] [Database Schema Documentation](./docs/DATABASE_SCHEMA.md)
- [x] [REST API Specification](./docs/API_DOCUMENTATION.md)
- [x] [VPS Deployment & Setup Manual](./docs/DEPLOYMENT_GUIDE.md)

---

## 👨‍💻 Developer & Maintenance
- **Developed By:** Md. Imran Hossen
- **Client / Project:** Reza & Swapnobaz Team
