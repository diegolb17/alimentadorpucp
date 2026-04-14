import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Clock, CalendarClock, BarChart3, Settings } from "lucide-react";
import pucpLogo from "@/assets/pucp-logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/countdown", icon: Clock, label: "Cuenta regresiva" },
  { to: "/schedule", icon: CalendarClock, label: "Horario" },
  { to: "/progress", icon: BarChart3, label: "Progreso" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={pucpLogo} alt="PUCP Logo" className="h-8" />
          <div>
            <h1 className="text-lg font-heading font-bold leading-tight">Smart Cat Feeder</h1>
            <p className="text-xs text-muted-foreground">PUCP</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">Tu gato está bien cuidado 🐾</p>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      <nav className="border-t bg-card sticky bottom-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-around">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-3 px-2 text-xs transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
