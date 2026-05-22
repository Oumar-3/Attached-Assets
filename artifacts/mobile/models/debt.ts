export type ClientRecord = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DebtRecord = {
  id: string;
  clientId: string;
  amount: number;
  paidAmount: number;
  status: "open" | "paid";
  description: string | null;
  saleId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DebtWithClient = DebtRecord & {
  clientName: string;
  clientPhone: string | null;
  balance: number;
};

export type DebtPaymentRecord = {
  id: string;
  debtId: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type DebtPaymentWithDebt = DebtPaymentRecord & {
  debtDescription: string | null;
  clientId: string;
};
