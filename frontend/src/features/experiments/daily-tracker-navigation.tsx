import { Button } from "@/components/ui/button";
import { addDays, addMonths, format, subDays, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CircleChevronLeft,
  CircleChevronRight,
} from "lucide-react";

export default function DailyTrackerNavigation({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
}: {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
}) {
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(subMonths(selectedDate, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(addMonths(selectedDate, 1));
  };
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };
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
      <Button variant="outline" onClick={goToPreviousMonth}>
        <CircleChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={goToPreviousDay}>
        <ChevronLeft className="h-4 w-4 mr-2" />
      </Button>
      <Button
        variant="default"
        className={"w-full pl-3 text-left font-normal"}
        disabled
      >
        {format(selectedDate, "EEEE, MMMM d, yyyy")}
      </Button>
      <Button variant="outline" onClick={goToToday}>
        Today
      </Button>
      <Button variant="outline" onClick={goToNextDay}>
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="outline" onClick={goToNextMonth}>
        <CircleChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
