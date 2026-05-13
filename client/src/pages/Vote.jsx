import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  User as UserIcon,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const Vote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      const res = await api.get(`/api/polls/${id}`);
      setPoll(res.data);
    } catch (err) {
      toast.error("Poll not found or expired");
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = (questionId, optionId) => {
    setSelections(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // Validate that all questions are answered
    const unanswered = poll.questions.filter(q => selections[q.id] === undefined);
    if (unanswered.length > 0) {
      return toast.error(`Please answer all ${unanswered.length} more questions!`);
    }

    setSubmitting(true);
    try {
      const answers = Object.entries(selections).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      await api.post('/api/responses', { pollId: poll.id, answers });
      setVoted(true);
      toast.success("Response submitted! Thank you.");
    } catch (err) {
      if (err.response?.status === 401) {
        const next = encodeURIComponent(`${location.pathname}${location.search || ''}`);
        toast.error("Please sign in to vote on this poll.");
        navigate(`/auth?next=${next}`);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#060608]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );

  if (!poll) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060608] px-4 text-center">
      <h1 className="text-4xl font-black text-white mb-4">404</h1>
      <p className="text-zinc-500 mb-8">This campaign is no longer active or doesn't exist.</p>
      <Button onClick={() => navigate('/')} variant="outline" className="border-zinc-800 text-zinc-400">Return Home</Button>
    </div>
  );

  // Verified-only polls require a signed-in respondent; anonymous polls accept anyone.
  if (!poll.isAnonymous) {
    if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#060608]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      );
    }
    if (!user) {
      const next = encodeURIComponent(`${location.pathname}${location.search || ''}`);
      return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060608] px-4 py-12">
          <Card className="glass-card w-full max-w-md border-white/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-black text-white">Sign in to vote</CardTitle>
              <CardDescription className="text-zinc-500">
                This campaign is limited to verified accounts. Sign in (or create an account) to submit your response.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                className="h-12 bg-cyan-600 font-bold text-white hover:bg-cyan-700"
                onClick={() => navigate(`/auth?next=${next}`)}
              >
                Go to sign in
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => navigate('/')}>
                Back to home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (voted) return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060608] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] text-center"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white mb-4">Response Captured.</h1>
        <p className="text-zinc-500 mb-10 leading-relaxed">
          Your feedback has been securely transmitted to the campaign creator.
          Thank you for making your voice heard on Voxly.
        </p>
        <Button 
          onClick={() => navigate('/')} 
          className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 font-bold shadow-lg shadow-cyan-600/20"
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060608] pb-20 pt-12">
      <div className="mx-auto max-w-[680px] px-4 sm:px-6">
        
        {/* POLL HEADER */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-6">
            <Zap className="h-3 w-3" />
            Live Campaign
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-4 sm:text-5xl">
            {poll.title}
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
            {poll.description || "The creator didn't provide a description, but your feedback is still valuable!"}
          </p>

          <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <div className="flex items-center gap-1.5">
              <UserIcon className="h-3 w-3" />
              {poll.isAnonymous ? "No sign-in required" : "Verified accounts only"}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {poll.expiresAt ? "Expiring Soon" : "Open Ended"}
            </div>
            <div className="flex items-center gap-1.5 text-cyan-500">
              <ShieldCheck className="h-3 w-3" />
              Secure
            </div>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-10">
          {poll.questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="mb-6 flex items-center gap-4">
                 <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-xs font-black text-white">
                   {idx + 1}
                 </span>
                 <h3 className="text-xl font-bold text-white tracking-tight">{q.text}</h3>
              </div>

              <div className="grid gap-3">
                {q.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelection(q.id, option.id)}
                    className={`relative flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
                      selections[q.id] === option.id 
                        ? 'border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/30' 
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        selections[q.id] === option.id 
                          ? 'border-cyan-500 bg-cyan-500 text-white scale-110' 
                          : 'border-zinc-800 bg-transparent'
                      }`}>
                        {selections[q.id] === option.id && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <span className={`font-medium transition-colors ${selections[q.id] === option.id ? 'text-white' : 'text-zinc-400'}`}>
                        {option.text}
                      </span>
                    </div>
                    
                    {selections[q.id] === option.id && (
                      <motion.div 
                        layoutId={`sparkle-${q.id}`}
                        className="absolute right-[-20px] top-[-20px] h-20 w-20 bg-cyan-600/10 blur-xl pointer-events-none" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 h-14 text-lg font-black shadow-xl shadow-cyan-600/30 gap-3 group"
          >
            {submitting ? "Transmitting..." : "Submit Response"}
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Responses are permanently encrypted and irreversible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vote;
