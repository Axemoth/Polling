import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, BarChart, Users, Clock, ArrowRight, Trash2, Grid, Calendar, Share2, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from "sonner";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await api.get('/api/polls/mine');
      setPolls(res.data);
    } catch (err) {
      console.error("Failed to fetch polls", err);
      toast.error("Could not load your polls");
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async (id) => {
    if (!confirm("Are you sure you want to delete this poll? All responses will be lost.")) return;
    try {
      await api.delete(`/api/polls/${id}`);
      setPolls(polls.filter(p => p.id !== id));
      toast.success("Poll permanently removed");
    } catch (err) {
      toast.error("Failed to delete poll");
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/vote/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* HEADER SECTION */}
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Grid className="h-8 w-8 text-cyan-500" />
            Control Center
          </h1>
          <p className="text-zinc-500 mt-1">Monitor and manage your interactive polls in real-time.</p>
        </div>
        <Link to="/create">
          <Button className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 px-6 h-12 text-base font-bold">
            <Plus className="mr-2 h-5 w-5" />
            New Campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[240px] w-full animate-pulse rounded-2xl bg-zinc-900 border border-zinc-800" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed border-zinc-800 bg-transparent py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-600/10 text-cyan-500 ring-1 ring-cyan-500/20">
            <BarChart className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">The stage is empty</CardTitle>
          <CardDescription className="text-zinc-500 mb-8 max-w-xs">You haven't launched any polls yet. Ready to start collecting insights?</CardDescription>
          <Link to="/create">
            <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 px-8 h-12">
              Launch your first poll
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll, index) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card group flex flex-col h-full border-zinc-800 hover:border-cyan-500/50 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={poll.isActive ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" : "bg-zinc-800 text-zinc-500"}>
                      {poll.isActive ? "Active Now" : "Closed"}
                    </Badge>
                    <Badge variant="outline" className="border-white/5 bg-white/[0.02] text-zinc-500 text-[9px] uppercase tracking-tighter">
                      {poll.isAnonymous ? "Anonymous" : "Verified Only"}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      <Calendar className="h-3 w-3" />
                      {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1 text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {poll.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-zinc-500 text-sm mt-1">
                    {poll.description || "No additional description provided for this campaign."}
                  </CardDescription>
                </CardHeader>
                
                <div className="flex-grow" />

                <CardFooter className="flex flex-col gap-4 border-t border-zinc-800/50 p-6 mt-4">
                  <div className="flex w-full items-center justify-between text-xs font-medium text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Track results in real-time
                    </div>
                  </div>
                  <div className="flex w-full gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 shrink-0 text-zinc-600 hover:text-red-500 hover:bg-red-500/10" 
                      onClick={() => deletePoll(poll.id)}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 shrink-0 text-zinc-600 hover:text-cyan-400 hover:bg-cyan-500/10" 
                        >
                          <Share2 className="h-4.5 w-4.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-white">Share Poll</DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Anyone with this link or QR code can vote.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-6 gap-6">
                          <div className="bg-white p-4 rounded-xl">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/vote/${poll.publicSlug}`)}`}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="flex w-full items-center space-x-2">
                            <div className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-sm truncate">
                              {`${window.location.origin}/vote/${poll.publicSlug}`}
                            </div>
                            <Button onClick={() => copyLink(poll.publicSlug)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Link to={`/analytics/${poll.id}`} className="flex-1">
                      <Button className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold h-10 gap-2 group/btn">
                        View Analytics
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
