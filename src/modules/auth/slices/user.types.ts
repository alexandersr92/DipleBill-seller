export interface IUserState {
  id: string;
  orgId: string;
  email: string;
  token: string;
  isAuthenticated?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerCode?: string;
  isSellerAuthenticated?: boolean;
}
