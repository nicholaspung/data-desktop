import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { debounce } from "@/lib/utils";

interface NumberValueInputProps {
  value: number | string;
  onChange: (value: number) => Promise<void>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function NumberValueInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  disabled = false,
}: NumberValueInputProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveInProgress = useRef(false);

  useEffect(() => {
    if (!saveInProgress.current) {
      setInputValue(value.toString());
    }
  }, [value]);

  const debouncedSave = useRef(
    debounce(async (newValue: number) => {
      try {
        setIsSaving(true);
        saveInProgress.current = true;
        await onChange(newValue);
      } finally {
        setIsSaving(false);
        setTimeout(() => {
          saveInProgress.current = false;
        }, 1000);
      }
    }, 1000)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) {
      debouncedSave(parsed);
    }
  };

  const handleIncrement = async () => {
    const currentValue = parseFloat(inputValue) || 0;
    const newValue = Math.min(currentValue + step, max);

    setInputValue(newValue.toString());
    setIsSaving(true);
    saveInProgress.current = true;

    try {
      await onChange(newValue);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        saveInProgress.current = false;
      }, 1000);
    }
  };

  const handleDecrement = async () => {
    const currentValue = parseFloat(inputValue) || 0;
    const newValue = Math.max(currentValue - step, min);

    setInputValue(newValue.toString());
    setIsSaving(true);
    saveInProgress.current = true;

    try {
      await onChange(newValue);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        saveInProgress.current = false;
      }, 1000);
    }
  };

  return (
    <div className="flex items-center bg-background border rounded-lg p-1 shadow-sm hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || isSaving || parseFloat(inputValue) <= min}
        className="px-2 h-8 hover:bg-muted rounded-md transition-colors"
      >
        <Minus className="h-3 w-3" />
      </Button>

      <div className="relative flex-1 mx-1">
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled || isSaving}
          className="h-10 text-center border-0 focus:ring-0 focus:border-0 text-lg font-semibold bg-transparent"
        />
        {isSaving && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || isSaving || parseFloat(inputValue) >= max}
        className="px-2 h-8 hover:bg-muted rounded-md transition-colors"
      >
        <Plus className="h-3 w-3" />
      </Button>

      {unit && (
        <div className="ml-2 px-2 py-1 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
          {unit}
        </div>
      )}
    </div>
  );
}
