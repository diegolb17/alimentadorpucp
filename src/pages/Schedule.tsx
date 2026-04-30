import { useState } from "react";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Clock, Droplets, Loader2, Weight } from "lucide-react";

const PORTION_OPTIONS = [12, 24, 36, 48, 60];

const Schedule = () => {
  const { meals, setMeals, addSchedule, deleteSchedule, loadingSchedules, schedulesError } = useFeedingContext();
  const [newTime, setNewTime] = useState("12:00");
  const [newHumidify, setNewHumidify] = useState(false);
  const [newPortions, setNewPortions] = useState(24);
  const [addingMeal, setAddingMeal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time));

  const addMeal = async () => {
    if (meals.length >= 8) return;
    setAddingMeal(true);
    try {
      await addSchedule(newTime, newHumidify, newPortions);
      // Resetear formulario
      setNewTime("12:00");
      setNewHumidify(false);
      setNewPortions(24);
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setAddingMeal(false);
    }
  };

  const removeMeal = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSchedule(id);
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setDeletingId(null);
    }
  };

  const updateMealTime = (id: string, time: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, time } : m));
  };

  const toggleHumidify = (id: string, checked: boolean) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, humidify: checked } : m));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Horario de alimentación</h2>
        <p className="text-muted-foreground">Configura los horarios de comida de tu gato</p>
      </div>

      {schedulesError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-destructive font-medium">Error al cargar horarios</span>
          </div>
          <p className="text-sm text-destructive">{schedulesError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Mostrando horarios guardados localmente. Intenta recargar la página.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-body text-muted-foreground">Línea de tiempo diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex">
              {hours.filter(h => h % 6 === 0).map(h => (
                <div
                  key={h}
                  className="absolute h-full border-l border-border/50"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  <span className="text-[10px] text-muted-foreground ml-1">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>
            {sortedMeals.map(meal => {
              const [h, m] = meal.time.split(":").map(Number);
              const position = ((h * 60 + m) / (24 * 60)) * 100;
              return (
                <div
                  key={meal.id}
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow-md transition-all duration-500 ${
                    meal.humidify ? "bg-primary" : "bg-accent"
                  }`}
                  style={{ left: `${position}%` }}
                  title={`${meal.time}${meal.humidify ? " 💧" : ""}`}
                />
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent inline-block" /> Normal</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Humedecida</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sortedMeals.map((meal, index) => (
          <Card key={meal.id} className="card-hover animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-semibold">Comida {index + 1} — {meal.portions}g</p>
                <p className="text-sm text-muted-foreground">
                  {meal.served ? "✅ Servida" : "⏳ Pendiente"}
                  {meal.humidify && " 💧"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={meal.humidify}
                  onCheckedChange={(c) => toggleHumidify(meal.id, c === true)}
                />
                <Droplets className="h-4 w-4 text-primary" />
              </div>
              <Input
                type="time"
                value={meal.time}
                onChange={e => updateMealTime(meal.id, e.target.value)}
                className="w-32"
              />
              <Button variant="ghost" size="icon" onClick={() => removeMeal(meal.id)} disabled={deletingId === meal.id || loadingSchedules}>
                {deletingId === meal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {meals.length < 8 && (
        <Card className="border-dashed">
          <CardContent className="space-y-4 py-4">
            {/* Fila superior: hora + humidificar + botón */}
            <div className="flex items-center gap-4">
              <Input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-32"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newHumidify}
                  onCheckedChange={(c) => setNewHumidify(c === true)}
                />
                <label className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
                  <Droplets className="h-4 w-4 text-primary" /> Humedecer
                </label>
              </div>
              <Button onClick={addMeal} variant="default" className="gap-2 ml-auto" disabled={addingMeal || loadingSchedules}>
                {addingMeal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {addingMeal ? "Agregando..." : "Agregar comida"}
              </Button>
            </div>

            {/* Selector de porciones */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Weight className="h-4 w-4" />
                <span>Porción por comida</span>
              </div>
              <div className="flex gap-1.5">
                {PORTION_OPTIONS.map(grams => (
                  <button
                    key={grams}
                    type="button"
                    onClick={() => setNewPortions(grams)}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                      newPortions === grams
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {grams}g
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Porción: <span className="font-semibold text-foreground">{newPortions}g</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Schedule;
