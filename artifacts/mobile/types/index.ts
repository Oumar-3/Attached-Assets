export type Product = {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  category: string;
  createdAt: string;
};

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  sellPrice: number;
  buyPrice: number;
};

export type Sale = {
  id: string;
  items: SaleItem[];
  total: number;
  profit: number;
  type: 'cash' | 'credit';
  clientId?: string;
  clientName?: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone?: string;
  totalDebt: number;
  createdAt: string;
};

export type DebtPayment = {
  id: string;
  clientId: string;
  amount: number;
  note?: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  shopName: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
