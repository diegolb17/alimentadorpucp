import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import siamesImg from "@/assets/cats/siames.jpg";
import angoraImg from "@/assets/cats/angora.jpg";
import maineeImg from "@/assets/cats/mainee.jpg";
import { toast } from "@/hooks/use-toast";
import { FeedingRecord, AnalysisRecord } from "@/types/feeding";
import {
  getActiveUser, setActiveUser,
  getRegisteredUsers, registerUser, verifyPassword,
  getUserData, setUserData,
  migrateLegacyData, hasLegacyData,
  getUserDisplayName, setUserDisplayName,
} from "@/utils/userStorage";
import { generateHistoryTxt } from "@/utils/exportHistory";

const FLASK_SERVER_URL = import.meta.env.VITE_FLASK_SERVER_URL || "http://diego.local:5000";

interface ScheduleResponse {
  id: string;
  time: string;
  portions?: number;
}

export interface CatProfile {
  id: string;
  name: string;
  breed: string;
  image: string;
  characteristics?: string;
}

export const availableCats: CatProfile[] = [
  { id: "siames", name: "Siamés", breed: "Siamés", image: siamesImg, characteristics: "" },
  { id: "angora", name: "Angora", breed: "Angora Turco", image: angoraImg, characteristics: "" },
  { id: "mainee", name: "Maine Coon", breed: "Maine Coon", image: maineeImg, characteristics: "" },
];

interface Meal {
  id: string;
  time: string;
  served: boolean;
  humidify: boolean;
  portions: number;
}

interface FeedingContextType {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  feedNow: (humidify: boolean, portions?: number) => void;
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
  loadingSchedules: boolean;
  schedulesError: string | null;
  addSchedule: (time: string, humidify?: boolean, portions?: number) => Promise<Meal>;
  deleteSchedule: (id: string) => Promise<void>;
  // Nuevos campos de usuario
  currentUser: string | null;
  displayName: string;
  users: string[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  feedingHistory: FeedingRecord[];
  analysisHistory: AnalysisRecord[];
  addAnalysisRecord: (record: AnalysisRecord) => void;
  exportHistoryAsText: () => string;
  customCats: CatProfile[];
  allCats: CatProfile[];
  addCustomCat: (cat: CatProfile) => void;
  deleteCustomCat: (id: string) => void;
  hiddenCatIds: string[];
  hideCat: (id: string) => void;
  unhideCat: (id: string) => void;
}

const FeedingContext = createContext<FeedingContextType | null>(null);

export const useFeedingContext = () => {
  const ctx = useContext(FeedingContext);
  if (!ctx) throw new Error("useFeedingContext must be used within FeedingProvider");
  return ctx;
};

const defaultMeals: Meal[] = [
  { id: "1", time: "07:00", served: false, humidify: false, portions: 24 },
  { id: "2", time: "12:00", served: false, humidify: false, portions: 24 },
  { id: "3", time: "18:00", served: false, humidify: false, portions: 24 },
  { id: "4", time: "22:00", served: false, humidify: false, portions: 24 },
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
  // --- User state ---
  const [currentUser, setCurrentUserState] = useState<string | null>(() => getActiveUser());
  const [displayName, setDisplayNameState] = useState<string>(() => {
    const user = getActiveUser();
    return user ? getUserDisplayName(user) || user : "";
  });
  const [users, setUsers] = useState<string[]>(() => getRegisteredUsers());

  // --- Feeding state ---
  const [meals, setMeals] = useState<Meal[]>([]);
  const [feedingInProgress, setFeedingInProgress] = useState(false);
  const [feedingComplete, setFeedingComplete] = useState(false);
  const [secondsUntilNext, setSecondsUntilNext] = useState(0);

  const [selectedCatId, setSelectedCatIdInternal] = useState<string>("siames");
  // --- Custom cats ---
  const [customCats, setCustomCats] = useState<CatProfile[]>([]);
  const [hiddenCatIds, setHiddenCatIds] = useState<string[]>([]);
  const allCats = [...availableCats, ...customCats].filter(c => !hiddenCatIds.includes(c.id));
  const selectedCat = allCats.find(c => c.id === selectedCatId) || allCats[0];

  const [totalPortionsServed, setTotalPortionsServed] = useState(0);
  const [cleaningAlert, setCleaningAlert] = useState(false);
  const [waterLevel, setWaterLevel] = useState(78);

  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // --- History state ---
  const [feedingHistory, setFeedingHistory] = useState<FeedingRecord[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);

  // --- Helpers ---

  const saveCurrentUserState = useCallback(() => {
    if (!currentUser) return;
    setUserData(currentUser, "meals", meals);
    setUserData(currentUser, "cat", selectedCatId);
    setUserData(currentUser, "portions-total", totalPortionsServed);
    setUserData(currentUser, "water", waterLevel);
    setUserData(currentUser, "history", feedingHistory);
    setUserData(currentUser, "analyses", analysisHistory);
    setUserData(currentUser, "custom-cats", customCats);
    setUserData(currentUser, "hidden-cats", hiddenCatIds);
  }, [currentUser, meals, selectedCatId, totalPortionsServed, waterLevel, feedingHistory, analysisHistory, customCats, hiddenCatIds]);

  const loadUserData = useCallback((username: string) => {
    // Migrate legacy data if needed (first-time use)
    if (hasLegacyData()) {
      migrateLegacyData(username);
    }

    const savedMeals = getUserData<Meal[]>(username, "meals", defaultMeals);
    const savedCat = getUserData<string>(username, "cat", "siames");
    const savedPortions = getUserData<number>(username, "portions-total", 0);
    const savedWater = getUserData<number>(username, "water", 78);
    const savedHistory = getUserData<FeedingRecord[]>(username, "history", []);
    const savedAnalyses = getUserData<AnalysisRecord[]>(username, "analyses", []);

    setMeals(savedMeals.map(m => ({ ...m, served: false })));
    setSelectedCatIdInternal(savedCat);
    setTotalPortionsServed(savedPortions);
    setWaterLevel(savedWater);
    setFeedingHistory(savedHistory);
    setAnalysisHistory(savedAnalyses);
    const savedCustomCats = getUserData<CatProfile[]>(username, "custom-cats", []);
    setCustomCats(savedCustomCats);
    const savedHiddenCats = getUserData<string[]>(username, "hidden-cats", []);
    setHiddenCatIds(savedHiddenCats);
    setSchedulesError(null);
  }, []);

  // --- Login / Logout ---

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !password) return false;

