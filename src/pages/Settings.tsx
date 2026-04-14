import { useState } from "react";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Bell, Moon } from "lucide-react";

const SettingsPage = () => {
  const { setMeals } = useFeedingContext();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const resetSchedule = () => {
    setMeals([
      { id: "1", time: "07:00", served: false },
      { id: "2", time: "12:00", served: false },
      { id: "3", time: "18:00", served: false },
      { id: "4", time: "22:00", served: false },
    ]);
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your feeder preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="notifications" className="cursor-pointer">
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Get alerts before meals</p>
              </Label>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <Label htmlFor="darkmode" className="cursor-pointer">
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </Label>
            </div>
            <Switch id="darkmode" checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={resetSchedule} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset Schedule
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will restore the default 4-meal schedule
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
