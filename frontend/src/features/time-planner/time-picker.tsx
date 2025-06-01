import { useState, useEffect } from "react";
import { format, parse, setHours, setMinutes } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  minTime?: Date;
  maxTime?: Date;
  interval?: number;
}

export default function TimePicker({
  value,
  onChange,
  minTime,
  maxTime,
  interval = 15,
}: TimePickerProps) {
  const [selectedTime, setSelectedTime] = useState(format(value, "h:mm a"));

  const timeOptions = generateTimeOptions(interval, minTime, maxTime);

  useEffect(() => {
    setSelectedTime(format(value, "h:mm a"));
  }, [value]);

  const handleTimeChange = (timeStr: string) => {
    setSelectedTime(timeStr);

    const timeDate = parse(timeStr, "h:mm a", new Date());
    const newDate = new Date(value);
    newDate.setHours(timeDate.getHours());
    newDate.setMinutes(timeDate.getMinutes());

    onChange(newDate);
  };

  return (
    <Select value={selectedTime} onValueChange={handleTimeChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((timeStr) => (
          <SelectItem key={timeStr} value={timeStr}>
            {timeStr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function generateTimeOptions(
  interval: number = 15,
  minTime?: Date,
  maxTime?: Date
): string[] {
  const options: string[] = [];
  const baseDate = new Date();

  const minHour = minTime ? minTime.getHours() : 0;
  const minMinute = minTime
    ? Math.ceil(minTime.getMinutes() / interval) * interval
    : 0;
  const maxHour = maxTime ? maxTime.getHours() : 23;
  const maxMinute = maxTime
    ? Math.floor(maxTime.getMinutes() / interval) * interval
    : 59;

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      if (
        hour < minHour ||
        (hour === minHour && minute < minMinute) ||
        hour > maxHour ||
        (hour === maxHour && minute > maxMinute)
      ) {
        continue;
      }

      const timeDate = setMinutes(setHours(baseDate, hour), minute);
      options.push(format(timeDate, "h:mm a"));
    }
  }

  return options;
}