    // Verify password
    const valid = await verifyPassword(trimmed, password);
    if (!valid) return false;

    // Save current user's state before switching
    if (currentUser) {
      saveCurrentUserState();
    }

    setActiveUser(trimmed);
    setCurrentUserState(trimmed);
    setDisplayNameState(getUserDisplayName(trimmed) || trimmed);

    // Reset transient states
    setFeedingInProgress(false);
    setFeedingComplete(false);
    setCleaningAlert(false);

    // Load user's data
    loadUserData(trimmed);
    return true;
  }, [currentUser, saveCurrentUserState, loadUserData]);

  const register = useCallback(async (username: string, password: string, displayName?: string): Promise<boolean> => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !password) return false;

    const created = await registerUser(trimmed, password, displayName);
    if (!created) return false;

    setUsers(prev => [...prev, trimmed]);

    // Auto-login after register
    if (currentUser) {
      saveCurrentUserState();
    }

    setActiveUser(trimmed);
    setCurrentUserState(trimmed);
    if (displayName) setDisplayNameState(displayName);
    setFeedingInProgress(false);
    setFeedingComplete(false);
    setCleaningAlert(false);
    loadUserData(trimmed);
    return true;
  }, [currentUser, saveCurrentUserState, loadUserData]);

  const logout = useCallback(() => {
    if (currentUser) {
      saveCurrentUserState();
    }
    setActiveUser(null);
    setCurrentUserState(null);
    setMeals([]);
    setSelectedCatIdInternal("siames");
    setTotalPortionsServed(0);
    setWaterLevel(78);
    setFeedingHistory([]);
    setAnalysisHistory([]);
    setFeedingInProgress(false);
    setFeedingComplete(false);
    setCleaningAlert(false);
    setHiddenCatIds([]);
  }, [currentUser, saveCurrentUserState]);

  // Load user data on mount if already logged in
  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- setSelectedCatId wrapper ---
  const setSelectedCatId = useCallback((id: string) => {
    setSelectedCatIdInternal(id);
  }, []);

  // --- Schedules ---

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    setSchedulesError(null);
    try {
      const response = await fetch(`${FLASK_SERVER_URL}/schedules`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const schedules: ScheduleResponse[] = await response.json();

      const mealsFromBackend: Meal[] = schedules.map(schedule => ({
        id: schedule.id,
        time: schedule.time,
        served: false,
        humidify: false,
        portions: schedule.portions ?? 24,
      }));

      // Cargar humidify desde user-scoped storage
      const humidifyMap = currentUser ? getUserData<Record<string, boolean>>(currentUser, "humidify-map", {}) : {};
      mealsFromBackend.forEach(meal => {
        if (humidifyMap[meal.id] !== undefined) {
          meal.humidify = humidifyMap[meal.id];
        }
      });

      // Cargar portions desde user-scoped storage
      const portionsMap = currentUser ? getUserData<Record<string, number>>(currentUser, "portions-map", {}) : {};
      mealsFromBackend.forEach(meal => {
        if (portionsMap[meal.id] !== undefined) {
          meal.portions = portionsMap[meal.id];
        }
      });

      setMeals(mealsFromBackend);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setSchedulesError(error instanceof Error ? error.message : 'Error desconocido');
      // Fallback a meals ya cargados
    } finally {
      setLoadingSchedules(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = useCallback(async (time: string, humidify: boolean = false, portions: number = 24) => {
    try {
      const response = await fetch(`${FLASK_SERVER_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, portions, humidify }),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const newSchedule: ScheduleResponse = await response.json();

      const newMeal: Meal = {
        id: newSchedule.id,
        time: newSchedule.time,
        served: false,
        humidify,
        portions: newSchedule.portions ?? portions,
      };

      setMeals(prev => [...prev, newMeal]);

      // Guardar humidify en user-scoped storage
      if (currentUser) {
        const hMap = getUserData<Record<string, boolean>>(currentUser, "humidify-map", {});
        hMap[newMeal.id] = humidify;
        setUserData(currentUser, "humidify-map", hMap);

        const pMap = getUserData<Record<string, number>>(currentUser, "portions-map", {});
        pMap[newMeal.id] = newMeal.portions;
        setUserData(currentUser, "portions-map", pMap);
      }

      toast({
        title: "Horario agregado",
        description: `Comida programada a las ${time} — ${newMeal.portions}g`,
      });

      return newMeal;
    } catch (error) {
      console.error('Error al agregar horario:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el horario. Verifica la conexión.",
        variant: "destructive",
      });
      throw error;
    }
  }, [currentUser]);

  const deleteSchedule = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${FLASK_SERVER_URL}/schedules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setMeals(prev => prev.filter(m => m.id !== id));

      // Eliminar de user-scoped storage
      if (currentUser) {
        const hMap = getUserData<Record<string, boolean>>(currentUser, "humidify-map", {});
        delete hMap[id];
        setUserData(currentUser, "humidify-map", hMap);

        const pMap = getUserData<Record<string, number>>(currentUser, "portions-map", {});
        delete pMap[id];
        setUserData(currentUser, "portions-map", pMap);
      }

      toast({
        title: "Horario eliminado",
        description: "El horario ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario. Verifica la conexión.",
        variant: "destructive",
      });
      throw error;
    }
  }, [currentUser]);

  // --- Persistence effects ---

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "meals", meals);
    }
  }, [meals, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "cat", selectedCatId);
    }
  }, [selectedCatId, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "portions-total", totalPortionsServed);
    }
  }, [totalPortionsServed, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "water", waterLevel);
    }
  }, [waterLevel, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "history", feedingHistory);
    }
  }, [feedingHistory, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "analyses", analysisHistory);
    }
  }, [analysisHistory, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "custom-cats", customCats);
    }
  }, [customCats, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser, "hidden-cats", hiddenCatIds);
    }
  }, [hiddenCatIds, currentUser]);

  // --- Auto-mark past meals as served ---
  useEffect(() => {
    const markPastMealsAsServed = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      setMeals(prev => prev.map(meal => {
        const [h, m] = meal.time.split(":").map(Number);
        const mealMinutes = h * 60 + m;
        return mealMinutes <= currentMinutes ? { ...meal, served: true } : meal;
      }));
    };

    markPastMealsAsServed();
    const interval = setInterval(markPastMealsAsServed, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Reset at midnight ---
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
        setMeals(prev => prev.map(m => ({ ...m, served: false })));
      }
    }, 1000);
    return () => clearInterval(checkMidnight);
  }, []);

  // --- Derived state ---
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

  // --- feedNow ---
  const feedNow = useCallback(async (humidify: boolean, portions?: number) => {
    if (feedingInProgress) return;
    setFeedingInProgress(true);
    setFeedingComplete(false);

    try {
      const portionGrams = portions ?? (unservedMeals.length > 0 ? unservedMeals[0].portions : 24);
      const response = await fetch(`${FLASK_SERVER_URL}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portions: portionGrams, humidify }),
      });
      if (!response.ok) {
        throw new Error(`Error activando motor: ${response.status}`);
      }

      setFeedingInProgress(false);
      setFeedingComplete(true);

      // Marcar próxima comida como servida
      if (unservedMeals.length > 0) {
        setMeals(prev => prev.map(m => m.id === unservedMeals[0].id ? { ...m, served: true } : m));
      }

      // Incrementar contador de porciones
      const newTotal = totalPortionsServed + 1;
      setTotalPortionsServed(newTotal);

      // Reducir nivel de agua
      setWaterLevel(prev => Math.max(0, prev - 2));

      // Verificar alerta de limpieza
      if (newTotal % 25 === 0) {
        setCleaningAlert(true);
      }

      // Registrar en historial
      const record: FeedingRecord = {
        id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        grams: portionGrams,
        humidify,
        source: "manual",
      };
      setFeedingHistory(prev => [...prev, record]);

      // Ocultar estado de completado después de 3 segundos
      setTimeout(() => setFeedingComplete(false), 3000);

      toast({
        title: "Alimentación exitosa",
        description: `Se ha servido ${portionGrams}g de comida.`,
      });
    } catch (error) {
      setFeedingInProgress(false);
      console.error("Error en feedNow:", error);
      toast({
        title: "Error de comunicación",
        description: "No se pudo controlar el alimentador. Verifica la conexión.",
        variant: "destructive",
      });
    }
  }, [feedingInProgress, unservedMeals, totalPortionsServed]);

  const dismissCleaningAlert = useCallback(() => setCleaningAlert(false), []);

  // --- History functions ---
  const addAnalysisRecord = useCallback((record: AnalysisRecord) => {
    setAnalysisHistory(prev => [...prev, record]);
  }, []);

  const exportHistoryAsText = useCallback(() => {
    return generateHistoryTxt(currentUser || "usuario", feedingHistory);
  }, [currentUser, feedingHistory]);

  // --- Custom cats ---
  const addCustomCat = useCallback((cat: CatProfile) => {
    setCustomCats(prev => [...prev, cat]);
  }, []);

  const deleteCustomCat = useCallback((id: string) => {
    setCustomCats(prev => prev.filter(c => c.id !== id));
    if (selectedCatId === id) {
      setSelectedCatIdInternal("siames");
    }
  }, [selectedCatId]);

  const hideCat = useCallback((id: string) => {
    setHiddenCatIds(prev => {
      if (prev.includes(id)) return prev;
      if (selectedCatId === id) {
        setSelectedCatIdInternal("siames");
      }
      return [...prev, id];
    });
  }, [selectedCatId]);

  const unhideCat = useCallback((id: string) => {
    setHiddenCatIds(prev => prev.filter(hid => hid !== id));
  }, []);

  // --- Derived ---
  const mealsServedToday = meals.filter(m => m.served).length;
  const totalMealsToday = meals.length;

  return (
    <FeedingContext.Provider value={{
      meals, setMeals, feedNow, feedingInProgress, feedingComplete,
      nextMealTime, secondsUntilNext, mealsServedToday, totalMealsToday,
      selectedCat, setSelectedCatId,
      totalPortionsServed, cleaningAlert, dismissCleaningAlert,
      waterLevel, setWaterLevel,
      loadingSchedules, schedulesError, addSchedule, deleteSchedule,
      currentUser, displayName, users, login, register, logout,
      feedingHistory, analysisHistory, addAnalysisRecord, exportHistoryAsText,
      customCats, allCats, addCustomCat, deleteCustomCat,
      hiddenCatIds, hideCat, unhideCat,
    }}>
      {children}
    </FeedingContext.Provider>
  );
};
