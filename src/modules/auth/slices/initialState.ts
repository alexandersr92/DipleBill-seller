import { IUserState } from './user.types';

const userInitialState: IUserState = {
  id: '',
  email: '',
  token: '',
  orgId: '',
  sellerId: '',
  sellerName: '',
  sellerCode: '',
  isSellerAuthenticated: false
};

export default userInitialState;
