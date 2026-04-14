import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Utensils, CalendarClock, Zap } from "lucide-react";
import { Link } from "react-router-dom";

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
  } = useFeedingContext();

  const progress = totalMealsToday > 0 ? (mealsServedToday / totalMealsToday) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">
          {feedingInProgress ? "Alimentando… 🍽️" :
            feedingComplete ? "Comida entregada 🐾" :
            "Todo está en orden 🐾"}
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
              <CalendarClock className="h-4 w-4 text-primary" />
              Horario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold">{totalMealsToday} comidas por día</p>
            <Link to="/schedule" className="text-sm text-primary hover:underline mt-1 inline-block">
              Editar horario →
            </Link>
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
            <p className="text-sm text-muted-foreground mt-1">Alimentador conectado</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="feed"
          size="xl"
          className="flex-1"
          onClick={feedNow}
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
    </div>
  );
};

export default Dashboard;
