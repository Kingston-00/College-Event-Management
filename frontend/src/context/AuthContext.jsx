import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { TOKEN_KEY } from '../api/axios';
import { decodeJwt, storage } from '../utils/helpers';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(storage.get(TOKEN_KEY)));
  const [expired, setExpired] = useState(false);
  const timer = useRef();

  const logout = useCallback((reason) => {
    storage.remove(TOKEN_KEY);
    clearTimeout(timer.current);
    setUser(null);
    setExpired(reason === 'expired');
  }, []);

  // Schedule an automatic logout at the token's expiry time.
  const scheduleExpiry = useCallback(
    (token) => {
      clearTimeout(timer.current);
      const exp = decodeJwt(token)?.exp;
      if (!exp) return;
      const ms = exp * 1000 - Date.now();
      if (ms <= 0) return logout('expired');
      // setTimeout caps at ~24.8 days; clamp so long-lived tokens don't fire instantly.
      timer.current = setTimeout(() => logout('expired'), Math.min(ms, 2 ** 31 - 1));
    },
    [logout]
  );

  // Restore session on page load.
  useEffect(() => {
    const token = storage.get(TOKEN_KEY);
    if (!token) return;
    scheduleExpiry(token);
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => storage.remove(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, [scheduleExpiry]);

  // The Axios interceptor fires this when the API rejects our token.
  useEffect(() => {
    const onUnauthorized = () => logout('expired');
    window.addEventListener('cems:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cems:unauthorized', onUnauthorized);
  }, [logout]);

  const authenticate = useCallback(
    (data) => {
      storage.set(TOKEN_KEY, data.token);
      scheduleExpiry(data.token);
      setExpired(false);
      setUser(data.user);
      return data.user;
    },
    [scheduleExpiry]
  );

  const login = useCallback(async (email, password) => authenticate((await api.post('/auth/login', { email, password })).data), [authenticate]);
  const register = useCallback(async (form) => authenticate((await api.post('/auth/register', form)).data), [authenticate]);

  const value = useMemo(
    () => ({
      user, loading, expired, login, register,
      logout: () => logout(),
      clearExpired: () => setExpired(false),
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, expired, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
