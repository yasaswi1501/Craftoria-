import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// Set once the `profiles` table is confirmed missing/unreachable (migrations
// not applied, PostgREST schema cache stale, etc.) so we stop issuing more
// GET/PATCH requests against it for the rest of this page session instead of
// re-attempting -- and re-logging the same failure -- on every auth event.
let profilesTableUnavailable = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSession = async (session) => {
    if (session?.user) {
      // Role is authorization state, not identity -- it must come from the
      // profiles row (DB-enforced, RLS-protected), never from user_metadata
      // or a JWT claim the client could otherwise influence. Every table
      // that cares about role re-checks it server-side via RLS regardless;
      // this is only used for UI decisions (e.g. showing admin nav later).
      let role = 'customer';
      if (!profilesTableUnavailable) {
        // maybeSingle (not single): zero rows is an expected, valid outcome
        // for a signed-in user whose profile row hasn't been created yet --
        // that's not an error, it just means "customer" stays the role.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          // PGRST205 = table not in PostgREST's schema cache (migrations
          // never applied, or need a schema reload). Any other error here
          // is also non-fatal for the UI -- fail safe to 'customer' -- but
          // only PGRST205 is treated as "stop asking for the rest of this
          // session," since other errors could be transient.
          if (error.code === 'PGRST205') profilesTableUnavailable = true;
          console.error('Could not load profile role:', error.message);
        } else if (profile?.role) {
          role = profile.role;
        }
      }

      const loggedUser = {
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Customer',
        email: session.user.email,
        phone: session.user.phone || session.user.user_metadata?.phone || '',
        picture: session.user.user_metadata?.avatar_url || null,
        id: session.user.id,
        role,
        emailConfirmed: !!session.user.email_confirmed_at,
      };
      setUser(loggedUser);
      setIsLoggedIn(true);
      // Keep localStorage synchronized for other parts of legacy state (if any)
      localStorage.setItem('craftoria_user', JSON.stringify(loggedUser));
      localStorage.setItem('craftoria_logged_in', 'true');
    } else {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('craftoria_user');
      localStorage.setItem('craftoria_logged_in', 'false');
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session).finally(() => setLoading(false));
    }).catch((err) => {
      console.error('Error fetching Supabase session:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Flag that this session came from a real recovery-email link, not
      // just "some session happens to be active in this browser" --
      // ResetPassword.jsx gates the password form on this. Registered here
      // (mounted app-wide, early) rather than in ResetPassword itself
      // because the event can fire before that route's component mounts.
      if (_event === 'PASSWORD_RECOVERY') {
        try { sessionStorage.setItem('craftoria_password_recovery', '1'); } catch (err) {}
      }
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protected-action redirect flow: save what the user was trying to do,
  // send them to login, and resume it after a successful sign-in. Persisted
  // to localStorage (not just React state) because Google OAuth does a full
  // page redirect away and back, which would otherwise lose in-memory state.
  const REDIRECT_STORAGE_KEY = 'craftoria_post_login_redirect';

  const requireAuth = (intendedPath) => {
    if (isLoggedIn) return true;
    try {
      localStorage.setItem(REDIRECT_STORAGE_KEY, intendedPath);
    } catch (err) {
      // localStorage unavailable (private browsing etc.) -- login still
      // works, the user just lands on the homepage afterward instead.
    }
    setIsAuthModalOpen(true);
    return false;
  };

  const consumePostLoginRedirect = () => {
    try {
      const path = localStorage.getItem(REDIRECT_STORAGE_KEY);
      if (path) localStorage.removeItem(REDIRECT_STORAGE_KEY);
      return path;
    } catch (err) {
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: 'An unexpected error occurred during login.' };
    }
  };

  const signup = async (name, email, phone, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      // Check if email confirmation is required (session might be null initially if confirm is on)
      if (data.user && !data.session) {
        return { 
          success: true, 
          needsConfirmation: true,
          message: 'Please check your email inbox to confirm your account creation.' 
        };
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: 'An unexpected error occurred during registration.' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Could not connect to Google OAuth.' };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'A password reset link has been sent to your email.' };
    } catch (err) {
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const updateUserProfile = async ({ name, phone, picture }) => {
    try {
      const updatedUser = {
        ...user,
        name: name !== undefined ? name : user?.name,
        phone: phone !== undefined ? phone : user?.phone,
        picture: picture !== undefined ? picture : user?.picture,
      };
      setUser(updatedUser);
      localStorage.setItem('craftoria_user', JSON.stringify(updatedUser));

      // Attempt background update with Supabase
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: name,
            phone: phone,
          }
        });
        // Skip the profiles PATCH entirely once we know that table is
        // unreachable -- auth.updateUser() above already persisted the
        // name/phone on the auth user, so there's nothing lost by not
        // retrying a write that's guaranteed to fail.
        if (user?.id && !profilesTableUnavailable) {
          const { error } = await supabase.from('profiles').update({
            full_name: name,
            phone: phone,
          }).eq('id', user.id);
          if (error?.code === 'PGRST205') profilesTableUnavailable = true;
        }
      } catch (e) {
        console.warn('Background profile update notice:', e);
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, message: 'Failed to update profile.' };
    }
  };

  // UI-only convenience -- never the actual authorization boundary. Every
  // sensitive table/RPC re-checks role itself via RLS regardless of what
  // this returns, so a stale or spoofed client value can't grant real access.
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isStaff = isAdmin || user?.role === 'support' || user?.role === 'inventory_manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        signup,
        loginWithGoogle,
        logout,
        forgotPassword,
        updateUserProfile,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        requireAuth,
        consumePostLoginRedirect,
        isAdmin,
        isStaff
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
