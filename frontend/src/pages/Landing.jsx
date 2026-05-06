import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../components/ui/Button'

const FEATURES = [
  {
    index: '01',
    title: 'Isolated Execution',
    desc: 'Every run gets its own Docker container. No interference, no data leaks. Hermetic by design.',
  },
  {
    index: '02',
    title: 'Live Streaming',
    desc: 'Output streams line by line in real time. Not buffered, not batched. Zero latency.',
  },
  {
    index: '03',
    title: 'Real-time Collaboration',
    desc: 'Share a room link. Code together, run together, see the same output — synchronized.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const termY = useTransform(scrollY, [0, 400], [0, -40])

  return (
    <div className="min-h-screen bg-base-950 flex flex-col overflow-x-hidden">

      {/* ── MINIMAL NAV ── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 flex items-center justify-between px-8 lg:px-16 h-16 border-b border-warm-700/20"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-8 h-8 bg-accent-700 flex items-center justify-center font-display font-bold text-sm text-base-cream"
            whileHover={{ scale: 1.05 }}
          >
            C
          </motion.div>
          <span className="font-display font-semibold text-xl tracking-tight text-warm-100">
            CodeForge
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="md" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button size="md" onClick={() => navigate('/register')}>
            Start
          </Button>
        </div>
      </motion.nav>

      {/* ── HERO SECTION — Editorial Grid ── */}
      <section ref={heroRef} className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[90vh] px-8 lg:px-16 py-20">

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-700/10 to-transparent" />
        </div>

        {/* ── LEFT: Hero Copy (spans 6 cols) ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col justify-center space-y-10"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="w-px h-6 bg-accent-700" />
            <span className="font-mono text-xs text-accent-700 tracking-widest uppercase">
              Code Execution Platform
            </span>
          </motion.div>

          {/* Main Headline — Large Display Type */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="font-display text-display-sm leading-none tracking-tight text-warm-100">
              Write Code.
            </h1>
            <h1 className="font-display text-display-sm leading-none tracking-tight">
              <motion.span
                className="inline-block text-accent-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Run Anywhere.
              </motion.span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="font-body text-body-lg max-w-md leading-relaxed text-warm-300"
          >
            Execute code in isolated Docker containers. Collaborate in real time. Watch output stream live — right in your browser.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4">
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              className="font-display"
            >
              Get Started
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/login')}
              className="font-display"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Stats Grid — Asymmetric */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 pt-10 border-t border-warm-700/30"
          >
            {[
              { value: '<50ms', label: 'Cold Start' },
              { value: '∞', label: 'Isolation' },
              { value: '2+', label: 'Languages' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-semibold text-accent-700 mb-1">
                  {stat.value}
                </div>
                <div className="font-mono text-xs text-warm-600 tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Terminal Demo (spans 6 cols) ── */}
        <div className="hidden lg:flex lg:col-span-6 items-center justify-end">
          <motion.div
            style={{ y: termY }}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative w-full max-w-md border border-warm-700/30 bg-warm-900/5"
          >
            {/* Terminal header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-700/20 bg-warm-900/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-warm-600/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warm-600/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warm-600/40" />
              </div>
              <span className="text-xs font-mono text-warm-600">main.js</span>
            </div>

            {/* Code */}
            <pre className="p-4 text-xs font-mono leading-relaxed text-warm-400 overflow-x-auto border-b border-warm-700/20">
              <span className="text-warm-500">const</span> nums = [<span className="text-accent-700">1, 2, 3</span>]{'\n'}
              {'\n'}
              <span className="text-warm-500">nums</span>.forEach((n) {'=> {'}{'\n'}
              {'  '}console.log(n * <span className="text-accent-700">2</span>){'\n'}
              {'}'}
            </pre>

            {/* Output */}
            <div className="p-4">
              <div className="text-xs font-mono text-warm-600 mb-2 flex items-center gap-2">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-accent-700"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                stdout
              </div>
              <div className="space-y-1">
                {[2, 4, 6].map((n, i) => (
                  <motion.div
                    key={n}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15, duration: 0.3 }}
                    className="text-accent-700 text-xs font-mono"
                  >
                    {n}
                  </motion.div>
                ))}
                <motion.span
                  className="inline-block w-1 h-3 bg-accent-700 ml-1"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="border-t border-warm-700/20 bg-base-950"
      >
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-32">
          {/* Section headline */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-display-xs leading-tight tracking-tight text-warm-100 mb-24"
          >
            Designed for speed & craft.
          </motion.h2>

          {/* Features Grid — Asymmetric */}
          <motion.div
            className="grid lg:grid-cols-3 gap-16 lg:gap-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {FEATURES.map((feature) => (
              <motion.article
                key={feature.index}
                variants={itemVariants}
                className="flex flex-col space-y-6"
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl font-semibold text-accent-700">
                    {feature.index}
                  </span>
                  <div className="flex-1 h-px bg-warm-700/30" />
                </div>

                <h3 className="font-display text-2xl font-semibold text-warm-100">
                  {feature.title}
                </h3>

                <p className="font-body text-warm-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── CTA SECTION ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="border-t border-warm-700/20 bg-base-950"
      >
        <div className="max-w-4xl mx-auto px-8 lg:px-16 py-32 text-center space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-display-xs leading-tight tracking-tight text-warm-100"
          >
            Ready to run?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-body text-lg text-warm-400 max-w-xl mx-auto"
          >
            Join developers building the next generation of code execution tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" onClick={() => navigate('/register')}>
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-warm-700/20 bg-base-950 mt-auto">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-8 flex items-center justify-between text-xs font-mono text-warm-600">
          <div>© 2026 CodeForge. Built with intention.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-warm-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-warm-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-warm-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}