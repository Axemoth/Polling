import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./landing.css";

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Reusable reveal wrapper ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <span className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#00c8ff] mb-3">
      {children}
    </span>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-[62px] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(2,11,20,0.92)" : "rgba(2,11,20,0.6)",
        borderBottom: "1px solid rgba(0,180,255,0.08)",
        backdropFilter: "blur(24px)",
      }}
    >
      <div
        className="text-[19px] font-extrabold tracking-[-0.03em]"
        style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
      >
        Vox<span style={{ color: "#00c8ff" }}>ly</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["How it works", "Features", "Docs", "Pricing"].map((l) => (
          <a
            key={l}
            href="#"
            className="text-[13px] font-medium text-[#4d7a99] hover:text-[#d8edf8] transition-colors duration-200"
          >
            {l}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/auth')}
          className="text-[13px] font-semibold px-4 py-2 rounded-[7px] transition-all duration-200"
          style={{
            background: "none",
            color: "#4d7a99",
            border: "1px solid rgba(0,180,255,0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#d8edf8";
            e.currentTarget.style.borderColor = "rgba(0,180,255,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#4d7a99";
            e.currentTarget.style.borderColor = "rgba(0,180,255,0.15)";
          }}
        >
          Log in
        </button>
        <button
          onClick={() => navigate('/auth')}
          className="text-[13px] font-semibold px-4 py-2 rounded-[7px] transition-all duration-200"
          style={{
            background: "#00c8ff",
            color: "#020b14",
            boxShadow: "0 0 20px rgba(0,200,255,0.28)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#33d6ff";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 0 32px rgba(0,200,255,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#00c8ff";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0,200,255,0.28)";
          }}
        >
          Get started
        </button>
      </div>
    </nav>
  );
}

// ─── LIVE POLL DEMO CARD ─────────────────────────────────────────────────────
const POLL_BASE  = [42, 31, 18, 9];
const POLL_TOTAL = POLL_BASE.reduce((a, b) => a + b, 0);
const POLL_OPTS  = ["Excellent", "Good", "Fair", "Poor"];

function LivePollDemo() {
  const [widths,    setWidths]    = useState([0, 0, 0, 0]);
  const [pcts,      setPcts]      = useState([0, 0, 0, 0]);
  const [respCount, setRespCount] = useState(0);
  const extra = useRef([0, 0, 0, 0]);

  // Initial fill animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const base = POLL_BASE.map((v) => Math.round((v / POLL_TOTAL) * 100));
      setWidths(base);
      setPcts(base);

      let n = 0;
      const ticker = setInterval(() => {
        n++;
        setRespCount(n);
        if (n >= POLL_TOTAL) clearInterval(ticker);
      }, 38);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Simulate live responses
  useEffect(() => {
    const id = setInterval(() => {
      const i = Math.floor(Math.random() * 4);
      extra.current[i]++;
      const ex  = extra.current;
      const sum = POLL_TOTAL + ex.reduce((a, b) => a + b, 0);
      const newW = POLL_BASE.map((b, idx) =>
        Math.round(((b + ex[idx]) / sum) * 100)
      );
      setWidths(newW);
      setPcts(newW);
      setRespCount(sum);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* Floating chips */}
      <div
        className="float-chip absolute -top-4 right-10 z-10 flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-[10px] pointer-events-none"
        style={{ background: "rgba(4,15,29,0.95)", border: "1px solid rgba(0,180,255,0.22)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", color: "#d8edf8" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "#3fffa2", boxShadow: "0 0 6px #3fffa2" }} />
        +3 responses
      </div>

      <div
        className="float-chip-2 absolute -bottom-4 left-10 z-10 flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-[10px] pointer-events-none"
        style={{ background: "rgba(4,15,29,0.95)", border: "1px solid rgba(0,180,255,0.22)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", color: "#d8edf8" }}
      >
        <span style={{ color: "#00c8ff" }}>📊</span>
        Live analytics
      </div>

      <div
        className="float-chip-3 absolute top-[42%] -right-4 z-10 flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-[10px] pointer-events-none"
        style={{ background: "rgba(4,15,29,0.95)", border: "1px solid rgba(0,180,255,0.22)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", color: "#d8edf8" }}
      >
        <span>🔒</span>
        Anonymous mode
      </div>

      {/* Card */}
      <div
        className="glass-blue relative overflow-hidden p-7"
        style={{ boxShadow: "0 0 0 1px rgba(0,180,255,0.05), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="demo-scan" />

        {/* Header */}
        <div
          className="flex items-center justify-between mb-5 pb-4"
          style={{ borderBottom: "1px solid rgba(0,180,255,0.08)" }}
        >
          <span className="text-[15px] font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}>
            Q3 Team Retrospective
          </span>
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.07em] uppercase px-2.5 py-1 rounded-full"
            style={{ color: "#00c8ff", background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)" }}
          >
            <span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: "#00c8ff" }} />
            Live
          </span>
        </div>

        {/* Question */}
        <p className="text-[14px] font-semibold mb-5 leading-snug" style={{ color: "#e0f4ff" }}>
          How would you rate the sprint planning process?
        </p>

        {/* Bars */}
        <div className="flex flex-col gap-3">
          {POLL_OPTS.map((label, i) => (
            <div key={label}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{ color: "#d8edf8" }}>{label}</span>
                <span className="font-semibold" style={{ color: "#00c8ff" }}>{pcts[i]}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.1)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #0ea5e9, #00c8ff)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${widths[i]}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-5 pt-4"
          style={{ borderTop: "1px solid rgba(0,180,255,0.08)" }}
        >
          <span className="text-[12px]" style={{ color: "#4d7a99" }}>Total responses</span>
          <span
            className="text-[18px] font-extrabold"
            style={{ fontFamily: "'Syne', sans-serif", color: "#00c8ff" }}
          >
            {respCount}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="landing-rel min-h-screen grid md:grid-cols-2 items-center gap-16 max-w-[1280px] mx-auto px-16 pt-28 pb-24">
      {/* Orbs */}
      <div
        className="absolute pointer-events-none"
        style={{ width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,255,0.07) 0%, transparent 70%)", top: -200, left: -150 }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)", bottom: 0, right: -60 }}
      />

      {/* Left */}
      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase px-4 py-[5px] rounded-full mb-7"
          style={{ color: "#00c8ff", background: "rgba(0,200,255,0.07)", border: "1px solid rgba(0,200,255,0.2)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: "#00c8ff" }} />
          Now with real-time WebSocket sync
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-[clamp(44px,5vw,70px)] font-extrabold leading-[1.04] tracking-[-0.04em] mb-5"
          style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Polls that<br />
          <span className="hero-hl">
            think live.
            <span className="hero-hl-fill" aria-hidden="true">think live.</span>
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          className="text-[17px] leading-[1.7] max-w-[440px] mb-9"
          style={{ color: "#4d7a99" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Create polls in minutes, share a link, and watch responses arrive{" "}
          <strong style={{ color: "#d8edf8", fontWeight: 500 }}>live</strong>.
          Anonymous or authenticated — built for teams that move fast.
        </motion.p>

        {/* Actions */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={() => navigate('/auth')}
            className="text-[15px] font-semibold px-7 py-3.5 rounded-[9px] transition-all duration-200 flex items-center gap-2"
            style={{ background: "#00c8ff", color: "#020b14", boxShadow: "0 0 32px rgba(0,200,255,0.32)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#33d6ff"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(0,200,255,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#00c8ff"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(0,200,255,0.32)"; }}
          >
            Start for free →
          </button>
          <button
            className="text-[15px] font-medium px-6 py-3.5 rounded-[9px] transition-all duration-200"
            style={{ background: "none", color: "#d8edf8", border: "1px solid rgba(0,180,255,0.2)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,180,255,0.5)"; e.currentTarget.style.background = "rgba(0,180,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,180,255,0.2)"; e.currentTarget.style.background = "none"; }}
          >
            See live demo
          </button>
        </motion.div>

        {/* Trust */}
        <motion.div
          className="flex items-center gap-3 mt-9 text-[12px]"
          style={{ color: "#4d7a99" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="flex">
            {["#0ea5e9,#00c8ff", "#0284c7,#38bdf8", "#0369a1,#7dd3fc", "#075985,#bae6fd"].map((g, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${g})`, borderColor: "#020b14", marginLeft: i === 0 ? 0 : -8 }}
              >
                {["A","K","R","M"][i]}
              </div>
            ))}
          </div>
          <span>Trusted by <strong style={{ color: "#d8edf8" }}>1,200+</strong> teams already</span>
        </motion.div>
      </div>

      {/* Right — live demo */}
      <motion.div
        className="relative z-10 pt-6 pb-6 pr-6"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.22 }}
      >
        <LivePollDemo />
      </motion.div>
    </section>
  );
}

// ─── STATS BAR ───────────────────────────────────────────────────────────────
function StatCounter({ target, suffix = "", large = false }) {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setVal(target);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  const display = large
    ? val >= 1000 ? (val / 1000).toFixed(1) + "k" : val
    : val.toLocaleString();

  return <span ref={ref}>{display}{suffix}</span>;
}

function StatsBar() {
  const stats = [
    { label: "Polls created",       target: 12400, large: true, suffix: "+" },
    { label: "Responses collected", target: 280000, large: true, suffix: "+" },
    { label: "Teams using Voxly",   target: 1200,  large: true, suffix: "+" },
    { label: "Uptime SLA",          value:  "99%",  fixed: true },
  ];

  return (
    <div
      className="landing-rel"
      style={{ borderTop: "1px solid rgba(0,180,255,0.08)", borderBottom: "1px solid rgba(0,180,255,0.08)", background: "rgba(4,15,29,0.6)", padding: "32px 0" }}
    >
      <div className="max-w-[960px] mx-auto px-12 grid grid-cols-2 md:grid-cols-4 gap-0">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="text-center px-6"
            style={{ borderRight: i < 3 ? "1px solid rgba(0,180,255,0.08)" : "none" }}
          >
            <div
              className="text-[36px] font-extrabold tracking-[-0.04em] flex items-baseline justify-center gap-0.5"
              style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
            >
              {s.fixed ? (
                <span style={{ color: "#00c8ff" }}>{s.value}</span>
              ) : (
                <>
                  <StatCounter target={s.target} large={s.large} />
                  <span style={{ color: "#00c8ff" }}>{s.suffix}</span>
                </>
              )}
            </div>
            <div className="text-[11px] font-semibold tracking-[0.04em] mt-1" style={{ color: "#4d7a99" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", title: "Build your poll",  desc: "Add questions, set options, choose anonymous or authenticated mode, and configure an optional expiry time." },
  { num: "02", title: "Share the link",   desc: "Every poll gets a unique public URL. Send it anywhere — Slack, email, QR code. No account required to respond." },
  { num: "03", title: "Watch it live",    desc: "Your dashboard updates in real-time via WebSockets. See option counts, participation rates, and insights as they arrive." },
];

function HowItWorks() {
  return (
    <section id="how" className="landing-rel py-28">
      <div className="max-w-[1100px] mx-auto px-12">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <h2
            className="text-[clamp(30px,4vw,48px)] font-extrabold tracking-[-0.03em] leading-[1.08] mb-4"
            style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
          >
            Three steps to<br />live feedback.
          </h2>
          <p className="text-[16px] leading-[1.7] max-w-[500px]" style={{ color: "#4d7a99" }}>
            No setup complexity. Build, share, and analyse — all in one place with real-time updates baked in.
          </p>
        </Reveal>

        <motion.div
          className="grid md:grid-cols-3 gap-0 mt-16 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <div className="steps-connector hidden md:block" />

          {STEPS.map((step) => (
            <motion.div key={step.num} className="px-6" variants={fadeUp}>
              <div
                className="w-14 h-14 rounded-[14px] flex items-center justify-center text-[20px] font-extrabold mb-6 relative"
                style={{ fontFamily: "'Syne', sans-serif", color: "#00c8ff", background: "rgba(0,180,255,0.07)", border: "1px solid rgba(0,180,255,0.2)", boxShadow: "0 0 24px rgba(0,200,255,0.08)" }}
              >
                {step.num}
                <span
                  className="absolute rounded-[18px]"
                  style={{ inset: -4, border: "1px solid rgba(0,200,255,0.08)" }}
                />
              </div>
              <h3
                className="text-[18px] font-bold tracking-[-0.02em] mb-3"
                style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
              >
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.7]" style={{ color: "#4d7a99" }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── EXPIRY COUNTDOWN ────────────────────────────────────────────────────────
function ExpiryCountdown() {
  const [secs, setSecs] = useState(2 * 3600 + 47 * 60 + 31);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return (
    <div className="grid grid-cols-3 gap-2 mt-5">
      {[[h,"Hours"],[m,"Mins"],[s,"Secs"]].map(([val, lbl]) => (
        <div
          key={lbl}
          className="rounded-[9px] p-2.5 text-center"
          style={{ background: "rgba(0,180,255,0.05)", border: "1px solid rgba(0,180,255,0.1)" }}
        >
          <div
            className="text-[24px] font-extrabold"
            style={{ fontFamily: "'Syne', sans-serif", color: "#00c8ff" }}
          >
            {val}
          </div>
          <div className="text-[10px] tracking-[0.06em] uppercase mt-0.5" style={{ color: "#4d7a99" }}>
            {lbl}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WS PULSE VISUAL ─────────────────────────────────────────────────────────
function WSPulse() {
  return (
    <div className="relative flex items-center justify-center h-16 mt-5">
      <div className="ws-ring" />
      <div className="ws-ring ws-ring-2" />
      <div className="ws-ring ws-ring-3" />
      <div className="ws-center relative z-10" />
    </div>
  );
}

// ─── FEATURES BENTO ──────────────────────────────────────────────────────────
const MINI_BARS = [
  { label: "Excellent", pct: 63 },
  { label: "Good",      pct: 24 },
  { label: "Fair",      pct: 9  },
  { label: "Poor",      pct: 4  },
];

function BentoCard({ className = "", children, delay = 0 }) {
  return (
    <motion.div
      className={`glass-blue p-7 relative overflow-hidden transition-transform duration-300 hover:-translate-y-[2px] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ "--card-glow": "radial-gradient(circle at 0% 0%, rgba(0,180,255,0.04), transparent 60%)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--card-glow)" }} />
      {children}
    </motion.div>
  );
}

function BentoIcon({ children }) {
  return (
    <div
      className="w-11 h-11 rounded-[11px] flex items-center justify-center text-[20px] mb-5"
      style={{ background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.15)" }}
    >
      {children}
    </div>
  );
}

function BentoLabel({ children }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: "#00c8ff" }}>
      {children}
    </div>
  );
}

function BentoTitle({ children }) {
  return (
    <h3
      className="text-[19px] font-bold tracking-[-0.02em] leading-[1.25] mb-2.5"
      style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
    >
      {children}
    </h3>
  );
}

function Features() {
  return (
    <section id="features" className="landing-rel pb-28">
      <div className="max-w-[1100px] mx-auto px-12">
        <Reveal>
          <SectionLabel>Features</SectionLabel>
          <h2
            className="text-[clamp(30px,4vw,48px)] font-extrabold tracking-[-0.03em] leading-[1.08]"
            style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
          >
            Everything you need.<br />Nothing you don't.
          </h2>
        </Reveal>

        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-3.5 mt-14">
          {/* Analytics */}
          <BentoCard className="col-span-12 md:col-span-5" delay={0}>
            <BentoIcon>📊</BentoIcon>
            <BentoLabel>Live Analytics</BentoLabel>
            <BentoTitle>Real-time response breakdown</BentoTitle>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4d7a99" }}>
              Option counts and participation rates update the moment someone submits.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {MINI_BARS.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5">
                  <span className="text-[11px] w-[72px] flex-shrink-0" style={{ color: "#4d7a99" }}>{b.label}</span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(0,180,255,0.07)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #0ea5e9, #00c8ff)" }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${b.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + MINI_BARS.indexOf(b) * 0.1, ease: [0.16,1,0.3,1] }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold w-7 text-right" style={{ color: "#00c8ff" }}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* WebSockets */}
          <BentoCard className="col-span-12 md:col-span-7" delay={0.1}>
            <BentoIcon>⚡</BentoIcon>
            <BentoLabel>WebSocket Sync</BentoLabel>
            <BentoTitle>Your dashboard updates without refreshing</BentoTitle>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4d7a99" }}>
              Socket.io rooms keep every connected creator in sync the moment a response lands.
            </p>
            <WSPulse />
          </BentoCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-12 gap-3.5 mt-3.5">
          {/* Anonymous */}
          <BentoCard className="col-span-12 md:col-span-4" delay={0.0}>
            <BentoIcon>🔒</BentoIcon>
            <BentoLabel>Response Mode</BentoLabel>
            <BentoTitle>Anonymous or authenticated</BentoTitle>
            <p className="text-[13px] leading-[1.7] mb-4" style={{ color: "#4d7a99" }}>You decide per poll.</p>
            <div className="flex flex-col gap-2.5">
              {[
                { name: "Anonymous",     sub: "Identity hidden",  active: true  },
                { name: "Authenticated", sub: "Login required",   active: false },
              ].map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-[9px]"
                  style={{ background: m.active ? "rgba(0,200,255,0.06)" : "rgba(0,180,255,0.04)", border: `1px solid ${m.active ? "rgba(0,200,255,0.3)" : "rgba(0,180,255,0.1)"}` }}
                >
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: "#d8edf8" }}>{m.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#4d7a99" }}>{m.sub}</div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
                    style={m.active ? { background: "#00c8ff", color: "#020b14" } : { border: "1px solid #2a4f6a" }}
                  >
                    {m.active && "✓"}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Expiry */}
          <BentoCard className="col-span-12 md:col-span-4" delay={0.1}>
            <BentoIcon>⏱</BentoIcon>
            <BentoLabel>Poll Expiry</BentoLabel>
            <BentoTitle>Auto-closes on schedule</BentoTitle>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4d7a99" }}>
              Set an expiry. Responses stop automatically.
            </p>
            <ExpiryCountdown />
          </BentoCard>

          {/* Publish */}
          <BentoCard className="col-span-12 md:col-span-4" delay={0.2}>
            <BentoIcon>📢</BentoIcon>
            <BentoLabel>Publish Results</BentoLabel>
            <BentoTitle>Share outcomes publicly</BentoTitle>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4d7a99" }}>
              One click makes final results visible to everyone on the same poll link — no extra URL needed.
            </p>
            <div
              className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-[9px] text-[13px] font-semibold"
              style={{ background: "rgba(0,200,255,0.07)", border: "1px solid rgba(0,200,255,0.2)", color: "#00c8ff" }}
            >
              <span>📤</span> Publish results now
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTA() {
  const navigate = useNavigate();
  return (
    <section className="landing-rel py-28 text-center overflow-hidden">
      <div
        className="absolute pointer-events-none"
        style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,180,255,0.07) 0%, transparent 70%)" }}
      />
      <div className="max-w-[1100px] mx-auto px-12 relative z-10">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase px-4 py-1.5 rounded-full mb-6"
            style={{ color: "#00c8ff", background: "rgba(0,200,255,0.07)", border: "1px solid rgba(0,200,255,0.18)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00c8ff", boxShadow: "0 0 6px #00c8ff" }} />
            Free to start · No credit card
          </div>
          <h2
            className="text-[clamp(36px,5vw,58px)] font-extrabold tracking-[-0.04em] leading-[1.08] mb-5"
            style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
          >
            Ready to collect<br />feedback that moves?
          </h2>
          <p className="text-[16px] leading-[1.7] mb-10 max-w-[420px] mx-auto" style={{ color: "#4d7a99" }}>
            Set up your first poll in under two minutes. Real-time results included from day one.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="text-[16px] font-bold px-10 py-4 rounded-[10px] inline-flex items-center gap-2.5 transition-all duration-200"
            style={{ background: "#00c8ff", color: "#020b14", boxShadow: "0 0 48px rgba(0,200,255,0.38)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#33d6ff"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 64px rgba(0,200,255,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#00c8ff"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(0,200,255,0.38)"; }}
          >
            Create your first poll →
          </button>
        </Reveal>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="landing-rel"
      style={{ borderTop: "1px solid rgba(0,180,255,0.08)" }}
    >
      <div className="max-w-[1100px] mx-auto px-12 py-8 flex items-center justify-between flex-wrap gap-4">
        <div
          className="text-[16px] font-extrabold tracking-[-0.02em]"
          style={{ fontFamily: "'Syne', sans-serif", color: "#e0f4ff" }}
        >
          Vox<span style={{ color: "#00c8ff" }}>ly</span>
        </div>
        <div className="flex gap-6">
          {["Privacy", "Terms", "GitHub", "Docs"].map((l) => (
            <a key={l} href="#" className="text-[12px] transition-colors duration-200" style={{ color: "#4d7a99" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#d8edf8"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#4d7a99"}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="text-[12px]" style={{ color: "#2a4f6a" }}>© 2025 Voxly. Built for hackathon.</div>
      </div>
    </footer>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="landing">
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}
