import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const getSafeNextPath = () => {
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return '/';
  };

  // Redirect if already logged in (only on mount)
  useEffect(() => {
    if (user) window.location.href = getSafeNextPath();
  }, []); // Only run once on mount

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/auth/local/login' : '/auth/local/signup';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await api.post(endpoint, payload);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      // Force a full page reload to ensure the session cookie is correctly 
      // picked up by the browser before the dashboard loads.
      setTimeout(() => {
        window.location.href = getSafeNextPath();
      }, 500);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Email already in use. Please sign in instead!");
      } else {
        toast.error(err.response?.data?.error || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-20">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-zinc-600/10 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-[420px]"
      >
        <div className="mb-8 text-center">
           <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
             <Sparkles className="h-3 w-3" />
             Voxly Platform
           </div>
           <h1 className="text-3xl font-black tracking-tighter text-white sm:text-4xl">
             {isLogin ? "Welcome back." : "Join Voxly."}
           </h1>
           <p className="mt-2 text-sm text-zinc-500">
             {isLogin ? "Sign in to manage your interactive polls." : "Start collecting real-time feedback today."}
           </p>
        </div>

        <Card className="glass-card border-white/5 overflow-hidden">
          <div className="flex border-b border-white/5 bg-white/[0.02] p-1">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Join Now
            </button>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                      <Input 
                        placeholder="Alex Johnson" 
                        className="bg-zinc-900/50 border-white/5 pl-10 text-white h-11 focus:border-cyan-500/50"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                  <Input 
                    type="email" 
                    placeholder="you@company.com" 
                    className="bg-zinc-900/50 border-white/5 pl-10 text-white h-11 focus:border-cyan-500/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                  {isLogin && <button type="button" className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300">Forgot?</button>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-zinc-900/50 border-white/5 pl-10 text-white h-11 focus:border-cyan-500/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-cyan-600 hover:bg-cyan-700 h-11 font-bold text-white shadow-lg shadow-cyan-600/20"
                disabled={loading}
              >
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-[#060608] px-4 text-zinc-600">Or continue with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white font-bold gap-3"
              onClick={handleGoogleLogin}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Account
            </Button>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-xs text-zinc-600 leading-relaxed">
          By continuing, you agree to our <span className="text-zinc-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-zinc-400 hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
