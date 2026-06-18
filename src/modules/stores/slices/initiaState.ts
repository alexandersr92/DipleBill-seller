import { IStoreState } from './store.types';

const initialState: IStoreState = {
  stores: [],
  store: null,
  isLoading: false,
  error: null
};

export default initialState;
