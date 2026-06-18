import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedSetting } from '../slices/settingSlice';
import { ISetting } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SettingsSidebar() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settingSlice.settings);
  const selectedSetting = useAppSelector((state) => state.settingSlice.selectedSetting);

  const handleSelectSetting = (setting: ISetting) => {
    dispatch(setSelectedSetting(setting));
  };

  return (
    <aside className="h-screen bg-transparent md:w-30 lg:w-40 xl:w-60 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <ScrollArea className="h-full">
        <ul className="space-y-2">
          {settings.map((setting) => (
            <li key={setting.id}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedSetting?.name === setting.name ? 'bg-accent text-accent-foreground' : ''
                )}
                onClick={() => handleSelectSetting(setting)}>
                <span>{setting.name.charAt(0).toUpperCase() + setting.name.slice(1)}</span>
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
