import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_demo_user: boolean;
  business_name?: string;
  gst_number?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isDemoUser: boolean;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize user from Supabase auth
    const initUser = async () => {
      try {
        // Get authenticated user from Supabase auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser?.email) {
          // Create a user object from auth user data
          // Don't try to query users table due to RLS issues
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            is_demo_user: false,
            business_name: authUser.user_metadata?.business_name,
            gst_number: authUser.user_metadata?.gst_number,
          });
        } else {
          // No authenticated user, try loading demo user
          await loadDemoUser();
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        await loadDemoUser();
      } finally {
        setLoading(false);
      }
    };

    const loadDemoUser = async () => {
      try {
        // Query demo user (should work with anon role)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('is_demo_user', true)
          .single();

        if (!error && data) {
          setUser(data as User);
        } else {
          console.warn('Could not load demo user:', error);
          // Fallback to hardcoded demo user
          setUser({
            id: 'demo-user-id',
            email: 'demo@taxsathi.com',
            full_name: 'Demo User',
            is_demo_user: true,
          });
        }
      } catch (error) {
        console.error('Error loading demo user:', error);
        // Fallback to hardcoded demo user
        setUser({
          id: 'demo-user-id',
          email: 'demo@taxsathi.com',
          full_name: 'Demo User',
          is_demo_user: true,
        });
      }
    };

    initUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, isDemoUser: user?.is_demo_user || false, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
