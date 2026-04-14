import { useState } from "react";
import { useFeedingContext, availableCats } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Bell, Moon, Cat } from "lucide-react";

const SettingsPage = () => {
  const { setMeals, selectedCat, setSelectedCatId } = useFeedingContext();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const resetSchedule = () => {
    setMeals([
      { id: "1", time: "07:00", served: false, humidify: false },
      { id: "2", time: "12:00", served: false, humidify: false },
      { id: "3", time: "18:00", served: false, humidify: false },
      { id: "4", time: "22:00", served: false, humidify: false },
    ]);
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Ajustes</h2>
        <p className="text-muted-foreground">Administra las preferencias del alimentador</p>
      </div>

      {/* Cat Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Cat className="h-5 w-5 text-primary" /> Seleccionar gato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Elige el gato que será alimentado por el sistema</p>
          <div className="grid grid-cols-3 gap-3">
            {availableCats.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                  selectedCat.id === cat.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-heading font-semibold">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.breed}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Preferencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="notifications" className="cursor-pointer">
                <p className="font-medium">Notificaciones</p>
                <p className="text-sm text-muted-foreground">Recibir alertas antes de las comidas</p>
              </Label>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <Label htmlFor="darkmode" className="cursor-pointer">
                <p className="font-medium">Modo oscuro</p>
                <p className="text-sm text-muted-foreground">Cambiar al tema oscuro</p>
              </Label>
            </div>
            <Switch id="darkmode" checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={resetSchedule} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restablecer horario
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Esto restaurará el horario predeterminado de 4 comidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
