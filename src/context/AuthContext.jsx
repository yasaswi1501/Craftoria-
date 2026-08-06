import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSession = (session) => {
    if (session?.user) {
      const loggedUser = {
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Customer',
        email: session.user.email,
        phone: session.user.phone || session.user.user_metadata?.phone || '',
        picture: session.user.user_metadata?.avatar_url || null,
        id: session.user.id,
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
      handleSession(session);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching Supabase session:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
