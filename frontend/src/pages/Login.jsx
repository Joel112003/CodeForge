import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { loginUser } from "../services/api";
import useAuthStore from "../store/authStore";
import { showAuthSuccessToast, showAuthErrorToast } from "../utils/toastMessages";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import NoiseBackground from "../components/ui/NoiseBackground";
import { SkeletonFormRows } from "../components/ui/Skeleton";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
`;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  async function handleSubmit() {
    if (!form.email || !form.password)
      return setError("Please fill in all fields.");
    setLoading(true);
    try {
      const res = await loginUser(form);
      const csrfToken = res.data.csrfToken || res.data.csrf_token;
      setAuth(res.data.user, csrfToken);
      showAuthSuccessToast("login");
      navigate("/dashboard");
    } catch (err) {
      showAuthErrorToast(err, "Login failed");
      setError(
        err.response?.data?.message ||
        "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{FONTS}</style>
      <NoiseBackground />
      <div className="relative flex min-h-screen flex-col bg-[#F8F4ED] font-['DM_Mono']">
        <Navbar variant="public" />

        {/* ── RIGHT: FORM ── */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="w-full max-w-95"
          >
            {/* Issue tag */}
            <motion.div variants={rise} className="mb-10">
              <span className="inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.14em] text-[#C04A1A]">
                <span className="inline-block h-px w-5 align-middle bg-[#C04A1A]" />
                Authentication
              </span>
            </motion.div>

            {/* Heading */}
            <motion.div variants={rise} className="mb-9">
              <h2 className="font-['Spectral'] text-[clamp(2rem,7vw,2.8rem)] font-light leading-[1.05] text-[#1A1208]">
                Welcome
                <br />
                <span className="font-bold italic">back.</span>
              </h2>
              <p className="font-['DM_Mono'] text-[12px] tracking-[0.03em] text-[#A0917E]">
                No account?{" "}
                <Link
                  to="/register"
                  className="text-[#C04A1A] underline underline-offset-[3px]"
                >
                  Create one →
                </Link>
              </p>
            </motion.div>

            {/* Fields */}
            <SkeletonFormRows count={2} loading={false}>
              <motion.div variants={rise} className="mb-2 flex flex-col gap-4">
                <Input
                  name="email"
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  leftIcon={<Mail size={14} />}
                  error={error && !form.email ? "Required" : ""}
                />
                <Input
                  name="password"
                  type={showPw ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  leftIcon={<Lock size={14} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="flex cursor-pointer border-0 bg-transparent p-0 text-[#B0A090]"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                  error={error && !form.password ? "Required" : ""}
                />
              </motion.div>
            </SkeletonFormRows>

            {/* Forgot */}
            <motion.div variants={rise} className="mb-6 text-right">
              <Link
                to="/forgot-password"
                className="font-['DM_Mono'] text-[11px] tracking-[0.03em] text-[#A0917E]"
              >
                forgot password?
              </Link>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 flex items-start gap-2 border border-[#FCA5A5] border-l-[3px] border-l-[#DC2626] bg-[#FEF2F2] px-3.5 py-3"
                >
                  <AlertCircle
                    size={13}
                    className="shrink-0 text-[#DC2626]"
                  />
                  <p className="font-['DM_Mono'] text-[12px] text-[#B91C1C]">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div variants={rise}>
              <Button
                onClick={handleSubmit}
                loading={loading}
                size="lg"
                className="w-full"
                iconRight={!loading && <ArrowRight size={14} />}
              >
                {loading ? "Signing in" : "Sign in"}
              </Button>
            </motion.div>

            <motion.div variants={rise} className="mt-8 border-t border-[#E8E0D0] pt-6">
              <p className="text-center font-['DM_Mono'] text-[10px] leading-[1.8] tracking-[0.04em] text-[#C4B8A4]">
                By signing in you agree to our{" "}
                <span className="cursor-pointer underline text-[#A0917E]">
                  Terms
                </span>{" "}
                and{" "}
                <span className="cursor-pointer underline text-[#A0917E]">
                  Privacy Policy
                </span>
              </p>
            </motion.div>
            </motion.div>
        </div>
      </div>
    </>
  );
}
