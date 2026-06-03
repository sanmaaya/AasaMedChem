# AasaMedChem Implementation Guide

## Overview
This guide provides instructions for integrating all created components and API endpoints into the existing pages. The implementation follows a phase-based approach with minimal disruption to existing functionality.

## Phase Roadmap

### ✅ Phase 1-4: Foundation (COMPLETED)
- Database schema with all relationships
- Authentication with 3-role RBAC
- 22 React components covering all business domains
- 5 comprehensive API endpoint groups
- PDF generation utility
- Drizzle ORM integration

### 🔄 Phase 5: Page Integration (CURRENT)
Replace existing static/placeholder pages with fully functional implementations

### 📋 Phase 6: Real-time Features
WebSocket integration for notifications and live updates

---

## Component Integration Guide

### Products Section

#### Admin Products Page (`src/app/admin/products/page.jsx`)
```jsx
import ProductForm from '@/components/ProductForm';
import CategoryManager from '@/components/CategoryManager';
import LowStockAlert from '@/components/LowStockAlert';
import ImageUploader from '@/components/ImageUploader';
import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch('/api/products?limit=50');
      const data = await res.json();
      setProducts(data.data);
    };
    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const handleProductCreate = async (formData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setProducts([...products, await res.json()]);
      }
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Product Management</h1>
      
      {/* Category Manager */}
      <section>
        <h2 className="text-lg font-bold mb-4">Categories</h2>
        <CategoryManager
          categories={categories}
          loading={loading}
          onAdd={async (name) => {
            const res = await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            });
            if (res.ok) {
              setCategories([...categories, await res.json()]);
            }
          }}
        />
      </section>

      {/* Product Form */}
      <section>
        <h2 className="text-lg font-bold mb-4">Add New Product</h2>
        <ProductForm
          onSubmit={handleProductCreate}
          categories={categories}
        />
      </section>

      {/* Products List */}
      <section>
        <h2 className="text-lg font-bold mb-4">Existing Products</h2>
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.sku}</p>
              </div>
              <div className="flex items-center gap-4">
                {product.stock <= product.lowStockThreshold && (
                  <LowStockAlert stock={product.stock} threshold={product.lowStockThreshold} />
                )}
                <span>${product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

### Quotations Section

#### Admin Quotations Page (`src/app/admin/quotations/page.jsx`)
```jsx
import RevisionHistory from '@/components/RevisionHistory';
import PartialApproval from '@/components/PartialApproval';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import QuotationTable from '@/components/QuotationTable'; // Existing component
import { useState, useEffect } from 'react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  useEffect(() => {
    const fetchQuotations = async () => {
      const res = await fetch('/api/quotations?limit=50');
      const data = await res.json();
      setQuotations(data.data);
    };
    fetchQuotations();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Quotation Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotations List */}
        <div className="lg:col-span-2">
          <QuotationTable quotations={quotations} onSelect={setSelectedQuotation} />
        </div>

        {/* Quotation Details */}
        {selectedQuotation && (
          <div className="space-y-6">
            {/* Order Status Tracker */}
            <OrderStatusTracker
              status={selectedQuotation.status}
              onStatusChange={async (newStatus) => {
                const res = await fetch(`/api/quotations/${selectedQuotation.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setSelectedQuotation(updated);
                }
              }}
            />

            {/* Partial Approval */}
            <PartialApproval
              items={selectedQuotation.items}
              onApproveItem={async (itemId) => {
                // API call to approve item
              }}
            />

            {/* Revision History */}
            <RevisionHistory
              revisions={selectedQuotation.revisions || []}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### User Management Section

#### Admin Users Page (`src/app/admin/users/page.jsx`)
```jsx
import ProfileEditor from '@/components/ProfileEditor';
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/users?limit=50');
      const data = await res.json();
      setUsers(data.data);
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 border rounded-lg text-left hover:bg-secondary ${
                  selectedUser?.id === user.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="font-bold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {user.role} • {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Details & Editor */}
        {selectedUser && (
          <div>
            <ProfileEditor user={selectedUser} />
            
            {/* Role Management */}
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-bold mb-3">Change Role</h3>
              <div className="space-y-2">
                {['admin', 'seller', 'buyer'].map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-bold ${
                      selectedUser.role === role
                        ? 'bg-primary text-white'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Analytics Section

#### Admin Analytics Page (`src/app/admin/analytics/page.jsx`)
```jsx
import SellerPerformance from '@/components/SellerPerformance';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [sellerData, setSellerData] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await fetch(`/api/analytics/seller-performance?timeRange=${timeRange}`);
      const data = await res.json();
      setSellerData(data.data);
    };
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Analytics & Reports</h1>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['daily', 'weekly', 'monthly', 'quarterly'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-bold ${
              timeRange === range
                ? 'bg-primary text-white'
                : 'bg-secondary'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Seller Performance */}
      <SellerPerformance
        data={sellerData}
        timeRange={timeRange}
      />
    </div>
  );
}
```

---

## Environment Configuration

### Required `.env.local` Variables
```env
# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@aasmedchem.com

# AWS S3 (Image Storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET_NAME=aasmedchem-images
AWS_REGION=us-east-1

# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Feature Flags
ENABLE_PDF_EXPORT=true
ENABLE_EMAIL_NOTIFICATIONS=true
CSV_MAX_ROWS=1000
QUOTATION_EXPIRY_DAYS=30
SESSION_TIMEOUT_MINUTES=30
```

---

## API Usage Examples

### Fetch Products with Search
```javascript
const response = await fetch('/api/products?search=aspirin&category=pain-relief&page=1&limit=20');
const { data, pagination } = await response.json();
```

### Create Product
```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Aspirin',
    sku: 'ASP-001',
    categoryId: 'cat-001',
    baseUnit: 'unit',
    price: 5.99,
    stock: 100,
    lowStockThreshold: 10,
  }),
});
```

### Bulk CSV Import
```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/api/products/bulk-import', {
  method: 'POST',
  body: formData,
});
const { success, errors, skipped } = await response.json();
```

### Send Quotation Email
```javascript
const response = await fetch(`/api/quotations/${quotationId}/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toEmail: 'buyer@example.com',
    subject: 'Your Quotation from AasaMedChem',
    message: 'Please review the attached quotation...',
  }),
});
```

### Fetch Analytics
```javascript
const response = await fetch('/api/analytics?type=seller-performance&timeRange=monthly');
const { data, summary } = await response.json();

// Data includes:
// - sellerId, sellerName, revenue, orders, approved, conversionRate
```

---

## Testing Checklist

- [ ] All 22 components render without errors
- [ ] API endpoints return correct data structures
- [ ] CSV import handles edge cases (duplicates, invalid data)
- [ ] Email notifications send successfully
- [ ] PDF generation produces valid PDFs
- [ ] Role-based access control enforced
- [ ] Database audit logs record all changes
- [ ] Drizzle ORM relationships working correctly
- [ ] Decimal.js precision maintained for monetary values
- [ ] Unit conversions working across components

---

## Common Issues & Solutions

### Issue: Images not uploading to S3
**Solution**: Verify AWS credentials in .env.local and bucket permissions

### Issue: Email not sending
**Solution**: Check SendGrid API key and verify sender email

### Issue: CSV import too slow
**Solution**: Increase CSV_MAX_ROWS environment variable or split imports

### Issue: Decimal precision lost
**Solution**: Ensure all monetary fields use Decimal.js and convert to strings for DB storage

---

## Next Phases

1. **Phase 6**: Real-time notifications via WebSocket
2. **Phase 7**: Advanced reporting and export (Excel, PDF)
3. **Phase 8**: Performance optimization and caching
4. **Phase 9**: Mobile-responsive refinements
5. **Phase 10**: Production deployment configuration

