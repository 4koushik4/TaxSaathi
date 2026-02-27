import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (authData?.user) {
        // fetch user details from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!userError && userData) {
          setUser(userData as any);
        }

        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error?.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>

        <CardHeader className="space-y-1 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow transform transition-transform hover:scale-110">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tax Saathi
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Secure tax management platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  {...register('email')}
                  className="pl-10 pr-4 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-3 h-3 bg-destructive rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="pl-10 pr-12 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-3 h-3 bg-destructive rounded-full"></span>
                  {errors.password.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-primary bg-card border-2 border-border rounded focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer hover:border-primary"
                />
                <label htmlFor="remember" className="text-sm text-foreground font-medium cursor-pointer hover:text-primary transition-colors">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary via-accent to-primary/90 hover:from-primary/90 hover:via-accent/90 hover:to-primary text-white font-semibold py-4 px-6 text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-lg group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary hover:text-primary/80 transition-colors duration-300 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card/50 border border-border rounded-lg p-3">
            <Shield className="w-3 h-3 text-primary" />
            <span>Secure & Encrypted</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}