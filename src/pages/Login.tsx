import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import pucpLogo from "@/assets/pucp-logo.png";

type Tab = "login" | "register";

const LoginPage = () => {
  const { login, register, users, currentUser } = useFeedingContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  // Login fields
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate]);

  // --- Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUser.trim()) { setLoginError("Ingresa tu código PUCP"); return; }
    if (!loginPass) { setLoginError("Ingresa tu contraseña"); return; }

    setLoginLoading(true);
    try {
      const ok = await login(loginUser.trim(), loginPass);
      if (!ok) {
        setLoginError("Código o contraseña incorrectos");
      }
      // If ok, currentUser changes and useEffect redirects
    } catch {
      setLoginError("Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- Register ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regUser.trim()) { setRegError("Ingresa tu código PUCP"); return; }
    if (regUser.trim().length < 6) { setRegError("El código debe tener al menos 6 caracteres"); return; }
    if (!regName.trim()) { setRegError("Ingresa tu nombre"); return; }
    if (!regPass) { setRegError("Ingresa una contraseña"); return; }
    if (regPass.length < 4) { setRegError("La contraseña debe tener al menos 4 caracteres"); return; }
    if (regPass !== regConfirm) { setRegError("Las contraseñas no coinciden"); return; }

    setRegLoading(true);
    try {
      const ok = await register(regUser.trim(), regPass, regName.trim());
      if (!ok) {
        setRegError("Este código PUCP ya está registrado");
      }
      // If ok, auto-login and redirect
    } catch {
      setRegError("Error al registrarse");
    } finally {
      setRegLoading(false);
    }
  };

  // Quick-select existing user
  const handleQuickSelect = (user: string) => {
    setLoginUser(user);
    setLoginPass("");
    setLoginError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={pucpLogo} alt="PUCP" className="h-12 mx-auto mb-3" />
          <CardTitle className="text-2xl font-heading">Smart Cat Feeder</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Sistema de alimentación inteligente</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setTab("login")}
              className={cn(
                "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                tab === "login"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setTab("register")}
              className={cn(
                "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                tab === "register"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Registrarse
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-user">Código PUCP</Label>
                <Input
                  id="login-user"
                  placeholder="Ej: 20241234"
                  value={loginUser}
                  onChange={(e) => { setLoginUser(e.target.value); setLoginError(""); }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pass">Contraseña</Label>
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); setLoginError(""); }}
                />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-user">Código PUCP</Label>
                <Input
                  id="reg-user"
                  placeholder="Ej: 20241234"
                  value={regUser}
                  onChange={(e) => { setRegUser(e.target.value); setRegError(""); }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nombre</Label>
                <Input
                  id="reg-name"
                  placeholder="Ej: Diego López"
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setRegError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-pass">Contraseña</Label>
                <Input
                  id="reg-pass"
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={regPass}
                  onChange={(e) => { setRegPass(e.target.value); setRegError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={regConfirm}
                  onChange={(e) => { setRegConfirm(e.target.value); setRegError(""); }}
                />
              </div>
              {regError && <p className="text-sm text-destructive">{regError}</p>}
              <Button type="submit" className="w-full" disabled={regLoading}>
                {regLoading ? "Registrando..." : "Crear cuenta"}
              </Button>
            </form>
          )}

          {/* Quick-select existing users (login tab only) */}
          {tab === "login" && users.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Usuarios registrados:</p>
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <Button key={user} variant="outline" size="sm" onClick={() => handleQuickSelect(user)}>
                      {user}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
