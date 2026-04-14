import { useState } from "react";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Utensils, CalendarClock, Zap, Droplets, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const Dashboard = () => {
  const {
    feedNow, feedingInProgress, feedingComplete,
    nextMealTime, secondsUntilNext, mealsServedToday, totalMealsToday,
    selectedCat, waterLevel, cleaningAlert, dismissCleaningAlert, totalPortionsServed,
  } = useFeedingContext();

  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [humidifyNow, setHumidifyNow] = useState(false);

  const progress = totalMealsToday > 0 ? (mealsServedToday / totalMealsToday) * 100 : 0;

  const handleFeedNow = () => {
    setShowFeedDialog(true);
    setHumidifyNow(false);
  };

  const confirmFeed = () => {
    setShowFeedDialog(false);
    feedNow(humidifyNow);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cleaning Alert */}
      {cleaningAlert && (
        <div className="bg-accent/20 border border-accent rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm">¡Hora de limpiar el plato!</p>
            <p className="text-xs text-muted-foreground">Se han servido {totalPortionsServed} porciones. Se recomienda limpiar el plato.</p>
          </div>
          <Button variant="outline" size="sm" onClick={dismissCleaningAlert}>Entendido</Button>
        </div>
      )}

      {/* Cat Profile */}
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30 mb-3">
          <img src={selectedCat.image} alt={selectedCat.name} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-heading font-bold">
          {feedingInProgress ? "Alimentando… 🍽️" :
            feedingComplete ? "Comida entregada 🐾" :
            `Hola, ${selectedCat.name} 🐾`}
        </h2>
        <p className="text-muted-foreground mt-1">
          {feedingInProgress ? "Dispensando comida ahora" :
            feedingComplete ? "¡Tu gato está feliz!" :
            "Tu gato está bien cuidado"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Próxima comida
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMealTime ? (
              <>
                <p className="text-3xl font-heading font-bold tabular-nums">
                  {formatTime(secondsUntilNext)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Programada a las {nextMealTime}
                </p>
              </>
            ) : (
              <p className="text-lg font-heading font-semibold text-success">¡Todas las comidas servidas! ✨</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Utensils className="h-4 w-4 text-accent" />
              Comidas de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading font-bold">
              {mealsServedToday}<span className="text-lg text-muted-foreground">/{totalMealsToday}</span>
            </p>
            <Progress value={progress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Nivel de agua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading font-bold">
              {waterLevel}<span className="text-lg text-muted-foreground">%</span>
            </p>
            <Progress value={waterLevel} className="mt-3 h-2" />
            {waterLevel < 20 && (
              <p className="text-xs text-destructive mt-1 font-medium">⚠️ Nivel bajo, rellenar pronto</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-success" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold text-success">En línea y listo</p>
            <p className="text-sm text-muted-foreground mt-1">Porciones totales: {totalPortionsServed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="feed"
          size="xl"
          className="flex-1"
          onClick={handleFeedNow}
          disabled={feedingInProgress}
        >
          {feedingInProgress ? (
            <span className="animate-pulse-soft">Alimentando…</span>
          ) : (
            <>🍽️ Alimentar ahora</>
          )}
        </Button>
        <Button variant="outline" size="xl" className="flex-1" asChild>
          <Link to="/schedule">📅 Editar horario</Link>
        </Button>
      </div>

      {/* Feed Now Dialog */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alimentar ahora</DialogTitle>
            <DialogDescription>¿Deseas servir una porción a {selectedCat.name}?</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 py-4">
            <Checkbox
              id="humidify-now"
              checked={humidifyNow}
              onCheckedChange={(c) => setHumidifyNow(c === true)}
            />
            <label htmlFor="humidify-now" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Humedecer esta porción
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedDialog(false)}>Cancelar</Button>
            <Button variant="feed" onClick={confirmFeed}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
