import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface Meal {
  id: string;
  time: string; // HH:mm
  served: boolean;
}

interface FeedingContextType {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  feedNow: () => void;
  feedingInProgress: boolean;
  feedingComplete: boolean;
  nextMealTime: string | null;
  secondsUntilNext: number;
  mealsServedToday: number;
  totalMealsToday: number;
}

const FeedingContext = createContext<FeedingContextType | null>(null);

export const useFeedingContext = () => {
  const ctx = useContext(FeedingContext);
  if (!ctx) throw new Error("useFeedingContext must be used within FeedingProvider");
  return ctx;
};

const defaultMeals: Meal[] = [
  { id: "1", time: "07:00", served: false },
  { id: "2", time: "12:00", served: false },
  { id: "3", time: "18:00", served: false },
  { id: "4", time: "22:00", served: false },
];

function getSecondsUntil(timeStr: string): number {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) return Infinity;
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

export const FeedingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem("catfeeder-meals");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return defaultMeals;
  });
  const [feedingInProgress, setFeedingInProgress] = useState(false);
  const [feedingComplete, setFeedingComplete] = useState(false);
  const [secondsUntilNext, setSecondsUntilNext] = useState(0);

  useEffect(() => {
    localStorage.setItem("catfeeder-meals", JSON.stringify(meals));
  }, [meals]);

  // Auto-mark past meals as served
  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    setMeals(prev => prev.map(meal => {
      const [h, m] = meal.time.split(":").map(Number);
      const mealMinutes = h * 60 + m;
      return mealMinutes <= currentMinutes ? { ...meal, served: true } : meal;
    }));
  }, []);

  // Reset at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
        setMeals(prev => prev.map(m => ({ ...m, served: false })));
      }
    }, 1000);
    return () => clearInterval(checkMidnight);
  }, []);

  const unservedMeals = meals.filter(m => !m.served).sort((a, b) => a.time.localeCompare(b.time));
  const nextMealTime = unservedMeals.length > 0 ? unservedMeals[0].time : null;

  useEffect(() => {
    const tick = setInterval(() => {
      if (nextMealTime) {
        const s = getSecondsUntil(nextMealTime);
        setSecondsUntilNext(s === Infinity ? 0 : s);
      } else {
        setSecondsUntilNext(0);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [nextMealTime]);

  const feedNow = useCallback(() => {
    if (feedingInProgress) return;
    setFeedingInProgress(true);
    setFeedingComplete(false);
    setTimeout(() => {
      setFeedingInProgress(false);
      setFeedingComplete(true);
      if (unservedMeals.length > 0) {
        setMeals(prev => prev.map(m => m.id === unservedMeals[0].id ? { ...m, served: true } : m));
      }
      setTimeout(() => setFeedingComplete(false), 3000);
    }, 3000);
  }, [feedingInProgress, unservedMeals]);

  const mealsServedToday = meals.filter(m => m.served).length;
  const totalMealsToday = meals.length;

  return (
    <FeedingContext.Provider value={{
      meals, setMeals, feedNow, feedingInProgress, feedingComplete,
      nextMealTime, secondsUntilNext, mealsServedToday, totalMealsToday,
    }}>
      {children}
    </FeedingContext.Provider>
  );
};
