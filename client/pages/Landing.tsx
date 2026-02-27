import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  Users, 
  Zap, 
  TrendingUp, 
  FileText, 
  Package, 
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Your financial data is protected with enterprise-grade security and encryption.'
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Get powerful insights into your business performance with real-time analytics.'
  },
  {
    icon: Users,
    title: 'Expert Support',
    description: 'Our team of tax professionals is always ready to help you with any queries.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process invoices and generate reports in seconds, not hours.'
  }
];

const benefits = [
  'Automated GST compliance',
  'Real-time tax calculations',
  'Seamless invoice management',
  'Smart expense tracking',
  'Professional reporting',
  '24/7 customer support'
];

export default function Landing() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log('Newsletter signup:', email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <Star className="w-4 h-4" />
                  <span>Trusted by 10,000+ businesses</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
                  Simplify Your{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Tax Journey
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Tax Saathi is your intelligent companion for seamless GST compliance, 
                  automated invoicing, and smart financial management. Focus on your business, 
                  let us handle the taxes.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-2 border-border hover:border-primary hover:text-primary transition-all duration-300 px-8 py-6 text-lg font-semibold">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Money Back Guarantee</span>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 border border-border">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
                
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Tax Saathi Logo" 
                    className="w-24 h-24 mx-auto mb-8"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-card/50 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-foreground">10K+</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Invoices Processed</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-foreground">500+</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Happy Clients</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-foreground">95%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Time Saved</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-foreground">24/7</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Customer Support</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tax management solution designed for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>Upload, track, and manage all your invoices in one place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Get powerful insights into your business performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {benefits.slice(3, 6).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>Never miss a deadline with intelligent notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Automated reminders for filing deadlines, payment due dates, 
                  and important tax events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Stay Updated with Tax Tips
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to our newsletter for the latest tax updates, 
                    tips, and exclusive offers.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                    Subscribe
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}