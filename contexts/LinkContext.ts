
import { createContext } from 'react';
import type { Link } from '../types';

interface LinkContextType {
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
}

export const LinkContext = createContext<LinkContextType>({
    links: [],
    setLinks: () => {},
});
