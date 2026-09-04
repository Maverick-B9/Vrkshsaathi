import { useState, useRef } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { claims } = useAuth();
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const [method,   setMethod]   = useState<"email" | "phone">("email");
  const [phone,    setPhone]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [step,     setStep]     = useState<"input" | "otp">("input");
  const [confirm,  setConfirm]  = useState<ConfirmationResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  function dashboardFor(role?: string) {
    if (role === "super_admin") return "/super-admin";
    if (role === "registrar")  return "/registrar";
    if (role === "ward_admin") return "/ward";
    return "/custodian";
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalEmail = formData.get("email") as string;
    const finalPassword = formData.get("password") as string;

    try {
      const userCred = await signInWithEmailAndPassword(auth, finalEmail, finalPassword);
      const token = await userCred.user.getIdTokenResult();
      navigate(dashboardFor(token.claims.role as string));
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const result = await signInWithPhoneNumber(auth, phone, verifierRef.current);
      setConfirm(result);
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Couldn't send OTP. Check the number and try again.");
      
      // If it fails, clear the verifier so we can try again
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm) return;
    setError(null);
    setLoading(true);
    try {
      const userCred = await confirm.confirm(otp);
      const token = await userCred.user.getIdTokenResult();
      navigate(dashboardFor(token.claims.role as string));
    } catch {
      setError("Incorrect OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-field-parchment flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Living Tag header */}
        <div className="bg-white rounded-tag shadow-tag p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            {/* Logo */}
            <img src="/logo.jpg" alt="VrkshSaathi" className="w-10 h-10 object-contain rounded-full border border-moss-canopy shadow-sm" />
            <span className="font-display text-xl tracking-[0.05em] text-moss-canopy font-semibold uppercase">
              VrkshSaathi
            </span>
          </div>

          <h1 className="font-display text-2xl text-ink-bark mb-1">Sign in</h1>
          <p className="font-sans text-sm text-slate-bark mb-6">
            For Registrars, Custodians, and Ward Admins
          </p>

          {/* Method toggle */}
          <div className="flex rounded-tag-inner overflow-hidden border border-field-parchment-dark mb-6">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMethod(m); setError(null); setStep("input"); }}
                className={`flex-1 py-2 text-sm font-sans font-medium transition-colors ${
                  method === m
                    ? "bg-moss-canopy text-white"
                    : "bg-transparent text-slate-bark"
                }`}
              >
                {m === "email" ? "Email" : "Phone OTP"}
              </button>
            ))}
          </div>

          {/* Email form */}
          {method === "email" && (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <div>
                <label className="block font-sans text-sm text-ink-bark mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username email"
                  className="w-full rounded-tag-inner border border-field-parchment-dark bg-field-parchment px-4 py-2.5 font-sans text-ink-bark placeholder:text-slate-bark focus:outline-none focus:ring-2 focus:ring-moss-canopy"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block font-sans text-sm text-ink-bark mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-tag-inner border border-field-parchment-dark bg-field-parchment px-4 py-2.5 font-sans text-ink-bark placeholder:text-slate-bark focus:outline-none focus:ring-2 focus:ring-moss-canopy"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="font-sans text-sm text-laterite-clay">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-moss-canopy text-white font-sans font-medium py-3 rounded-tag-inner disabled:opacity-60 active:scale-[0.98] transition-transform"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          {/* Phone OTP form */}
          {method === "phone" && step === "input" && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label className="block font-sans text-sm text-ink-bark mb-1" htmlFor="phone">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-tag-inner border border-field-parchment-dark bg-field-parchment px-4 py-2.5 font-sans text-ink-bark placeholder:text-slate-bark focus:outline-none focus:ring-2 focus:ring-moss-canopy"
                  placeholder="+91 98765 43210"
                />
              </div>
              {error && <p className="font-sans text-sm text-laterite-clay">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-moss-canopy text-white font-sans font-medium py-3 rounded-tag-inner disabled:opacity-60"
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>
            </form>
          )}

          {/* OTP verification */}
          {method === "phone" && step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <p className="font-sans text-sm text-slate-bark">
                Enter the 6-digit code sent to <strong className="text-ink-bark">{phone}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-tag-inner border border-field-parchment-dark bg-field-parchment px-4 py-2.5 font-mono text-center text-2xl tracking-[0.3em] text-ink-bark focus:outline-none focus:ring-2 focus:ring-moss-canopy"
                placeholder="──────"
              />
              {error && <p className="font-sans text-sm text-laterite-clay">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-moss-canopy text-white font-sans font-medium py-3 rounded-tag-inner disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
            </form>
          )}
        </div>

        <div id="recaptcha-container" />

        <p className="font-sans text-xs text-center text-slate-bark">
          Citizens don't need to sign in —{" "}
          <Link to="/" className="text-moss-canopy underline font-medium hover:text-moss-canopy-dark">
            scan a QR code to report
          </Link>
        </p>
      </div>
    </div>
  );
}
