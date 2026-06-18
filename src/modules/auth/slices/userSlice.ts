import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import userInitialState from './initialState';
import { IUserState } from './user.types';

export const userSlice = createSlice({
  name: 'user',
  initialState: userInitialState,
  reducers: {
    setUser(state, action: PayloadAction<IUserState>) {
      const { token } = action.payload;
      return { ...state, ...action.payload, isAuthenticated: !!token };
    },
    setIsAuthenticated(state, action: PayloadAction<boolean>) {
      return { ...state, isAuthenticated: action.payload };
    },
    setSellerId(state, action: PayloadAction<string>) {
      return { ...state, sellerId: action.payload };
    },
    setOrganizationId(state, action: PayloadAction<string>) {
      return { ...state, orgId: action.payload };
    },
    setSeller(state, action: PayloadAction<{ id: string; name: string; code: string }>) {
      return {
        ...state,
        sellerId: action.payload.id,
        sellerName: action.payload.name,
        sellerCode: action.payload.code,
        isSellerAuthenticated: true
      };
    },
    sellerLogout(state) {
      return {
        ...state,
        sellerId: '',
        sellerName: '',
        sellerCode: '',
        isSellerAuthenticated: false
      };
    },
    userLogout() {
      return { ...userInitialState, isAuthenticated: false, token: '' };
    }
  }
});

export const {
  setUser,
  userLogout,
  setIsAuthenticated,
  setOrganizationId,
  setSellerId,
  setSeller,
  sellerLogout
} = userSlice.actions;
export default userSlice.reducer;
