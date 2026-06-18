export interface IInitialState {
  selectedSetting: ISetting | null;
  settings: ISetting[];
  isLoading: boolean;
  error: string | null;
}

export interface ISetting {
  id: string;
  name: string;
  description: string;
}
