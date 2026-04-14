import { useState } from "react";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock } from "lucide-react";

const Schedule = () => {
  const { meals, setMeals } = useFeedingContext();
  const [newTime, setNewTime] = useState("12:00");

  const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time));

  const addMeal = () => {
    if (meals.length >= 8) return;
    const id = crypto.randomUUID();
    setMeals(prev => [...prev, { id, time: newTime, served: false }]);
  };

  const removeMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const updateMealTime = (id: string, time: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, time } : m));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Horario de alimentación</h2>
        <p className="text-muted-foreground">Configura los horarios de comida de tu gato</p>
      </div>

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
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent border-2 border-card shadow-md transition-all duration-500"
                  style={{ left: `${position}%` }}
                  title={meal.time}
                />
              );
            })}
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
                <p className="font-heading font-semibold">Comida {index + 1}</p>
                <p className="text-sm text-muted-foreground">
                  {meal.served ? "✅ Servida" : "⏳ Pendiente"}
                </p>
              </div>
              <Input
                type="time"
                value={meal.time}
                onChange={e => updateMealTime(meal.id, e.target.value)}
                className="w-32"
              />
              <Button variant="ghost" size="icon" onClick={() => removeMeal(meal.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {meals.length < 8 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <Input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-32"
            />
            <Button onClick={addMeal} variant="default" className="gap-2">
              <Plus className="h-4 w-4" /> Agregar comida
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Schedule;
