import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultRouteForRole, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";

export default function SignUp() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"sender" | "recipient">("sender");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { theme, toggleTheme } = useTheme();

  if (user) return <Navigate to={defaultRouteForRole(user.role)} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Enter your name."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email."); return;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast({ title: "Account created", description: "You are now signed in." });
      navigate(defaultRouteForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">

      {/* Theme toggle — top-right corner */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8">
          <img
            src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="PacketFlow"
            width="146"
            height="42"
            className="h-9 w-auto"
          />
        </div>

        {/* Auth form card — ex-auth-form-card */}
        <div className="rounded-xl bg-muted p-6 shadow-card md:p-8">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join PacketFlow to start sending or tracking packages.</p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="su-name" className="text-xs font-medium text-muted-foreground">Full name</Label>
              <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-role" className="text-xs font-medium text-muted-foreground">I am a</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "sender" | "recipient")}>
                <SelectTrigger id="su-role" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">Sender — ship packages</SelectItem>
                  <SelectItem value="recipient">Recipient — track deliveries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pass" className="text-xs font-medium text-muted-foreground">Password</Label>
              <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-confirm" className="text-xs font-medium text-muted-foreground">Confirm password</Label>
              <Input id="su-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-phone" className="text-xs font-medium text-muted-foreground">Phone (optional)</Label>
              <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-address" className="text-xs font-medium text-muted-foreground">Address (optional)</Label>
              <Input id="su-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" className="bg-background" />
            </div>

            {error && (
              <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
