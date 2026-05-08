import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { resetPassword } from "../services/api";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
`;

const stagger = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Shared layout wrapper ─────────────────────────── */
function PageShell({ children }) {
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
            position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)",
            width: 420, height: 320,
            background: "radial-gradient(ellipse, rgba(192,74,26,0.07) 0%, transparent 70%)",
            filter: "blur(32px)", pointerEvents: "none",
          }}
        />
        {children}
      </div>
    </>
  );
}

/* ── Logo row ─────────────────────────────────────── */
function LogoRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, background: "#C04A1A",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 #8C3310", flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, color: "#FAF7F0", fontSize: "0.9rem", fontStyle: "italic" }}>C</span>
        </div>
        <span style={{ fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", color: "#B0A390" }}>CodeForge</span>
      </Link>
    </div>
  );
}

/* ── Password strength bar ────────────────────────── */
function PasswordStrength({ password }) {
  const rules = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = rules.filter(r => r.test(password)).length;
  const levels = [
    { label: "Weak",   color: "#DC2626" },
    { label: "Fair",   color: "#D97706" },
    { label: "Good",   color: "#B45309" },
    { label: "Strong", color: "#059669" },
  ];
  if (!password) return null;
  const current = levels[score - 1] || levels[0];
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
        {levels.map((l, i) => (
          <div key={l.label} style={{ height: 2, flex: 1, background: i < score ? current.color : "#E0D8CA", transition: "background 0.3s" }} />
        ))}
      </div>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: current.color, letterSpacing: "0.04em" }}>
        {current.label} password
      </p>
    </motion.div>
  );
}

/* ── Field component ──────────────────────────────── */
function Field({ label, value, onChange, placeholder, type, rightIcon, isError, isFocused, onFocus, onBlur }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
        color: isError ? "#B91C1C" : isFocused ? "#C04A1A" : "#A0917E",
        marginBottom: 6, transition: "color 0.15s",
      }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        background: "#F5F0E8",
        border: `1px solid ${isError ? "#DC2626" : isFocused ? "#C04A1A" : "#E0D8CA"}`,
        borderLeft: `3px solid ${isError ? "#DC2626" : isFocused ? "#C04A1A" : "#D4C9B0"}`,
        height: 46,
        boxShadow: isError
          ? "0 0 0 3px rgba(185,28,28,0.1)"
          : isFocused
          ? "0 0 0 3px rgba(192,74,26,0.1)"
          : "none",
        transition: "all 0.15s",
      }}>
        <span style={{ padding: "0 12px", display: "flex", flexShrink: 0 }}>
          <Lock size={14} color={isError ? "#DC2626" : isFocused ? "#C04A1A" : "#C0B0A0"} />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{
            flex: 1, height: "100%",
            background: "transparent", border: "none", outline: "none",
            fontFamily: "'DM Mono', monospace",
            fontSize: 13, color: "#1A1208", caretColor: "#C04A1A",
          }}
        />
        {rightIcon && (
          <span style={{ padding: "0 12px", display: "flex", flexShrink: 0 }}>
            {rightIcon}
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   INVALID STATE — no token in URL
══════════════════════════════════════════════════════ */
function InvalidLinkScreen() {
  return (
    <PageShell>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}
      >
        <motion.div variants={rise}>
          <LogoRow />
        </motion.div>
        <motion.div
          variants={rise}
          style={{
            background: "#FAF7F0", border: "1px solid #E0D8CA",
            borderLeft: "4px solid #C04A1A",
            boxShadow: "4px 4px 0 #E0D8CA",
            padding: "40px 44px",
            textAlign: "center",
          }}
        >
          {/* Warning icon box */}
          <div style={{
            width: 52, height: 52,
            background: "#FEF2E8", border: "2px solid #C04A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#C04A1A" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h2 style={{ fontFamily: "'Spectral', serif", fontSize: "1.7rem", fontWeight: 600, color: "#1A1208", marginBottom: 10 }}>
            Invalid or expired link
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6E5A", lineHeight: 1.85, marginBottom: 28 }}>
            This password reset link is missing, invalid, or has already been used. Links expire after 10 minutes.
          </p>

          <div style={{ height: 1, background: "#E0D8CA", marginBottom: 20 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Link
              to="/forgot-password"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#C04A1A", textDecoration: "none",
              }}
            >
              Request a new reset link →
            </Link>
            <Link
              to="/login"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#A0917E", textDecoration: "none",
              }}
            >
              ← Back to Sign In
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </PageShell>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status,   setStatus]   = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const [focusPw,   setFocusPw]   = useState(false);
  const [focusConf, setFocusConf] = useState(false);

  /* Password match state */
  const passwordsMatch  = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  if (!token) return <InvalidLinkScreen />;

  async function handleSubmit() {
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await resetPassword(token, password);
      setStatus("success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";
  const isError   = status === "error";

  return (
    <PageShell>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}
      >
        <motion.div variants={rise}>
          <LogoRow />
        </motion.div>

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
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: "center" }}
              >
                <div style={{
                  width: 52, height: 52, background: "#3D8C5C",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px", boxShadow: "2px 2px 0 #2A6640",
                }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="#FAF7F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h2 style={{ fontFamily: "'Spectral', serif", fontSize: "1.7rem", fontWeight: 600, color: "#1A1208", marginBottom: 10 }}>
                  Password updated!
                </h2>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6E5A", lineHeight: 1.85, marginBottom: 24 }}>
                  Your password has been reset successfully.
                  <br />
                  <span style={{ color: "#C04A1A" }}>Redirecting you to sign in…</span>
                </p>

                {/* Animated redirect progress bar */}
                <div style={{ height: 2, background: "#E0D8CA", marginBottom: 20, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", background: "#C04A1A", width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "linear" }}
                  />
                </div>

                <Link
                  to="/login"
                  style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#C04A1A", textDecoration: "none",
                  }}
                >
                  Go to Sign In now →
                </Link>
              </motion.div>

            ) : (
              /* ── FORM STATE ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Eyebrow */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ display: "block", width: 16, height: 1, background: "#C04A1A" }} />
                  <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C04A1A" }}>New Password</span>
                </div>

                {/* Heading */}
                <h1 style={{
                  fontFamily: "'Spectral', serif", fontSize: "1.9rem", fontWeight: 300,
                  color: "#1A1208", lineHeight: 1.05, marginBottom: 10,
                }}>
                  Set a new{" "}
                  <em style={{ fontStyle: "italic", fontWeight: 700, color: "#C04A1A" }}>password.</em>
                </h1>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6E5A", lineHeight: 1.85, marginBottom: 28 }}>
                  Choose a strong password — at least 8 characters.
                </p>

                {/* New password */}
                <div style={{ marginBottom: 16 }}>
                  <Field
                    label="New Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    type={showPass ? "text" : "password"}
                    isError={isError && (password.length < 8)}
                    isFocused={focusPw}
                    onFocus={() => setFocusPw(true)}
                    onBlur={() => setFocusPw(false)}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        style={{ cursor: "pointer", background: "none", border: "none", padding: 0, color: "#C0B0A0", display: "flex" }}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: 20 }}>
                  <Field
                    label="Confirm Password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••••"
                    type={showPass ? "text" : "password"}
                    isError={passwordsMismatch}
                    isFocused={focusConf}
                    onFocus={() => setFocusConf(true)}
                    onBlur={() => setFocusConf(false)}
                    rightIcon={
                      passwordsMatch
                        ? <Check size={14} color="#059669" />
                        : null
                    }
                  />
                  <AnimatePresence>
                    {passwordsMismatch && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: 9, color: "#DC2626", marginTop: 4, letterSpacing: "0.04em" }}
                      >
                        Passwords do not match
                      </motion.p>
                    )}
                    {passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: 9, color: "#059669", marginTop: 4, letterSpacing: "0.04em" }}
                      >
                        Passwords match
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {isError && errorMsg && (
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
                        marginBottom: 16,
                      }}
                    >
                      <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#B91C1C" }}>
                        {errorMsg}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={isLoading || !password || !confirm}
                  whileTap={!isLoading ? { x: 2, y: 2 } : {}}
                  style={{
                    width: "100%", height: 46,
                    background: isLoading ? "#A03A12" : "#C04A1A",
                    color: "#FAF7F0",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                    border: "none",
                    cursor: isLoading || !password || !confirm ? "default" : "pointer",
                    boxShadow: "2px 2px 0 #8C3310",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", overflow: "hidden",
                    opacity: !password || !confirm ? 0.55 : 1,
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
                    "Set New Password →"
                  )}
                </motion.button>

                <div style={{ height: 1, background: "#E0D8CA", margin: "24px 0" }} />
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Link
                    to="/login"
                    style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 10,
                      letterSpacing: "0.1em", textTransform: "uppercase",
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
            marginTop: 20, textAlign: "center",
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: "#C4B8A4", letterSpacing: "0.04em", lineHeight: 1.8,
          }}
        >
          Link expired?{" "}
          <Link
            to="/forgot-password"
            style={{ color: "#A0917E", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Request a new one
          </Link>
        </motion.p>
      </motion.div>
    </PageShell>
  );
}