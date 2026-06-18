import { useAppSelector } from '../../../store/hooks';
import BillingSettings from '../components/BillingSettings';
import StoreSettings from '../components/StoreSettings';
import UserSettings from '../components/UserSettings';
import SellerSettings from '../components/SellerSettings';

export default function Setting() {
  const setting = useAppSelector((state) => state.settingSlice.selectedSetting);

  return (
    <div>
      {setting?.name === 'Tienda' && <StoreSettings />}
      {setting?.name === 'Usuarios' && <UserSettings />}
      {setting?.name === 'Facturacion' && <BillingSettings />}
      {setting?.name === 'Vendedores' && <SellerSettings />}
    </div>
  );
}
