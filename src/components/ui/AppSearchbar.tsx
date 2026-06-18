import { Search } from 'lucide-react';
import { Input } from './input';
import { ChangeEvent } from 'react';

interface ISearchBarProps {
  term: string;
  setTerm: (args: string) => void;
  callback?: () => void;
  placeholder: string;
}

const AppSearchBar = ({ setTerm, term, placeholder, callback }: ISearchBarProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  return (
    <div className="w-full relative flex items-center">
      <Search className="text-primary absolute left-2 w-5 h-5" />
      <Input
        onFocus={callback}
        value={term}
        onChange={(e) => handleChange(e)}
        className="pl-8 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={placeholder}
      />
    </div>
  );
};

export default AppSearchBar;
