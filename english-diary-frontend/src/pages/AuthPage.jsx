import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

const initialRegister = { name: "", email: "", password: "" };
const initialLogin = { email: "", password: "" };

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(loginForm);
      } else {
        await register(registerForm);
      }

      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const form = mode === "login" ? loginForm : registerForm;
  const setForm = mode === "login" ? setLoginForm : setRegisterForm;

  return (
    <div className="bloom-page bloom-page-auth relative min-h-screen overflow-hidden px-4 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,217,232,0.95),_transparent_28%),radial-gradient(circle_at_80%_15%,_rgba(255,238,207,0.85),_transparent_22%),linear-gradient(180deg,_#fffaf4_0%,_#fff7fb_45%,_#fbf4ff_100%)]" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[2.4rem] bg-linear-to-br from-blush-200 via-peach-100 to-lilac-100 p-8 text-plum-900 shadow-[0_30px_80px_rgba(170,112,141,0.18)] md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-rose-700/80">
              Soft, smart, consistent
            </p>
            <h1 className="mt-4 max-w-xl font-display text-6xl leading-none md:text-7xl">
              Turn your writing into a gentle English practice ritual.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-700">
              Move between diary entries and writing challenges, receive
              thoughtful corrections, and watch your confidence bloom over time.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Corrections with kind feedback",
              "Diary and challenge modes",
              "Dashboard with streak and growth",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.6rem] border border-white/70 bg-white/65 p-4 text-sm font-bold leading-6"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[2.4rem] border border-white/75 p-6 md:p-8">
          <div className="flex rounded-full bg-blush-100 p-1">
            {["login", "register"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setError("");
                }}
                className={[
                  "flex-1 rounded-full px-4 py-3 text-sm font-bold capitalize transition",
                  mode === option
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-ink-700",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink-700">
                  Your name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 outline-none ring-0 transition placeholder:text-ink-500 focus:border-rose-300"
                  placeholder="Luna"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink-700">
                Email
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 outline-none transition placeholder:text-ink-500 focus:border-rose-300"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink-700">
                Password
              </span>
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 outline-none transition placeholder:text-ink-500 focus:border-rose-300"
                placeholder="At least 6 characters"
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Saving your cozy corner..."
                : mode === "login"
                  ? "Enter Bloom Journal"
                  : "Create my account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export { AuthPage };
