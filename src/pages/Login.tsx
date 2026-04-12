import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-10"
      >
        <h1 className="mb-1 text-center text-2xl font-semibold text-foreground">
          G&amp;S
        </h1>
        <p className="mb-8 text-center text-[13px] text-muted-foreground">
          Studio Operations
        </p>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-4 h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        {error && (
          <p className="mt-3 text-center text-[13px] text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
