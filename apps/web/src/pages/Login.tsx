import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { defaultRouteForRole, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { theme, toggleTheme } = useTheme();

  if (user) return <Navigate to={defaultRouteForRole(user.role)} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Enter your email."); return; }
    if (!password)     { setError("Enter your password."); return; }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const stored = JSON.parse(localStorage.getItem("packetflow:user") ?? "null");
      navigate(defaultRouteForRole(stored?.role ?? "sender"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">

      {/* Theme toggle — top-right corner, always visible */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* ── Left: marketing panel ── */}
      <div className="hidden flex-col justify-between bg-foreground p-12 text-background lg:flex lg:w-1/2">
        {/* Logo follows the panel's foreground colour (text-background) */}
        <Logo className="h-10 w-auto text-background" />

        {/* Hero copy */}
        <div>
          <h1 className="font-bold text-5xl leading-tight xl:text-6xl">
            Logistics that<br />moves with you.
          </h1>
          <p className="mt-4 text-lg text-background/60">Send your packages across Skåne today.</p>

          {/* Step cards */}
          <div className="mt-12 grid grid-cols-3 gap-3">
            {[
              { n: "01", title: "Register", sub: "Create an account" },
              { n: "02", title: "Send", sub: "Create a package" },
              { n: "03", title: "Track", sub: "Follow it live" },
            ].map((step) => (
              <div key={step.n} className="rounded-xl bg-background/10 p-4">
                <div className="font-mono text-xs font-semibold text-background/40">{step.n}</div>
                <div className="mt-2 text-sm font-medium text-background">{step.title}</div>
                <div className="mt-0.5 text-xs text-background/50">{step.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-background/40">© {new Date().getFullYear()} PacketFlow</p>
      </div>

      {/* ── Right: sign-in card ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="mb-8 lg:hidden">
            <Logo className="h-9 w-auto" />
          </div>

          {/* Auth form card — ex-auth-form-card */}
          <div className="rounded-xl bg-muted p-6 shadow-card md:p-8">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back — enter your credentials to continue.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-background"
                />
              </div>

              {error && (
                <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {/* Sign-up links */}
            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-3 text-center text-xs text-muted-foreground">
                New to PacketFlow?
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/signup">Create account</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/work-with-us">Carrier sign up</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
