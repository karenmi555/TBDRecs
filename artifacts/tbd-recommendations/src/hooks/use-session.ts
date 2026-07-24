import { useState, useEffect } from 'react';

export function useSession() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedId = localStorage.getItem('tbd_userId');
      const storedName = localStorage.getItem('tbd_userName');
      if (storedId && storedName) {
        setUser({ id: parseInt(storedId, 10), name: storedName });
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const login = (id: number, name: string) => {
    localStorage.setItem('tbd_userId', id.toString());
    localStorage.setItem('tbd_userName', name);
    setUser({ id, name });
  };

  const logout = () => {
    localStorage.removeItem('tbd_userId');
    localStorage.removeItem('tbd_userName');
    setUser(null);
  };

  return { user, login, logout, isLoaded };
}
