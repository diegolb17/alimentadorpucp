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
      {/* Status message */}
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">
          {feedingInProgress ? "Feeding in progress… 🍽️" :
            feedingComplete ? "Meal delivered 🐾" :
            "Everything is on schedule 🐾"}
        </h2>
        <p className="text-muted-foreground mt-1">
          {feedingInProgress ? "Dispensing food now" :
            feedingComplete ? "Your cat is happy!" :
            "Your cat is taken care of"}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Countdown card */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Next Meal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMealTime ? (
              <>
                <p className="text-3xl font-heading font-bold tabular-nums">
                  {formatTime(secondsUntilNext)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scheduled at {nextMealTime}
                </p>
              </>
            ) : (
              <p className="text-lg font-heading font-semibold text-success">All meals served today! ✨</p>
            )}
          </CardContent>
        </Card>

        {/* Progress card */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Utensils className="h-4 w-4 text-accent" />
              Today's Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading font-bold">
              {mealsServedToday}<span className="text-lg text-muted-foreground">/{totalMealsToday}</span>
            </p>
            <Progress value={progress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* Schedule card */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold">{totalMealsToday} meals per day</p>
            <Link to="/schedule" className="text-sm text-primary hover:underline mt-1 inline-block">
              Edit schedule →
            </Link>
          </CardContent>
        </Card>

        {/* Quick status */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-success" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold text-success">Online & Ready</p>
            <p className="text-sm text-muted-foreground mt-1">Feeder connected</p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="feed"
          size="xl"
          className="flex-1"
          onClick={feedNow}
          disabled={feedingInProgress}
        >
          {feedingInProgress ? (
            <span className="animate-pulse-soft">Feeding…</span>
          ) : (
            <>🍽️ Feed Now</>
          )}
        </Button>
        <Button variant="outline" size="xl" className="flex-1" asChild>
          <Link to="/schedule">📅 Edit Schedule</Link>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
