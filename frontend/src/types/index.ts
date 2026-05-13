export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLEADO' | 'CLIENTE';
  onboarded: boolean;
  branchId: number | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Kiosk {
  id: number;
  name: string;
  ownerId: number;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  owner?: { id: number; name: string; email: string };
  branches?: Branch[];
  inviteCodes?: InviteCode[];
}

export interface Branch {
  id: number;
  kioskId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  kiosk?: { id: number; name: string };
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  categoryId: number;
  imageUrl: string | null;
  description: string | null;
  price: number;
  category?: Category;
}

export interface StockItem {
  id: number;
  branchId: number;
  productId: number;
  quantity: number;
  product?: Product;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface PaymentEntry {
  method: 'EFECTIVO' | 'DEBITO';
  amount: number;
}

export interface Sale {
  id: number;
  branchId: number;
  userId: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'MERCADOPAGO' | 'DEBITO' | 'CREDITO' | 'MIXTO';
  payments?: PaymentEntry[];
  createdAt: string;
  items?: SaleItem[];
  user?: { id: number; name: string; email: string };
  branch?: { id: number; name: string };
}

export interface InviteCode {
  id: number;
  code: string;
  kioskId: number;
  branchId: number;
  expiresAt: string;
  usedBy: number | null;
  branch?: { id: number; name: string };
}
