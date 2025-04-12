import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DailyTrackerNavigation({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}) {
  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  return (
    <div className="flex justify-between items-center gap-2 mb-4">
      <Button variant="outline" onClick={goToPreviousDay}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous Day
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            className={"w-full pl-3 text-left font-normal"}
          >
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" onClick={goToNextDay}>
        Next Day
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
