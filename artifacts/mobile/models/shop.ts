export type ShopProfile = {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type ShopProfileInput = {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
};
