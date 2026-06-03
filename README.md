# Aasa MedChem - Inventory & Order Management System

A production-ready inventory and order management system built with **Next.js 14 (App Router)**, **Neon PostgreSQL (Serverless)**, **Drizzle ORM**, **NextAuth.js v5 (Credentials)**, and **Tailwind CSS**.

Written completely in JavaScript (React ESM) as per user preference.

---

## 1. Project Overview & 3-Role Workflow

The platform handles critical pharmaceutical inventory tracking and order workflows through a strict, 3-party role-based process:

1. **Admin**: Manages products, base prices, and stock levels. Reviews pending quotations submitted by Sellers, verifies stock, and either Approves or Rejects them. **Inventory decreases only when Admin approves the quotation.**
2. **Seller**: Acts as a sales representative. Browses the catalog, builds quotations on behalf of buyers, links the quotation to a specific Buyer, writes notes, and submits it.
3. **Buyer**: The end customer. Read-only access to view their own quotations, order statuses, and transaction histories. Buyers cannot directly order or edit data.

### End-to-End Workflow Diagram

```
[ Admin ] ─────────────────────────┐
    │                              │
(Registers Sellers & Buyers)       │ (Reviews & Approves/Rejects Quotations)
    │                              │
    ▼                              ▼
[ Seller ] ──(Builds Quote)──► [ Pending Quote ] ──(Approved)──► [ Stock Decremented ]
    │                                                                   │
    │ (Links to Buyer)                                                  │
    ▼                                                                   ▼
[ Buyer ] ◄────────────────(View Confirmed Order History)───────────────┘
```

---

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, & Route Handlers)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5 (Auth.js) with role-protecting Edge Middleware
- **Security**: Password hashing using `bcryptjs`
- **Styling**: Vanilla Tailwind CSS v4 (incorporating theme accents per role: slate for Admin, blue for Seller, green for Buyer)
- **Precision Math**: `decimal.js` (for zero floating-point errors on monetary calculations)

---

## 3. Database Schema

