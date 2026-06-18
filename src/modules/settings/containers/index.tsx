import SettingsSidebar from '../components/SettingsSidebar';
import Setting from './Setting';

export default function Settings() {
  return (
    <div className="flex flex-1 -m-4">
      <SettingsSidebar />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Setting />
      </div>
    </div>
  );
}
