import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import NoiseBackground from "../components/ui/NoiseBackground";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
`;


const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const rise = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const FEATURES = [
  {
    index: "01",
    title: "Isolated Execution",
    desc: "Every run executes in a sandboxed process with a strict timeout. No interference, no data leaks. Hermetic by design.",
  },
  {
    index: "02",
    title: "Live Streaming",
    desc: "Output streams line by line in real time. Not buffered, not batched. Sub-50ms cold start.",
  },
  {
    index: "03",
    title: "Collaboration",
    desc: "Share a room link. Code together, run together, see the same output — fully synchronized.",
  },
];

const STATS = [
  { value: "<50ms", label: "Cold Start" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "2.4M", label: "Sessions Run" },
];

/* ── Glowing star for marquee ──────────────────────────────────────────────── */
function GlowingStar({ size = 16, delay = 0 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.92, 1.08, 0.92],
        rotate: [0, 15, 0],
        filter: [
          'drop-shadow(0 0 2px rgba(192,74,26,0.3))',
          'drop-shadow(0 0 7px rgba(192,74,26,0.7))',
          'drop-shadow(0 0 2px rgba(192,74,26,0.3))',
        ],
      }}
      transition={{ duration: 2.8, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ flexShrink: 0 }}
    >
      {/* 4-pointed sparkle / diamond star */}
      <path
        d="M12 2C12 2 13.2 8.8 14.8 10.2C16.4 11.6 22 12 22 12C22 12 16.4 12.4 14.8 13.8C13.2 15.2 12 22 12 22C12 22 10.8 15.2 9.2 13.8C7.6 12.4 2 12 2 12C2 12 7.6 11.6 9.2 10.2C10.8 8.8 12 2 12 2Z"
        fill="#C04A1A"
        fillOpacity="0.9"
      />
      <path
        d="M12 2C12 2 13.2 8.8 14.8 10.2C16.4 11.6 22 12 22 12C22 12 16.4 12.4 14.8 13.8C13.2 15.2 12 22 12 22C12 22 10.8 15.2 9.2 13.8C7.6 12.4 2 12 2 12C2 12 7.6 11.6 9.2 10.2C10.8 8.8 12 2 12 2Z"
        fill="url(#sparkleGlow)"
        fillOpacity="0.45"
      />
      <defs>
        <radialGradient id="sparkleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB088" />
          <stop offset="100%" stopColor="#C04A1A" stopOpacity="0" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}

const MARQUEE_ITEMS = [
  "Sandboxed Process Execution",
  "Real-time Collaboration",
  "Live Output Streaming",
  "Secure Sandboxed Execution",
  "Multi-Language Support",
  "BullMQ Job Queue",
  "WebSocket Sync",
  "Execution History",
];

function MarqueeStrip({ direction = 'left' }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        animation: `cf-marquee-${direction} 45s linear infinite`,
        whiteSpace: 'nowrap',
      }}
    >
      {items.map((text, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <GlowingStar size={14} delay={i * 0.3} />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#7A6E5A',
            }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const termY = useTransform(scrollY, [0, 500], [0, -28]);
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0.7]);

  return (
    <>
      <style>{FONTS}{`
        @keyframes cf-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <NoiseBackground />

      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#F8F4ED] font-['DM_Mono']">
        <Navbar variant="public" />

        {/* HERO */}
        <motion.section
          id="hero"
          ref={heroRef}
          style={{ opacity: heroOpacity }}
          className="relative z-10 grid grid-cols-1 gap-0 px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[90vh] lg:grid-cols-12 lg:px-16 lg:py-0"
        >
          <div className="pointer-events-none absolute left-16 top-0 hidden h-full w-px bg-[linear-gradient(to_bottom,transparent,#E0D8CA_20%,#E0D8CA_80%,transparent)] lg:block" />
          <div className="pointer-events-none absolute right-[15%] top-[10%] h-90 w-120 bg-[radial-gradient(ellipse,rgba(192,74,26,0.07)_0%,transparent_70%)] blur-2xl" />

          {/* ── LEFT ── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center gap-6 sm:gap-8 py-4 lg:py-20 lg:col-span-7 lg:pl-12 lg:pr-16"
          >
            <motion.div variants={rise} className="flex items-center gap-3">
              <span className="block h-px w-5 bg-[#C04A1A]" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#C04A1A]">
                Code Execution Platform
              </span>
            </motion.div>

            <motion.div variants={rise}>
              <h1 className="font-['Spectral'] text-[clamp(2.8rem,8vw,5.5rem)] font-light leading-[0.9] tracking-[-0.01em] text-[#1A1208]">
                Write Code.
                <br />
                <em className="font-bold italic text-[#C04A1A]">Run Anywhere.</em>
              </h1>
              <div className="mt-4 h-0.5 w-36 sm:w-45 bg-[linear-gradient(to_right,#C04A1A,rgba(192,74,26,0.2))]" />
            </motion.div>

            <motion.p
              variants={rise}
              className="max-w-95 font-['Spectral'] text-[1.05rem] italic leading-[1.85] text-[#7A6E5A]"
            >
              Execute code in a secure sandboxed process. Collaborate in real time. Watch
              output stream live — right in your browser.
            </motion.p>

            <motion.div variants={rise} className="flex items-center gap-4">
              <Button onClick={() => navigate("/register")} size="lg">
                Start Free →
              </Button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.08em] text-[#7A6E5A] underline underline-offset-[3px] transition-colors hover:text-[#C04A1A]"
              >
                Sign in
              </button>
            </motion.div>

            <motion.div
              variants={rise}
              className="mt-2 grid grid-cols-3 gap-0 border-t border-[#E0D8CA] pt-5 sm:pt-7"
            >
              {STATS.map(({ value, label }, i) => (
                <div
                  key={label}
                  className={`${i < 2 ? "border-r border-[#E0D8CA]" : ""} ${
                    i < 2 ? "pr-3 sm:pr-6" : ""
                  } ${i > 0 ? "pl-3 sm:pl-6" : ""}`}
                >
                  <div className="font-['Spectral'] text-[1.4rem] sm:text-[1.8rem] font-bold leading-none text-[#1A1208]">
                    {value}
                  </div>
                  <div className="mt-1 text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-[#B0A390]">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Terminal Card ── */}
          <div className="flex items-center justify-center py-6 lg:col-span-5 lg:py-0">
            <motion.div
              style={{ y: termY }}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm lg:max-w-105"
            >
              <div className="relative border border-[#D4C9B0] border-l-4 border-l-[#C04A1A] bg-[#FAF7F0] shadow-[6px_6px_0_#E0D8CA]">
                <div className="flex items-center justify-between border-b border-[#E8E0D0] bg-[#F5F0E8] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    {["#E8C4B0", "#E8D8B0", "#B8D4B8"].map((c, i) => (
                      <div
                        key={i}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.14em] text-[#B0A390]">
                    main.js — CodeForge
                  </span>
                  <div className="flex gap-1.5">
                    <span className="mt-1 h-px w-2 bg-[#D4C9B0]" />
                    <span className="h-2 w-2 border border-[#D4C9B0]" />
                  </div>
                </div>

                <div className="border-b border-[#EDE8DF] px-5 pb-4 pt-5">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-0 select-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <span
                          key={n}
                          className="min-w-4 text-right font-['DM_Mono'] text-[11px] leading-[1.9] text-[#D4C9B0]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <pre className="m-0 flex-1 overflow-x-auto font-['DM_Mono'] text-[12px] leading-[1.9]">
                      <span className="text-[#C04A1A]">const</span>
                      <span className="text-[#4A3E30]"> nums </span>
                      <span className="text-[#8C7060]">=</span>
                      <span className="text-[#4A3E30]"> [</span>
                      <span className="text-[#B0631A]">1, 2, 3</span>
                      <span className="text-[#4A3E30]">]</span>
                      {"\n\n"}
                      <span className="text-[#4A3E30]">nums</span>
                      <span className="text-[#1A1208]">.forEach</span>
                      <span className="text-[#4A3E30]">{"((n) => {"}</span>
                      {"\n"}
                      <span className="text-[#B0A390]">{"  "}{"// multiply by 2"}</span>
                      {"\n"}
                      <span className="text-[#4A3E30]">{"  "}console</span>
                      <span className="text-[#1A1208]">.log</span>
                      <span className="text-[#4A3E30]">{"(n "}</span>
                      <span className="text-[#8C7060]">*</span>
                      <span className="text-[#B0631A]"> 2</span>
                      <span className="text-[#4A3E30]">{")"}</span>
                      {"\n"}
                      <span className="text-[#4A3E30]">{"}"}</span>
                    </pre>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-[#3D8C5C]"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    <span className="text-[9px] uppercase tracking-[0.14em] text-[#B0A390]">
                      stdout
                    </span>
                    <div className="h-px flex-1 bg-[#EDE8DF]" />
                    <span className="text-[9px] text-[#D4C9B0]">0.12s</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {[2, 4, 6].map((n, i) => (
                      <motion.div
                        key={n}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.2, duration: 0.35 }}
                        className="font-['DM_Mono'] text-[15px] font-medium leading-[1.6] text-[#C04A1A]"
                      >
                        {n}
                      </motion.div>
                    ))}
                    <motion.span
                      className="mt-0.5 inline-block h-3.75 w-1.75 bg-[#C04A1A]"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.85, repeat: Infinity }}
                    />
                  </div>
                </div>

                <div className="absolute -bottom-px -right-px bg-[#C04A1A] px-2.5 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-widest text-[#FAF7F0]">
                  Running
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {[
                  { label: "Runtime", val: "node:20 / python3" },
                  { label: "Memory", val: "128 MB" },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex-1 border border-[#E0D8CA] border-t-2 border-t-[#C04A1A] bg-[#FAF7F0] px-3 py-2"
                  >
                    <div className="mb-0.5 text-[8px] uppercase tracking-[0.12em] text-[#B0A390]">
                      {label}
                    </div>
                    <div className="font-['DM_Mono'] text-[11px] text-[#4A3E30]">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ═══════════════════════ INFINITE MARQUEE ══ */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            overflow: 'hidden',
            borderTop: '1px solid #E0D8CA',
            borderBottom: '1px solid #E0D8CA',
            background: '#FAF7F0',
            padding: '18px 0',
          }}
        >
          {/* Fade edges */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
            background: 'linear-gradient(90deg, #FAF7F0, transparent)',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
            background: 'linear-gradient(270deg, #FAF7F0, transparent)',
          }} />
          <MarqueeStrip direction="left" />
        </div>

        {/* ═══════════════════════ FEATURES ══ */}
        <section
          id="features"
          className="relative z-10 border-b border-[#E0D8CA] bg-[#F8F4ED]"
        >
          <div className="pointer-events-none absolute left-16 top-0 hidden h-full w-px bg-[linear-gradient(to_bottom,transparent,#E0D8CA_10%,#E0D8CA_90%,transparent)] lg:block" />

          <div className="mx-auto max-w-6xl px-8 py-28 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mb-20 lg:pl-12"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="block h-px w-5 bg-[#C04A1A]" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#C04A1A]">
                  What we offer
                </span>
              </div>
              <h2 className="font-['Spectral'] text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.05] text-[#1A1208]">
                Designed for <em className="font-bold italic text-[#C04A1A]">speed</em>
                {" "}&amp;{" "}
                <em className="font-bold italic">craft.</em>
              </h2>
            </motion.div>

            <motion.div
              className="grid gap-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {FEATURES.map((f, i) => (
                <motion.article
                  key={f.index}
                  variants={rise}
                  className={`group relative cursor-default overflow-hidden border-t-[3px] border-transparent bg-[#FAF7F0] px-7 py-8 sm:px-10 sm:py-9 transition-all duration-200 hover:border-[#C04A1A] hover:bg-[#FDF9F3] ${
                    i < 2 ? "sm:border-r border-b sm:border-b-0 border-[#E0D8CA]" : ""
                  }`}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="font-['DM_Mono'] text-[11px] font-medium tracking-[0.06em] text-[#C04A1A]">
                      {f.index}
                    </span>
                    <div className="h-px flex-1 bg-[#E0D8CA]" />
                  </div>

                  <h3 className="mb-3 font-['Spectral'] text-[1.4rem] font-semibold leading-[1.15] text-[#1A1208]">
                    {f.title}
                  </h3>

                  <p className="font-['DM_Mono'] text-[12px] leading-[1.9] text-[#7A6E5A]">
                    {f.desc}
                  </p>

                  <motion.div
                    className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 bg-[radial-gradient(ellipse_at_bottom_right,rgba(192,74,26,0.1),transparent_70%)] opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ FOOTER ══ */}
        <footer
          id="footer"
          className="relative z-10 border-t border-[#E0D8CA] bg-[#FAF7F0]"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-8 py-8 md:flex-row lg:px-16">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-[#C04A1A] shadow-[1px_1px_0_#8C3310]">
                <span className="font-['Spectral'] text-[0.75rem] font-bold italic text-[#FAF7F0]">
                  C
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.13em] text-[#B0A390]">
                CodeForge
              </span>
            </div>

            <div className="flex gap-7">
              {["Terms & Conditions", "Privacy Policy"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-[#C4B8A4] transition-colors hover:text-[#C04A1A]"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-[10px] uppercase tracking-[0.08em] text-[#C4B8A4]">
              © 2026 CodeForge. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
