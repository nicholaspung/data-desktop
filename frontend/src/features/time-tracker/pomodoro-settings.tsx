// src/features/time-tracker/pomodoro-settings.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { setPomodoroSettings } from "./pomodoro-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Keys for localStorage
const POMODORO_MINUTES_KEY = "pomodoro-minutes";
const BREAK_MINUTES_KEY = "pomodoro-break-minutes";

export default function PomodoroSettings() {
  // Initialize state from localStorage or use defaults
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => {
    const saved = localStorage.getItem(POMODORO_MINUTES_KEY);
    return saved ? parseInt(saved) : 25;
  });

  const [breakMinutes, setBreakMinutes] = useState(() => {
    const saved = localStorage.getItem(BREAK_MINUTES_KEY);
    return saved ? parseInt(saved) : 5;
  });

  const [open, setOpen] = useState(false);

  // Initialize pomodoro store when component mounts
  useEffect(() => {
    setPomodoroSettings(pomodoroMinutes, breakMinutes);
  }, []);

  const handleSave = () => {
    // Save to store
    setPomodoroSettings(pomodoroMinutes, breakMinutes);

    // Save to localStorage
    localStorage.setItem(POMODORO_MINUTES_KEY, pomodoroMinutes.toString());
    localStorage.setItem(BREAK_MINUTES_KEY, breakMinutes.toString());

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Pomodoro Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Pomodoro Settings</h4>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="pomodoro-time">
                Pomodoro Time: {pomodoroMinutes} min
              </Label>
              <Input
                id="pomodoro-time-input"
                type="number"
                min={1}
                max={60}
                value={pomodoroMinutes}
                onChange={(e) =>
                  setPomodoroMinutes(parseInt(e.target.value) || 25)
                }
                className="w-16 h-8"
              />
            </div>
            <Slider
              id="pomodoro-time"
              min={5}
              max={60}
              step={5}
              value={[pomodoroMinutes]}
              onValueChange={(value) => setPomodoroMinutes(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="break-time">Break Time: {breakMinutes} min</Label>
              <Input
                id="break-time-input"
                type="number"
                min={1}
                max={30}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 5)}
                className="w-16 h-8"
              />
            </div>
            <Slider
              id="break-time"
              min={1}
              max={30}
              step={1}
              value={[breakMinutes]}
              onValueChange={(value) => setBreakMinutes(value[0])}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
