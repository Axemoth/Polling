import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  ArrowLeft, 
  Users, 
  Share2, 
  MessageSquare,
  Layers,
  ListChecks,
  Copy
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { BarChart, PieChart } from "@/components/evilcharts/charts";

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** Per-sector gradients for pie (cyan / teal / sky — no purple) */
const PIE_SECTOR_PALETTES = [
  { light: ["#22d3ee", "#0e7490"], dark: ["#22d3ee", "#0891b2"] },
  { light: ["#2dd4bf", "#0f766e"], dark: ["#2dd4bf", "#14b8a6"] },
  { light: ["#38bdf8", "#0369a1"], dark: ["#38bdf8", "#0284c7"] },
  { light: ["#5eead4", "#115e59"], dark: ["#5eead4", "#0d9488"] },
  { light: ["#a5f3fc", "#155e75"], dark: ["#a5f3fc", "#0e7490"] },
  { light: ["#94a3b8", "#334155"], dark: ["#94a3b8", "#475569"] },
];

const Analytics = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);

  const fetchData = useCallback(async () => {
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
  }, [id]);

  const refetchAnalytics = useCallback(async () => {
    try {
      const { data: next } = await api.get(`/api/analytics/${id}`);
      setData(next);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!id) return;
    const socket = io(API_ORIGIN, { withCredentials: true, transports: ['websocket', 'polling'] });
    socket.emit('join_poll', id);
    socket.on('connect', () => setLiveConnected(true));
    socket.on('disconnect', () => setLiveConnected(false));
    const onNewVote = (payload) => {
      if (payload?.pollId === id) void refetchAnalytics();
    };
    socket.on('new_vote', onNewVote);
    return () => {
      socket.emit('leave_poll', id);
      socket.off('new_vote', onNewVote);
      socket.disconnect();
      setLiveConnected(false);
    };
  }, [id, refetchAnalytics]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#060608]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
    </div>
  );

  if (!poll || !data) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#060608] text-[#eeedf5]">
      <h2 className="text-2xl font-bold">Analytics not available</h2>
      <Link to="/dashboard" className="mt-4 text-cyan-400 hover:text-cyan-300 hover:underline">Return to Dashboard</Link>
    </div>
  );

  const participation = data.participation ?? {};
  const questionCount =
    typeof participation.questionCount === "number"
      ? participation.questionCount
      : poll.questions.length;
  const totalAnswerSelections =
    typeof participation.totalAnswerSelections === "number"
      ? participation.totalAnswerSelections
      : data.optionCounts.reduce((sum, row) => sum + row.count, 0);
  const expectedAnswersIfFull =
    typeof participation.expectedAnswersIfFull === "number"
      ? participation.expectedAnswersIfFull
      : data.totalResponses * questionCount;
  const allQuestionsMatchResponses = Boolean(participation.allQuestionsMatchResponses);

  const answerTotalsByQuestionMap = {};
  (participation.answerTotalsByQuestion ?? []).forEach(({ questionId, answerCount }) => {
    answerTotalsByQuestionMap[questionId] = answerCount;
  });
  for (const q of poll.questions) {
    if (answerTotalsByQuestionMap[q.id] === undefined) answerTotalsByQuestionMap[q.id] = 0;
  }

  const voteTotalsPerQuestion = poll.questions.map((q) => answerTotalsByQuestionMap[q.id] ?? 0);
  const minQuestionAnswers = voteTotalsPerQuestion.length ? Math.min(...voteTotalsPerQuestion) : 0;
  const maxQuestionAnswers = voteTotalsPerQuestion.length ? Math.max(...voteTotalsPerQuestion) : 0;

  const leadingForQuestion = (question) => {
    let best = { text: "—", count: 0 };
    for (const opt of question.options) {
      const row = data.optionCounts.find((oc) => oc.optionId === opt.id);
      const c = row ? row.count : 0;
      if (c > best.count) best = { text: opt.text, count: c };
    }
    const qt = answerTotalsByQuestionMap[question.id] ?? 0;
    const pct = qt > 0 ? Math.round((best.count / qt) * 100) : 0;
    return { ...best, questionTotal: qt, pct };
  };
  const buildBarChartProps = (question) => {
    const chartData = question.options.map((opt) => {
      const countObj = data.optionCounts.find((oc) => oc.optionId === opt.id);
      return { label: opt.text, votes: countObj ? countObj.count : 0 };
    });
    const chartConfig = {
      votes: {
        label: "Votes",
        colors: {
          light: ["#22d3ee", "#0891b2"],
          dark: ["#22d3ee", "#06b6d4"],
        },
      },
    };
    return { chartData, chartConfig };
  };

  const buildPieChartPayload = (question) => {
    const chartConfig = {};
    const pieData = question.options.map((opt, i) => {
      const countObj = data.optionCounts.find((oc) => oc.optionId === opt.id);
      const votes = countObj ? countObj.count : 0;
      const segmentKey = opt.id;
      chartConfig[segmentKey] = {
        label: opt.text,
        colors: PIE_SECTOR_PALETTES[i % PIE_SECTOR_PALETTES.length],
      };
      return { segmentKey, label: opt.text, votes };
    });
    return { pieData, pieChartConfig: chartConfig };
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{poll.title}</h1>
                <Badge
                  className={
                    liveConnected
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 gap-2 pr-2.5'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  }
                >
                  {liveConnected && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                    </span>
                  )}
                  {liveConnected ? 'Live broadcast' : 'Connecting…'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">
                {[
                  poll.createdAt &&
                    `Created ${new Date(poll.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
                  poll.expiresAt &&
                    `Ends ${new Date(poll.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Poll analytics"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="border-white/5 text-zinc-400 hover:text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Poll
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
                    <Button onClick={() => {
                      const url = `${window.location.origin}/vote/${poll.publicSlug}`;
                      void navigator.clipboard.writeText(url).then(
                        () => toast.success('Public vote link copied'),
                        () => toast.error('Could not copy link')
                      );
                    }} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Core metrics — all derived from real response data */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Total responses"
            value={data.totalResponses}
            hint="Unique submissions to this poll"
            icon={<Users className="h-5 w-5 text-cyan-400" />}
            color="text-cyan-400"
          />
          <StatsCard
            label="Questions"
            value={questionCount}
            hint="Items on this survey"
            icon={<Layers className="h-5 w-5 text-sky-400" />}
            color="text-sky-400"
          />
          <StatsCard
            label="Answer rows recorded"
            value={totalAnswerSelections}
            hint={
              expectedAnswersIfFull > 0
                ? `Expected if every question answered once per response: ${expectedAnswersIfFull}`
                : "Selections stored across all questions"
            }
            icon={<ListChecks className="h-5 w-5 text-emerald-400" />}
            color="text-emerald-400"
          />
        </div>

        {/* Participation insights */}
        <Card className="glass-card mt-8 border-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-white">Participation</CardTitle>
            <CardDescription className="text-zinc-500">
              How complete and balanced responses are across your questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-sm text-zinc-300">
            {data.totalResponses === 0 ? (
              <p className="leading-relaxed text-zinc-400">
                No responses yet. Use <span className="text-zinc-200">Copy vote link</span> above to share the poll; counts and charts will fill in as people submit.
              </p>
            ) : (
              <>
                <ul className="list-inside list-disc space-y-2 marker:text-cyan-500">
                  <li>
                    <span className="font-semibold text-white">{data.totalResponses}</span>{" "}
                    {data.totalResponses === 1 ? "person has" : "people have"} submitted a response (each submission is counted once).
                  </li>
                  {questionCount > 0 && (
                    <li>
                      This poll has <span className="font-semibold text-white">{questionCount}</span> question
                      {questionCount === 1 ? "" : "s"} with{" "}
                      <span className="font-semibold text-white">{totalAnswerSelections}</span> stored choice selections
                      {expectedAnswersIfFull > 0 ? (
                        <>
                          {" "}
                          (if everyone answered every question once, you would see{" "}
                          <span className="font-semibold text-white">{expectedAnswersIfFull}</span>).
                        </>
                      ) : null}
                    </li>
                  )}
                  {questionCount > 0 && allQuestionsMatchResponses && (
                    <li className="text-teal-400/95">
                      Every question received the same number of answers as you have submissions—consistent with a full answer set on each question.
                    </li>
                  )}
                  {questionCount > 0 && !allQuestionsMatchResponses && data.totalResponses > 0 && (
                    <li>
                      Answers per question range from{" "}
                      <span className="font-semibold text-white">{minQuestionAnswers}</span> to{" "}
                      <span className="font-semibold text-white">{maxQuestionAnswers}</span> (submissions ={" "}
                      {data.totalResponses}). Uneven totals can happen if some items are optional or the form changed mid-campaign.
                    </li>
                  )}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Question-wise summary table */}
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-black tracking-tight text-white">Question summary</h2>
          <p className="mb-6 max-w-3xl text-sm text-zinc-500">
            One row per question: how many answers it received, which option leads, and that leader’s share of answers on that question only.
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="px-4 py-3 sm:px-6">#</th>
                  <th className="px-4 py-3 sm:px-6">Question</th>
                  <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Answers</th>
                  <th className="px-4 py-3 sm:px-6">Leading option</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell sm:px-6">Share of Q</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {poll.questions.map((q, idx) => {
                  const lead = leadingForQuestion(q);
                  const mandatory = q.isMandatory;
                  return (
                    <tr key={q.id} className="text-zinc-300 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-zinc-500 sm:px-6">
                        Q{idx + 1}
                      </td>
                      <td className="max-w-[200px] px-4 py-4 sm:max-w-md sm:px-6">
                        <div className="font-medium text-white">{q.text}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                          {mandatory ? "Required" : "Optional"}
                          <span className="sm:hidden"> · {lead.questionTotal} answers</span>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-zinc-200 sm:table-cell sm:px-6">
                        {lead.questionTotal}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="text-zinc-200">{lead.text}</span>
                        <span className="ml-2 text-zinc-500">({lead.count})</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-right font-semibold text-white sm:table-cell sm:px-6">
                        {lead.questionTotal > 0 ? `${lead.pct}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESULTS BY QUESTION — charts + option counts */}
        <div className="mt-14 space-y-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <BarChartIcon className="h-6 w-6 text-cyan-500" />
              Response detail by question
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Bar comparison, donut share, and per-option counts. Percentages use each question’s own answer total.
            </p>
          </div>
          <div className="grid gap-8">
            {poll.questions.map((q, idx) => {
              const { chartData, chartConfig } = buildBarChartProps(q);
              const { pieData, pieChartConfig } = buildPieChartPayload(q);
              const qTotal = answerTotalsByQuestionMap[q.id] ?? 0;
              const hasPieData = qTotal > 0;
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
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-600 text-[10px] font-bold text-white uppercase">Q{idx + 1}</span>
                          <CardTitle className="text-xl font-bold text-white">{q.text}</CardTitle>
                        </div>
                        <CardDescription className="text-zinc-500">
                          {q.isMandatory ? "Required" : "Optional"} ·{" "}
                          {qTotal} answers on this question
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <div className="grid gap-10 lg:grid-cols-2">
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Responses by option
                        </p>
                        <div className="h-[280px] w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-3 sm:h-[300px] sm:p-4">
                          <BarChart
                            data={chartData}
                            chartConfig={chartConfig}
                            xDataKey="label"
                            yDataKey="votes"
                            hideLegend
                            barVariant="gradient"
                            barRadius={8}
                            enableHoverHighlight
                            backgroundVariant="dots"
                            yAxisProps={{ width: 36 }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Share of this question
                        </p>
                        <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 p-3 sm:h-[300px] sm:p-4">
                          {hasPieData ? (
                            <PieChart
                              className="mx-auto aspect-square h-full max-h-[280px] w-full max-w-[280px]"
                              data={pieData}
                              dataKey="votes"
                              nameKey="segmentKey"
                              chartConfig={pieChartConfig}
                              innerRadius="52%"
                              outerRadius="88%"
                              paddingAngle={2}
                              cornerRadius={4}
                              showLabels={pieData.length <= 6}
                              labelKey="votes"
                              hideLegend={false}
                              legendVariant="circle"
                            />
                          ) : (
                            <p className="px-4 text-center text-sm text-zinc-500">
                              No votes on this question yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 border-t border-white/5 pt-8">
                      <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Option breakdown
                      </h4>
                      <div className="space-y-4">
                        {q.options.map((opt) => {
                          const countObj = data.optionCounts.find((oc) => oc.optionId === opt.id);
                          const count = countObj ? countObj.count : 0;
                          const questionVoteTotal = answerTotalsByQuestionMap[q.id] ?? 0;
                          const percent =
                            questionVoteTotal > 0 ? Math.round((count / questionVoteTotal) * 100) : 0;

                          return (
                            <div key={opt.id} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300 font-medium">{opt.text}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-500">{count} votes</span>
                                  <span className="text-white font-bold tabular-nums">{percent}%</span>
                                </div>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-500"
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
        {data.textResults?.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
              <MessageSquare className="h-6 w-6 text-teal-400" />
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

const StatsCard = ({ label, value, icon, color, hint }) => (
  <Card className="glass-card border-white/5 py-7 text-center group hover:border-white/10 transition-colors sm:py-8">
    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110 sm:mb-4">
      {icon}
    </div>
    <div className={`text-3xl font-black tracking-tighter sm:text-4xl ${color} mb-1`}>{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
    {hint ? (
      <p className="mx-auto mt-3 max-w-[14rem] px-2 text-[11px] leading-snug text-zinc-600">{hint}</p>
    ) : null}
  </Card>
);

export default Analytics;
