import { useState } from "react";
import { Link } from "react-router-dom";
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
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const [email, setEmail] = useState("");

  const features = [
    { icon: Shield, title: "Secure & Reliable" },
    { icon: BarChart3, title: "Smart Analytics" },
    { icon: Users, title: "Expert Support" },
    { icon: Zap, title: "Lightning Fast" },
  ];

  const stats = [
    { icon: FileText, value: "10K+", label: "Invoices" },
    { icon: Package, value: "500+", label: "Clients" },
    { icon: TrendingUp, value: "95%", label: "Time Saved" },
    { icon: MessageCircle, value: "24/7", label: "Support" },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Neon Glow Background */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-600/30 blur-[140px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/30 blur-[140px] rounded-full"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="relative container mx-auto px-6 py-24">

        {/* HERO */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}
          <div className="space-y-8">

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm">
              <Star className="w-4 h-4 text-purple-400" />
              Trusted by 10,000+ businesses
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Simplify Your{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                Tax Journey
              </span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              Intelligent GST compliance, automated invoicing, real-time analytics
              and AI-powered financial insights — built for modern businesses.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button className="relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.8)]">
                  <span className="flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </span>
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  variant="outline"
                  className="px-8 py-6 border border-white/20 bg-white/5 backdrop-blur-lg hover:border-purple-500 hover:text-purple-400 transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                100% Secure
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                24/7 Support
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Money Back Guarantee
              </div>
            </div>

          </div>

          {/* RIGHT - Glass Stats */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={i}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-400 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                >
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-4">
                      <Icon className="w-6 h-6 text-cyan-400" />
                      <span className="text-2xl font-bold">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FEATURES SECTION */}
        <div className="mt-32 text-center space-y-12">

          <h2 className="text-4xl font-bold">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={i}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:-translate-y-3"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="mt-32">
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-purple-400 transition-all duration-500 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
            <CardContent className="p-12 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">
                  Stay Updated with Tax Tips
                </h3>
                <p className="text-gray-400">
                  Subscribe for latest GST updates, compliance alerts
                  and AI-driven business insights.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Subscribed:", email);
                }}
                className="flex gap-4"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20"
                  required
                />
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:shadow-[0_0_25px_rgba(124,58,237,0.8)] transition-all duration-300">
                  Subscribe
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}