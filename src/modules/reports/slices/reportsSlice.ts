import { createSlice } from '@reduxjs/toolkit';
import { ReportsState } from '../types';
import {
  deleteReport,
  generateReport,
  getReports,
  getReportTypes
} from '../services/reportsThunks';

const initialState: ReportsState = {
  reports: [],
  reportTypes: [],
  isLoading: false,
  isGenerating: false,
  pagination: {
    total: 0,
    perPage: 10,
    currentPage: 1,
    lastPage: 1
  },
  error: null
};

export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getReports.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getReports.fulfilled, (state, action) => {
      state.isLoading = false;
      state.reports = action.payload.data;
      if (action.payload.meta) {
        state.pagination = {
          total: action.payload.meta.total,
          perPage: action.payload.meta.per_page,
          currentPage: action.payload.meta.current_page,
          lastPage: action.payload.meta.last_page
        };
      }
    });
    builder.addCase(getReports.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Error getting reports';
    });

    builder.addCase(getReportTypes.fulfilled, (state, action) => {
      state.reportTypes = action.payload;
    });

    builder.addCase(generateReport.pending, (state) => {
      state.isGenerating = true;
      state.error = null;
    });
    builder.addCase(generateReport.fulfilled, (state) => {
      state.isGenerating = false;
    });
    builder.addCase(generateReport.rejected, (state, action) => {
      state.isGenerating = false;
      state.error = action.error.message || 'Error generating report';
    });

    builder.addCase(deleteReport.fulfilled, (state, action) => {
      state.reports = state.reports.filter((report) => report.id !== action.payload);
    });
  }
});

export default reportsSlice.reducer;
