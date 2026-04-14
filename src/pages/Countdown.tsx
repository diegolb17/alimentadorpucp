import { useState } from "react";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplets } from "lucide-react";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const Countdown = () => {
  const { nextMealTime, secondsUntilNext, feedNow, feedingInProgress, feedingComplete } = useFeedingContext();
  const [humidify, setHumidify] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
      {feedingInProgress ? (
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse-soft">🍽️</div>
          <h2 className="text-3xl font-heading font-bold">Alimentando…</h2>
          <p className="text-muted-foreground">Dispensando comida ahora</p>
        </div>
      ) : feedingComplete ? (
        <div className="text-center space-y-4">
          <div className="text-6xl">🐾</div>
          <h2 className="text-3xl font-heading font-bold text-success">¡Comida entregada!</h2>
          <p className="text-muted-foreground">Tu gato está feliz y alimentado</p>
        </div>
      ) : nextMealTime ? (
        <div className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">Próxima comida en</p>
          <div className="text-7xl md:text-8xl font-heading font-extrabold tabular-nums tracking-tight">
            {formatTime(secondsUntilNext)}
          </div>
          <p className="text-muted-foreground">
            Programada a las <span className="font-semibold text-foreground">{nextMealTime}</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <Checkbox checked={humidify} onCheckedChange={(c) => setHumidify(c === true)} id="humidify-countdown" />
            <label htmlFor="humidify-countdown" className="text-sm flex items-center gap-1 cursor-pointer">
              <Droplets className="h-4 w-4 text-primary" /> Humedecer porción
            </label>
          </div>
          <Button variant="feed" size="xl" onClick={() => feedNow(humidify)} className="mt-4">
            🍽️ Alimentar ahora
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-6xl">✨</div>
          <h2 className="text-3xl font-heading font-bold text-success">¡Listo por hoy!</h2>
          <p className="text-muted-foreground">Todas las comidas fueron servidas. ¡Nos vemos mañana!</p>
        </div>
      )}
    </div>
  );
};

export default Countdown;
