import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  HelpCircle, 
  Send,
  Sparkles,
  Layout,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Set default expiration to 24 hours from now
  const getDefaultDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toISOString().slice(0, 16);
  };

  const getMinDate = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState(getDefaultDate());
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [questions, setQuestions] = useState([
    { id: Date.now(), text: '', type: 'single', options: ['', ''] }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', type: 'single', options: ['', ''] }]);
  };

  const removeQuestion = (id) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (qId) => {
    setQuestions(questions.map(q => 
      q.id === qId ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const removeOption = (qId, optIdx) => {
    setQuestions(questions.map(q => 
      q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== optIdx) } : q
    ));
  };

  const updateQuestion = (qId, text) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text } : q));
  };

  const updateOption = (qId, optIdx, text) => {
    setQuestions(questions.map(q => 
      q.id === qId ? { ...q, options: q.options.map((opt, i) => i === optIdx ? text : opt) } : q
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error("Please provide a title");
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isAnonymous,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options.map(opt => opt)
        }))
      };

      await api.post('/api/polls', payload);
      toast.success("Poll launched successfully!");
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">
        
        {/* HEADER AREA */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 mb-4">
              <Sparkles className="mr-2 h-3 w-3" />
              Creator Studio
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Create New Poll</h1>
            <p className="text-zinc-500 mt-2">Design your campaign and start collecting real-time insights.</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="border-white/5 text-zinc-400 hover:text-white" onClick={() => navigate('/dashboard')}>
              Discard
            </Button>
            <Button type="submit" className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 px-8 h-12" disabled={loading}>
              {loading ? "Launching..." : "Launch Poll"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
          {/* MAIN CONTENT: QUESTIONS */}
          <div className="space-y-6">
            {/* POLL METADATA CARD */}
            <Card className="glass-card border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Layout className="h-4 w-4 text-cyan-500" />
                  <CardTitle className="text-lg font-bold text-white uppercase tracking-wider text-sm">General Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Poll Title</Label>
                  <Input 
                    placeholder="e.g. Q3 Engineering Retrospective" 
                    className="bg-zinc-900/50 border-white/5 text-white h-12 text-lg focus:border-cyan-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Context / Description</Label>
                  <Textarea 
                    placeholder="Provide some background for your respondents..." 
                    className="bg-zinc-900/50 border-white/5 text-white min-h-[100px] focus:border-cyan-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Questions ({questions.length})</h3>
              </div>
              
              <AnimatePresence>
                {questions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <Card className="glass-card border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-600 text-[10px] font-bold text-white uppercase">Q{idx + 1}</span>
                          <Input 
                            placeholder="Type your question here..." 
                            className="w-[300px] sm:w-[400px] bg-transparent border-none text-white font-bold placeholder:text-zinc-600 focus-visible:ring-0"
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, e.target.value)}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => removeQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CardContent className="p-6 space-y-4">
                        <div className="grid gap-3">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-bold text-zinc-600">
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <Input 
                                placeholder={`Option ${optIdx + 1}`}
                                className="bg-zinc-900/30 border-white/5 text-white h-10 focus:border-cyan-500/50"
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                              />
                              {q.options.length > 2 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-10 w-10 text-zinc-700 hover:text-white"
                                  onClick={() => removeOption(q.id, optIdx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="w-full border-dashed border-white/5 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/5"
                          onClick={() => addOption(q.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-14 border-dashed border-cyan-500/20 bg-cyan-500/[0.02] text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 text-base font-bold"
                onClick={addQuestion}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Another Question
              </Button>
            </div>
          </div>

          {/* SIDEBAR: tip first so it is never covered by settings; no sticky overlap */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.02] p-6">
              <div className="flex items-center gap-2 mb-3 text-cyan-400">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Creator Tip</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Keep your questions concise and your options limited to 4-5 for better engagement and higher completion rates.
              </p>
            </div>

            <Card className="glass-card border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-lg font-bold text-white uppercase tracking-wider text-sm">Campaign Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="space-y-0.5 min-w-0">
                    <Label htmlFor="anonymous-mode" className="text-sm font-medium text-white cursor-pointer">Open voting (no account)</Label>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      When on, anyone with the link can vote without signing in. When off, only signed-in users can respond.
                    </p>
                  </div>
                  <Switch 
                    id="anonymous-mode" 
                    checked={isAnonymous} 
                    onCheckedChange={setIsAnonymous} 
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                  <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Expiration Date</Label>
                  <Input 
                    type="datetime-local" 
                    min={getMinDate()}
                    className="bg-zinc-900/50 border-white/5 text-white h-10"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-[10px] text-zinc-600">Minimum: Today's date and time</p>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                   <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">Questions</span>
                     <span className="text-white font-bold">{questions.length}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">Avg. Time</span>
                     <span className="text-white font-bold">~1.5 min</span>
                   </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold text-white shadow-lg shadow-cyan-900/20 h-11">
                  {loading ? "Launching..." : "Launch Campaign"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;
