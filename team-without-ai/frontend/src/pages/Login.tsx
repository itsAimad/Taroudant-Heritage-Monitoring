import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Shield, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import bgImage from "@/assets/taroudant-walls.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Email ou mot de passe invalide");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card rounded-lg border shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center rounded-lg bg-accent p-3 mb-4">
              <Shield className="h-8 w-8 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Taroudant Heritage Shield</h1>
            <p className="text-sm text-muted-foreground mt-1">Système de surveillance du patrimoine</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Se connecter
            </Button>
          </form>

      <div className="mt-6 p-4 rounded-md bg-secondary">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Connexion réelle (JWT) :</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Les comptes sont dans la base MySQL (`UTILISATEUR`).</p>
          <p className="text-muted-foreground/60 mt-1">
            Pour tester rapidement : crée un compte via `POST /auth/register` (nom, email, password, role).
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
