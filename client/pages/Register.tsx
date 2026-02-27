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
import { Loader2, User, Mail, Lock, Building2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  gstin: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      localStorage.setItem('token', 'mock-token');
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to Tax Saathi. Your account has been created.',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'Something went wrong. Please try again.',
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
      
      <Card className="w-full max-w-2xl relative z-10 shadow-2xl border-0 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-accent/20 rounded-full blur-3xl"></div>

        <CardHeader className="space-y-1 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow transform transition-transform hover:scale-110">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Join Tax Saathi
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Create your account to start managing your taxes effortlessly
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...register('name')}
                    className="pl-10 pr-4 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-3 h-3 bg-destructive rounded-full"></span>
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                    type="email"
                    placeholder="your@email.com"
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
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-foreground">
                  Business Name
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <Input
                    id="businessName"
                    placeholder="Your business name"
                    {...register('businessName')}
                    className="pl-10 pr-4 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-3 h-3 bg-destructive rounded-full"></span>
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin" className="text-sm font-medium text-foreground">
                  GSTIN (Optional)
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <Input
                    id="gstin"
                    placeholder="GSTIN number"
                    {...register('gstin')}
                    className="pl-10 pr-4 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional: Add your GSTIN for automatic tax calculations</p>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
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
                <div className="text-xs text-muted-foreground">
                  Password must be at least 8 characters
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-3 h-3 bg-destructive rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className="pl-10 pr-12 py-3 bg-card border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-3 h-3 bg-destructive rounded-full"></span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-4 h-4 text-primary bg-card border-2 border-border rounded focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer hover:border-primary mt-0.5"
                  required
                />
                <label htmlFor="terms" className="text-sm text-foreground font-medium cursor-pointer hover:text-primary transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary via-accent to-primary/90 hover:from-primary/90 hover:via-accent/90 hover:to-primary text-white font-semibold py-4 px-6 text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-lg group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors duration-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Features list */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground font-medium">Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground font-medium">GST Compliant</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground font-medium">24/7 Support</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}