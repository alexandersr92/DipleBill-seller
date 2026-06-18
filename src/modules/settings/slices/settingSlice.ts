import { createSlice } from '@reduxjs/toolkit';
import initialState from './initialState';
import { ISetting } from '../types';

export const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSelectedSetting: (state, action: { payload: ISetting }) => {
      state.selectedSetting = action.payload;
    }
  }
  // extraReducers: (builder) => {
  //   builder;
  // }
});

export const { setSelectedSetting } = settingSlice.actions;
export default settingSlice.reducer;
