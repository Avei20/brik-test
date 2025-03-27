export interface CheckoutItem {
  productId: number;
  quantity: number;
}

export interface CheckoutResult {
  items: Array<{
    productId: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  orderId: string;
  createdAt: Date;
}
