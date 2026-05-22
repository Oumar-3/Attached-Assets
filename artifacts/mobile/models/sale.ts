export type SaleRecord = {
  id: string;
  receiptNumber: string;
  total: number;
  estimatedProfit: number;
  paymentType: "cash" | "credit";
  clientId: string | null;
  createdAt: string;
};

export type SaleItemRecord = {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  lineTotal: number;
  estimatedProfit: number;
};
