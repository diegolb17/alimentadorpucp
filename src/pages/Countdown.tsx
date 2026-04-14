import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const Countdown = () => {
  const { nextMealTime, secondsUntilNext, feedNow, feedingInProgress, feedingComplete } = useFeedingContext();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
      {feedingInProgress ? (
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse-soft">🍽️</div>
          <h2 className="text-3xl font-heading font-bold">Feeding in progress…</h2>
          <p className="text-muted-foreground">Dispensing food now</p>
        </div>
      ) : feedingComplete ? (
        <div className="text-center space-y-4">
          <div className="text-6xl">🐾</div>
          <h2 className="text-3xl font-heading font-bold text-success">Meal delivered!</h2>
          <p className="text-muted-foreground">Your cat is happy and fed</p>
        </div>
      ) : nextMealTime ? (
        <div className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">Next meal in</p>
          <div className="text-7xl md:text-8xl font-heading font-extrabold tabular-nums tracking-tight">
            {formatTime(secondsUntilNext)}
          </div>
          <p className="text-muted-foreground">
            Scheduled at <span className="font-semibold text-foreground">{nextMealTime}</span>
          </p>
          <Button variant="feed" size="xl" onClick={feedNow} className="mt-4">
            🍽️ Feed Now
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-6xl">✨</div>
          <h2 className="text-3xl font-heading font-bold text-success">All done for today!</h2>
          <p className="text-muted-foreground">All meals have been served. See you tomorrow!</p>
        </div>
      )}
    </div>
  );
};

export default Countdown;
