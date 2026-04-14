import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import siamesImg from "@/assets/cats/siames.jpg";
import angoraImg from "@/assets/cats/angora.jpg";
import maineeImg from "@/assets/cats/mainee.jpg";

export interface CatProfile {
  id: string;
  name: string;
  breed: string;
  image: string;
}

export const availableCats: CatProfile[] = [
  { id: "siames", name: "Siamés", breed: "Siamés", image: siamesImg },
  { id: "angora", name: "Angora", breed: "Angora Turco", image: angoraImg },
  { id: "mainee", name: "Maine Coon", breed: "Maine Coon", image: maineeImg },
];

interface Meal {
  id: string;
  time: string;
  served: boolean;
  humidify: boolean;
}

interface FeedingContextType {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  feedNow: (humidify: boolean) => void;
  feedingInProgress: boolean;
  feedingComplete: boolean;
  nextMealTime: string | null;
  secondsUntilNext: number;
  mealsServedToday: number;
  totalMealsToday: number;
  selectedCat: CatProfile;
  setSelectedCatId: (id: string) => void;
  totalPortionsServed: number;
  cleaningAlert: boolean;
  dismissCleaningAlert: () => void;
  waterLevel: number;
  setWaterLevel: React.Dispatch<React.SetStateAction<number>>;
}

const FeedingContext = createContext<FeedingContextType | null>(null);

export const useFeedingContext = () => {
  const ctx = useContext(FeedingContext);
  if (!ctx) throw new Error("useFeedingContext must be used within FeedingProvider");
  return ctx;
};

const defaultMeals: Meal[] = [
  { id: "1", time: "07:00", served: false, humidify: false },
  { id: "2", time: "12:00", served: false, humidify: false },
  { id: "3", time: "18:00", served: false, humidify: false },
  { id: "4", time: "22:00", served: false, humidify: false },
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
      try {
        const parsed = JSON.parse(saved);
        // Migrate old meals without humidify
        return parsed.map((m: any) => ({ ...m, humidify: m.humidify ?? false }));
      } catch { /* ignore */ }
    }
    return defaultMeals;
  });

  const [feedingInProgress, setFeedingInProgress] = useState(false);
  const [feedingComplete, setFeedingComplete] = useState(false);
  const [secondsUntilNext, setSecondsUntilNext] = useState(0);

  const [selectedCatId, setSelectedCatId] = useState(() =>
    localStorage.getItem("catfeeder-cat") || "siames"
  );
  const selectedCat = availableCats.find(c => c.id === selectedCatId) || availableCats[0];

  const [totalPortionsServed, setTotalPortionsServed] = useState(() => {
    const saved = localStorage.getItem("catfeeder-portions");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [cleaningAlert, setCleaningAlert] = useState(false);

  const [waterLevel, setWaterLevel] = useState(() => {
    const saved = localStorage.getItem("catfeeder-water");
    return saved ? parseInt(saved, 10) : 78;
  });

  useEffect(() => {
    localStorage.setItem("catfeeder-meals", JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem("catfeeder-cat", selectedCatId);
  }, [selectedCatId]);

  useEffect(() => {
    localStorage.setItem("catfeeder-portions", String(totalPortionsServed));
  }, [totalPortionsServed]);

  useEffect(() => {
    localStorage.setItem("catfeeder-water", String(waterLevel));
  }, [waterLevel]);

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

  const feedNow = useCallback((humidify: boolean) => {
    if (feedingInProgress) return;
    setFeedingInProgress(true);
    setFeedingComplete(false);
    setTimeout(() => {
      setFeedingInProgress(false);
      setFeedingComplete(true);
      if (unservedMeals.length > 0) {
        setMeals(prev => prev.map(m => m.id === unservedMeals[0].id ? { ...m, served: true } : m));
      }
      const newTotal = totalPortionsServed + 1;
      setTotalPortionsServed(newTotal);
      // Reduce water slightly
      setWaterLevel(prev => Math.max(0, prev - 2));
      // Check cleaning alert
      if (newTotal % 25 === 0) {
        setCleaningAlert(true);
      }
      setTimeout(() => setFeedingComplete(false), 3000);
    }, 3000);
  }, [feedingInProgress, unservedMeals, totalPortionsServed]);

  const dismissCleaningAlert = useCallback(() => setCleaningAlert(false), []);

  const mealsServedToday = meals.filter(m => m.served).length;
  const totalMealsToday = meals.length;

  return (
    <FeedingContext.Provider value={{
      meals, setMeals, feedNow, feedingInProgress, feedingComplete,
      nextMealTime, secondsUntilNext, mealsServedToday, totalMealsToday,
      selectedCat, setSelectedCatId,
      totalPortionsServed, cleaningAlert, dismissCleaningAlert,
      waterLevel, setWaterLevel,
    }}>
      {children}
    </FeedingContext.Provider>
  );
};
