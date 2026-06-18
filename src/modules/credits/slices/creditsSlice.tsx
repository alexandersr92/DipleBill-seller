import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getCreditById,
  getCreditClientById,
  getCredits,
  payCredit
} from '../services/creditsThunks';
import {
  ICredit,
  IGetCreditByClientResponse,
  IGetCreditResponse,
  IGetCreditsResponse
} from '../types';
import { initialState } from './initialState';

export const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {
    calculateCreditTotals: (state) => {
      if (state.currentCredit && state.currentCredit.length > 0) {
        const totals = state.currentCredit.reduce(
          (acc, credit) => {
            return {
              totalAmount: acc.totalAmount + credit.amount,
              totalCurrentDebt: acc.totalCurrentDebt + credit.current_debt
            };
          },
          { totalAmount: 0, totalCurrentDebt: 0 }
        );

        state.creditSummary = totals;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCredits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getCredits.fulfilled, (state, action: PayloadAction<IGetCreditsResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.credits = action.payload.data;

        state.pagination = {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10
        };
      })
      .addCase(getCredits.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(getCreditClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(
        getCreditClientById.fulfilled,
        (state, action: PayloadAction<IGetCreditByClientResponse>) => {
          state.isLoading = false;
          state.status = 'fulfilled';

          state.currentCredit = [...action.payload.data];

          if (action.payload.data.length > 0) {
            const totals = action.payload.data.reduce(
              (acc, credit) => {
                return {
                  totalAmount: acc.totalAmount + credit.amount,
                  totalCurrentDebt: acc.totalCurrentDebt + credit.current_debt
                };
              },
              { totalAmount: 0, totalCurrentDebt: 0 }
            );

            state.creditSummary = totals;
          }
        }
      )
      .addCase(getCreditClientById.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(getCreditById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getCreditById.fulfilled, (state, action: PayloadAction<IGetCreditResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.invoice = action.payload.data;
      })
      .addCase(getCreditById.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(payCredit.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(payCredit.fulfilled, (state, action: PayloadAction<ICredit[]>) => {
        state.isLoading = false;
        state.status = 'fulfilled';

        const updatedCredits = action.payload;

        if (state.currentCredit) {
          state.currentCredit = state.currentCredit.map((credit) => {
            const updated = updatedCredits.find((u) => u.id === credit.id);
            return {
              ...credit,
              current_debt: updated ? updated.current_debt : credit.current_debt,
              status: updated ? updated.status : credit.status,
              amount: updated ? updated.amount : credit.amount
            };
          });

          const totals = state.currentCredit.reduce(
            (acc, credit) => {
              return {
                totalAmount: acc.totalAmount + credit.amount,
                totalCurrentDebt: acc.totalCurrentDebt + credit.current_debt
              };
            },
            { totalAmount: 0, totalCurrentDebt: 0 }
          );

          state.creditSummary = totals;
        }
      })
      .addCase(payCredit.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      });
  }
});

export const { calculateCreditTotals } = creditsSlice.actions;

export default creditsSlice.reducer;
