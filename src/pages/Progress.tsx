import { useFeedingContext } from "@/context/FeedingContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

const ProgressPage = () => {
  const { meals, mealsServedToday, totalMealsToday } = useFeedingContext();
  const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time));
  const percentage = totalMealsToday > 0 ? Math.round((mealsServedToday / totalMealsToday) * 100) : 0;

  // SVG circular progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Daily Progress</h2>
        <p className="text-muted-foreground">Track today's feeding progress</p>
      </div>

      {/* Circular progress */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <circle
              cx="100" cy="100" r={radius} fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-heading font-bold">{mealsServedToday}</span>
            <span className="text-sm text-muted-foreground">of {totalMealsToday} meals</span>
          </div>
        </div>
      </div>

      <p className="text-center text-lg font-heading font-semibold">
        {percentage === 100 ? "All meals served today! ✨" :
          `${mealsServedToday} of ${totalMealsToday} meals served today`}
      </p>

      {/* Meal list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-body text-muted-foreground">Meal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedMeals.map((meal, i) => (
            <div key={meal.id} className="flex items-center gap-3 py-2">
              {meal.served ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">Meal {i + 1}</p>
                <p className="text-sm text-muted-foreground">{meal.time}</p>
              </div>
              <span className={`text-sm font-medium ${meal.served ? "text-success" : "text-muted-foreground"}`}>
                {meal.served ? "Served" : "Pending"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