All schemas are declared with precision types inside [schema.js](file:///d:/study/AasaMedChem/src/lib/schema.js):

### `users`
- `id` (UUID, Primary Key, Defaults to random UUID)
- `email` (TEXT, Unique, Not Null)
- `passwordHash` (TEXT, Not Null)
- `role` (TEXT, Not Null) - `'admin' | 'seller' | 'buyer'`
- `name` (TEXT, Not Null)
- `createdAt` (TIMESTAMPTZ, Defaults to now)

### `products`
- `id` (UUID, Primary Key, Defaults to random UUID)
- `name` (TEXT, Not Null)
- `description` (TEXT)
- `sku` (TEXT, Unique)
- `category` (TEXT)
- `baseUnit` (TEXT, Not Null) - `'g' | 'mL' | 'unit'` (weight, volume, and counts stored in their rawest base unit)
- `basePricePerUnit` (NUMERIC(20, 6), Not Null) - Base price per 1 base unit
- `stockQuantity` (NUMERIC(20, 6), Not Null) - Stock quantity in base units
- `isActive` (BOOLEAN, Defaults to true)
- `createdAt` / `updatedAt` (TIMESTAMPTZ, Defaults to now)

### `quotations`
- `id` (UUID, Primary Key, Defaults to random UUID)
- `sellerId` (UUID, Foreign Key → `users.id`, Not Null)
- `buyerId` (UUID, Foreign Key → `users.id`, Not Null)
- `status` (TEXT, Defaults to `'pending'`, Not Null) - `'pending' | 'approved' | 'rejected'`
- `totalAmount` (NUMERIC(20, 6), Not Null) - Grand total in INR
- `notes` (TEXT)
- `createdAt` / `updatedAt` (TIMESTAMPTZ, Defaults to now)

### `quotation_items`
- `id` (UUID, Primary Key, Defaults to random UUID)
- `quotationId` (UUID, Foreign Key → `quotations.id`, On Delete Cascade, Not Null)
- `productId` (UUID, Foreign Key → `products.id`, Not Null)
- `orderedUnit` (TEXT, Not Null) - `'g' | 'kg' | 'mL' | 'L' | 'unit'`
- `orderedQuantity` (NUMERIC(20, 6), Not Null) - Quantity in the ordered unit
- `baseQuantity` (NUMERIC(20, 6), Not Null) - Converted base quantity (g/mL/unit) stored for inventory calculations
- `unitPriceAtOrder` (NUMERIC(20, 6), Not Null) - Calculated price per ordered unit at checkout
- `lineTotal` (NUMERIC(20, 6), Not Null) - `orderedQuantity` × `unitPriceAtOrder`

---

## 4. Unit Conversion & Pricing Strategy

We enforce internal database integrity by storing all physical measures in their **smallest base unit**:
- Weight: Stored in **grams (g)**. (1 kg = 1,000 g)
- Volume: Stored in **milliliters (mL)**. (1 L = 1,000 mL)
- Count: Stored in **units**.

These conversion factors are configured as constants in [units.js](file:///d:/study/AasaMedChem/src/lib/units.js):
```javascript
export const UNIT_DIMENSIONS = {
  g:    { dimension: 'weight',  toBase: 1 },
  kg:   { dimension: 'weight',  toBase: 1000 },
  mL:   { dimension: 'volume',  toBase: 1 },
  L:    { dimension: 'volume',  toBase: 1000 },
  unit: { dimension: 'count',   toBase: 1 },
};
```

### Conversion Functions:
1. `toBaseQuantity(quantity, fromUnit)`: Converts selected quantity to grams/mL/units.
2. `toDisplayQuantity(baseQuantity, toUnit)`: Converts base grams/mL back to kg/L.
3. `getPricePerOrderedUnit(basePricePerBaseUnit, orderedUnit)`: Computes unit price based on scale.

### Worked Example:
- **Product**: Rice (base unit = `g`, base price = `₹0.05 / g`)
- **Seller orders**: `2 kg`
- **Calculations (computed inside client cart and verified by API transaction)**:
  - `baseQuantity` = $2 \times 1,000 = 2,000\text{ g}$ (stored in DB)
  - `unitPriceAtOrder` = $0.05 \times 1,000 = \text{₹}50.00\text{ per kg}$ (snapshot stored in DB)
  - `lineTotal` = $2 \text{ kg} \times \text{₹}50.00 = \text{₹}100.00$ (stored in DB)

### Numerical Rationale:
Using Javascript floats (`0.1 + 0.2 === 0.30000000000000004`) causes critical penny-rounding errors on wholesale inventory. We store numbers as PostgreSQL `NUMERIC(20, 6)` strings and perform arithmetic operations using **`decimal.js`** inside the app.

---

## 5. Local Setup Instructions

### Prerequisites
- Node.js (v20.6.0+ is recommended, as it supports loading native env files using the `--env-file` flag)
- A Neon PostgreSQL serverless database (or local PostgreSQL database)

### Installation
1. Clone the project and navigate to the directory:
   ```bash
   cd AasaMedChem
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (including `sslmode=require`)
   - `NEXTAUTH_SECRET`: A secure random secret (e.g. run `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: `http://localhost:3000`

### Database Sync & Seed
1. Sync your schema directly to your PostgreSQL database instance:
   ```bash
   npm run db:push
   ```
2. Populate seed accounts and mock product data:
   ```bash
   npm run db:seed
   ```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. Seed Accounts & Credentials

Use the following seeded accounts to test the roles:

| Role | Email | Password | Purpose / Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aasa.com` | `admin123` | Control catalog, review/approve quotes, provision users. |
| **Seller** | `seller@aasa.com` | `seller123` | Browse catalog, select buyers, submit pending quotations. |
| **Buyer 1** | `buyer@aasa.com` | `buyer123` | View own order history & statuses (Apollo Pharmacy). |
| **Buyer 2** | `buyer2@aasa.com` | `buyer123` | View own order history & statuses (MedPlus Pharmacy). |

---

## 7. Step-by-Step Quotation Walkthrough

To verify the system end-to-end, follow these actions:

1. **Step 1 (Add Stock as Admin)**:
   - Log in to `/login` using the **Admin** credentials (`admin@aasa.com` / `admin123`).
   - Go to **Products** and verify that "Paracetamol Powder" has a stock of `100,000.00 g` (base price ₹0.05/g).
   - Sign out.

2. **Step 2 (Build & Submit Quote as Seller)**:
   - Log in using **Seller** credentials (`seller@aasa.com` / `seller123`).
   - Notice the blue accent. Browse the catalogue. "Paracetamol Powder" shows `₹0.05 / g` and `₹50.00 / kg`.
   - Set the quantity to `10` and unit to `kg`. Click **Add to Cart**.
   - Navigate to the **Checkout Cart**.
   - Link the quotation to **Apollo Pharmacy (Buyer 1)** from the dropdown. Note that if no buyer is selected, the submit button is disabled.
   - Enter notes (e.g. "Requesting 10 kg comp granules standard delivery.") and click **Submit Quotation**.
   - Sign out.

3. **Step 3 (Approve & Decrement Inventory as Admin)**:
   - Log in using **Admin** credentials.
   - Notice the slate theme. Navigate to **Quotations**.
   - Find the pending quotation for Apollo Pharmacy and click **Review**.
   - You will see the Seller agent, Buyer customer, line item ("Paracetamol Powder", ordered "10 kg", base "10,000.00 g", unit price "₹50.00", total "₹500.00"), and the grand total "₹500.00".
   - Click **Approve & Allocate Stock**.
   - Go to **Products** and verify that the stock for "Paracetamol Powder" has decreased to `90,000.00 g` (10,000 g deducted).
   - Sign out.

4. **Step 4 (View Status as Buyer)**:
   - Log in using **Buyer 1** credentials (`buyer@aasa.com` / `buyer123`).
   - Notice the green accent.
   - View your dashboard: "Approved Value" will display `₹500.00`.
   - Go to **My Orders/Quotations**, click **View Details** on the quotation, and inspect the read-only breakdown.

---

## 8. Vercel Deployment Steps

1. Create a project in [Vercel](https://vercel.com).
2. Link your Git repository containing this code.
3. Configure the environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) in Vercel project settings.
4. Deploy the project.
5. Seed your database using the Vercel console or run `npm run db:seed` locally with the production `DATABASE_URL` before testing.
