import { IUserState } from './user.types';

const userInitialState: IUserState = {
  id: '',
  email: '',
  token: '',
  orgId: '',
  sellerId: '',
  sellerName: '',
  sellerCode: '',
  isSellerAuthenticated: false,
  mustChangePassword: false,
  avatar: '',
  googleId: ''
};

export default userInitialState;
