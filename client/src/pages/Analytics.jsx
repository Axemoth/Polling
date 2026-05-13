import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  ArrowLeft, 
  Users, 
  Clock, 
  Share2, 
  Download,
  MessageSquare,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { BarChart, PieChart } from "@/components/evilcharts/charts";

const Analytics = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [pollRes, analyticsRes] = await Promise.all([
        api.get(`/api/polls/details/${id}`),
        api.get(`/api/analytics/${id}`)
      ]);
      setPoll(pollRes.data);
      setData(analyticsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#060608]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
    </div>
  );

  if (!poll || !data) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#060608] text-[#eeedf5]">
      <h2 className="text-2xl font-bold">Analytics not available</h2>
      <Link to="/" className="mt-4 text-indigo-400 hover:underline">Return to Dashboard</Link>
    </div>
  );

  // EvilCharts expects one numeric series key and theme `colors` on chartConfig (see ChartContainer validation).
  const getChartProps = (question) => {
    const chartData = question.options.map((opt) => {
      const countObj = data.optionCounts.find((oc) => oc.optionId === opt.id);
      return {
        label: opt.text,
        votes: countObj ? countObj.count : 0,
      };
    });

    const chartConfig = {
      votes: {
        label: "Votes",
        colors: {
          light: ["#818cf8"],
          dark: ["#818cf8"],
        },
      },
    };

    return { chartData, chartConfig };
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{poll.title}</h1>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Live Results</Badge>
              </div>
              <p className="text-xs text-zinc-500">Poll ID: {id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:flex border-white/5 text-zinc-400 hover:text-white">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button className="bg-indigo-600 font-bold text-white hover:bg-indigo-700">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* STATS OVERVIEW */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            label="Total Responses" 
            value={data.totalResponses} 
            icon={<Users className="h-5 w-5 text-indigo-400" />} 
            color="text-indigo-400"
          />
          <StatsCard 
            label="Completion Rate" 
            value="94%" 
            icon={<Activity className="h-5 w-5 text-emerald-400" />} 
            color="text-emerald-400"
          />
          <StatsCard 
            label="Avg. Time to Vote" 
            value="42s" 
            icon={<Clock className="h-5 w-5 text-amber-400" />} 
            color="text-amber-400"
          />
          <StatsCard 
            label="Engagement" 
            value="High" 
            icon={<BarChartIcon className="h-5 w-5 text-purple-400" />} 
            color="text-purple-400"
          />
        </div>

        {/* RESULTS BY QUESTION */}
        <div className="mt-12 space-y-12">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <PieIcon className="h-6 w-6 text-indigo-500" />
            Detailed Breakdown
          </h2>

          <div className="grid gap-8">
            {poll.questions.map((q, idx) => {
              const { chartData, chartConfig } = getChartProps(q);
              return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="glass-card border-white/5 overflow-hidden">
                  <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-bold text-white uppercase">Q{idx + 1}</span>
                          <CardTitle className="text-xl font-bold text-white">{q.text}</CardTitle>
                        </div>
                        <CardDescription className="text-zinc-500">
                          {q.isMandatory ? "Required Response" : "Optional Response"} • 
                          {data.optionCounts.filter(oc => oc.questionId === q.id).reduce((a, b) => a + b.count, 0)} Total Votes
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid gap-12 lg:grid-cols-2">
                      {/* CHART */}
                      <div className="h-[300px] w-full flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/5 p-4">
                        <BarChart 
                          data={chartData} 
                          chartConfig={chartConfig}
                          xDataKey="label"
                          yDataKey="votes"
                          hideLegend
                        />
                      </div>

                      {/* DATA TABLE */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Vote Distribution</h4>
                        {q.options.map(opt => {
                          const countObj = data.optionCounts.find(oc => oc.optionId === opt.id);
                          const count = countObj ? countObj.count : 0;
                          const percent = data.totalResponses > 0 ? Math.round((count / data.totalResponses) * 100) : 0;
                          
                          return (
                            <div key={opt.id} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300 font-medium">{opt.text}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-500">{count} votes</span>
                                  <span className="text-white font-bold">{percent}%</span>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className="h-full bg-indigo-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
            })}
          </div>
        </div>

        {/* RECENT FEEDBACK (Text Results) */}
        {data.textResults?.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
              <MessageSquare className="h-6 w-6 text-purple-500" />
              Direct Feedback
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.textResults.map((res, i) => (
                <Card key={i} className="glass-card border-white/5 p-6 italic text-zinc-400 text-sm leading-relaxed">
                  "{res.text}"
                  <div className="mt-4 text-[10px] not-italic font-bold text-zinc-600 uppercase tracking-widest">
                    {new Date(res.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, icon, color }) => (
  <Card className="glass-card border-white/5 py-8 text-center group hover:border-white/10 transition-colors">
    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110">
      {icon}
    </div>
    <div className={`text-4xl font-black tracking-tighter ${color} mb-1`}>{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
  </Card>
);

export default Analytics;
