import { useState, useEffect, useCallback } from 'react';
import { IInvoiceDraft } from '../types/draft';
import { draftService, DRAFTS_UPDATED_EVENT } from '../services/draftService';

export const useDrafts = (storeId?: string, enabled: boolean = true) => {
  const [drafts, setDrafts] = useState<IInvoiceDraft[]>(() =>
    enabled ? draftService.getDrafts(storeId) : []
  );

  const refreshDrafts = useCallback(() => {
    if (!enabled) {
      setDrafts([]);
      return;
    }
    setDrafts(draftService.getDrafts(storeId));
  }, [storeId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setDrafts([]);
      return;
    }

    refreshDrafts();

    const handleUpdate = () => {
      refreshDrafts();
    };

    window.addEventListener(DRAFTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(DRAFTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [enabled, refreshDrafts]);

  const saveDraft = useCallback(
    (
      draftData: Omit<IInvoiceDraft, 'id' | 'created_at' | 'updated_at'> & {
        id?: string;
        created_at?: string;
      }
    ) => {
      return draftService.saveDraft(draftData);
    },
    []
  );

  const deleteDraft = useCallback((id: string) => {
    draftService.deleteDraft(id);
  }, []);

  return {
    drafts: enabled ? drafts : [],
    draftsCount: enabled ? drafts.length : 0,
    refreshDrafts,
    saveDraft,
    deleteDraft,
    getDraftById: draftService.getDraftById
  };
};
