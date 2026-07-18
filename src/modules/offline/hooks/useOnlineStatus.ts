import { useAppSelector } from '@/store/hooks';

export const useOnlineStatus = () => useAppSelector((state) => state.offlineSlice.isOnline);
