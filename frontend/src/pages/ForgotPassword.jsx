import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, AlertCircle } from "lucide-react";
import { forgotPassword } from "../services/api";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
`;

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } },
};

export default function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused]   = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await forgotPassword(email.trim());
      setStatus("sent");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  const isError   = status === "error";
  const isLoading = status === "loading";

  return (
    <>
      <style>{FONTS}</style>

      {/* Noise texture */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "128px",
        }}
      />

      <div
        className="relative min-h-screen flex items-center justify-center px-6"
        style={{ background: "#F8F4ED", fontFamily: "'DM Mono', monospace", zIndex: 1 }}
      >
        {/* Saffron glow */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
            width: 400, height: 300,
            background: "radial-gradient(ellipse, rgba(192,74,26,0.07) 0%, transparent 70%)",
            filter: "blur(32px)", pointerEvents: "none",
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}
        >
          {/* Logo */}
          <motion.div variants={rise} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{
                width: 30, height: 30,
                background: "#C04A1A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "2px 2px 0 #8C3310",
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, color: "#FAF7F0", fontSize: "0.9rem", fontStyle: "italic" }}>C</span>
              </div>
              <span style={{ fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", color: "#B0A390" }}>CodeForge</span>
            </Link>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={rise}
            style={{
              background: "#FAF7F0",
              border: "1px solid #E0D8CA",
              borderLeft: "4px solid #C04A1A",
              boxShadow: "4px 4px 0 #E0D8CA",
              padding: "40px 44px",
            }}
          >
            <AnimatePresence mode="wait">
              {/* ── SUCCESS STATE ── */}
              {status === "sent" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ textAlign: "center" }}
                >
                  {/* Green check box */}
                  <div style={{
                    width: 52, height: 52,
                    background: "#3D8C5C",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "2px 2px 0 #2A6640",
                  }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" stroke="#FAF7F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <h2 style={{
                    fontFamily: "'Spectral', serif",
                    fontSize: "1.7rem",
                    fontWeight: 600,
                    color: "#1A1208",
                    marginBottom: 10,
                  }}>
                    Check your email
                  </h2>

                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6E5A", lineHeight: 1.85, marginBottom: 28 }}>
                    If an account exists for{" "}
                    <strong style={{ color: "#1A1208", fontWeight: 500 }}>{email}</strong>
                    , we've sent a reset link.{" "}
                    <span style={{ color: "#C04A1A" }}>Expires in 10 minutes.</span>
                  </p>

                  <div style={{ height: 1, background: "#E0D8CA", marginBottom: 20 }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#A0917E", letterSpacing: "0.04em" }}>
                      <Mail size={11} />
                      Didn't receive it? Check your spam folder.
                    </div>
                    <Link
                      to="/login"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#C04A1A",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                    >
                      ← Back to Sign In
                    </Link>
                  </div>
                </motion.div>

              ) : (
                /* ── FORM STATE ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Eyebrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ display: "block", width: 16, height: 1, background: "#C04A1A" }} />
                    <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C04A1A" }}>Account Recovery</span>
                  </div>

                  {/* Heading */}
                  <h1 style={{
                    fontFamily: "'Spectral', serif",
                    fontSize: "1.9rem",
                    fontWeight: 300,
                    color: "#1A1208",
                    lineHeight: 1.05,
                    marginBottom: 10,
                  }}>
                    Forgot your{" "}
                    <em style={{ fontStyle: "italic", fontWeight: 700, color: "#C04A1A" }}>password?</em>
                  </h1>

                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6E5A", lineHeight: 1.85, marginBottom: 28 }}>
                    Enter your email and we'll send you a secure reset link.
                  </p>

                  {/* Email field */}
                  <div style={{ marginBottom: isError ? 0 : 20 }}>
                    <label style={{
                      display: "block",
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: isError ? "#B91C1C" : focused ? "#C04A1A" : "#A0917E",
                      marginBottom: 6,
                      transition: "color 0.15s",
                    }}>
                      Email Address
                    </label>
                    <div style={{
                      display: "flex", alignItems: "center",
                      background: "#F5F0E8",
                      border: `1px solid ${isError ? "#DC2626" : focused ? "#C04A1A" : "#E0D8CA"}`,
                      borderLeft: `3px solid ${isError ? "#DC2626" : focused ? "#C04A1A" : "#D4C9B0"}`,
                      height: 46,
                      boxShadow: isError
                        ? "0 0 0 3px rgba(185,28,28,0.1)"
                        : focused
                        ? "0 0 0 3px rgba(192,74,26,0.1)"
                        : "none",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ padding: "0 12px", display: "flex", flexShrink: 0 }}>
                        <Mail size={14} color={isError ? "#DC2626" : focused ? "#C04A1A" : "#C0B0A0"} />
                      </span>
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="you@example.com"
                        style={{
                          flex: 1, height: "100%",
                          background: "transparent", border: "none", outline: "none",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 13, color: "#1A1208", caretColor: "#C04A1A",
                        }}
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {isError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 8,
                          padding: "10px 12px",
                          background: "#FEF2F2",
                          border: "1px solid #FCA5A5",
                          borderLeft: "3px solid #DC2626",
                          margin: "10px 0 0",
                        }}
                      >
                        <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#B91C1C" }}>
                          {errorMsg}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={isLoading || !email.trim()}
                    whileTap={!isLoading ? { x: 2, y: 2 } : {}}
                    style={{
                      width: "100%", height: 46, marginTop: 20,
                      background: isLoading ? "#A03A12" : "#C04A1A",
                      color: "#FAF7F0",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                      border: "none", cursor: isLoading ? "default" : "pointer",
                      boxShadow: "2px 2px 0 #8C3310",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", overflow: "hidden",
                      opacity: !email.trim() ? 0.55 : 1,
                      transition: "background 0.15s, opacity 0.15s",
                    }}
                  >
                    {/* Shine sweep */}
                    {!isLoading && (
                      <motion.span
                        style={{
                          position: "absolute", inset: 0,
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
                          backgroundSize: "200% 100%",
                        }}
                        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                      />
                    )}

                    {isLoading ? (
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "#FAF7F0", display: "block" }}
                            animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.13 }}
                          />
                        ))}
                      </span>
                    ) : (
                      "Send Reset Link →"
                    )}
                  </motion.button>

                  {/* Divider + Back link */}
                  <div style={{ height: 1, background: "#E0D8CA", margin: "24px 0" }} />
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Link
                      to="/login"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#A0917E", textDecoration: "none", transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.target.style.color = "#C04A1A"}
                      onMouseLeave={e => e.target.style.color = "#A0917E"}
                    >
                      ← Back to Sign In
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer note */}
          <motion.p
            variants={rise}
            style={{
              marginTop: 20,
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#C4B8A4",
              letterSpacing: "0.04em",
              lineHeight: 1.8,
            }}
          >
            Still having trouble?{" "}
            <a href="mailto:support@codeforge.dev" style={{ color: "#A0917E", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Contact support
            </a>
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}