// src/features/journaling/question-of-the-day.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { ApiService } from "@/services/api";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";
import dataStore, { addEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { Loader2 } from "lucide-react";

interface QuestionOfTheDayProps {
  setActiveTab?: (tab: string) => void;
}

// Array of daily questions
const questions = [
  "What am I grateful for today?",
  "What's something I learned recently?",
  "What's a challenge I'm currently facing and how can I overcome it?",
  "What brings me joy in my daily life?",
  "What's one small step I can take today towards my biggest goal?",
  "How can I be kinder to myself today?",
  "What's something I appreciate about my body?",
  "What's a belief I hold that might be limiting me?",
  "If I had unlimited resources, what would I do with my life?",
  "What relationships in my life deserve more attention?",
  "What is one small victory I can celebrate about myself today?",
  "How have my priorities shifted in the past year, and what does that reveal about my growth?",
  "What negative thought pattern do I want to release, and what would I replace it with?",
  "When did I last feel truly at peace, and how can I create more of those moments?",
  "What advice would my future self, 10 years from now, give to me today?",
  "Which of my personal strengths have I been underutilizing lately?",
  "What fear has been holding me back, and what's one small way I could face it?",
  "Who has positively influenced me recently, and what qualities of theirs do I admire?",
  "What boundaries do I need to establish or reinforce in my life right now?",
  "When do I feel most authentically myself, and how can I bring more of that into my daily life?",
  "What am I holding onto that no longer serves my growth or happiness?",
  "How do I typically respond to failure, and how might I respond more constructively?",
  "What skill or area of knowledge would I like to develop further, and why?",
  "What does 'success' mean to me right now, beyond external achievements?",
  "Which aspects of my life feel balanced, and which need more attention?",
  "What simple pleasures or small joys am I overlooking in my daily routine?",
  "How has a recent challenge changed my perspective or made me stronger?",
  "What am I curious about learning or exploring more deeply?",
  "In what ways have I been kind to others recently, and how did it make me feel?",
  "What activity makes me lose track of time in a positive way, and how could I engage in it more often?",
  "When do I feel most connected to something greater than myself?",
  "What past mistake am I still carrying, and how could I practice forgiveness—either of myself or someone else?",
  "What would a perfect day look like for me right now, and what elements of it could I incorporate into my life?",
  "How do my surroundings affect my mood and productivity, and what small change could improve them?",
  "What would I do differently if I knew no one would judge me?",
  "What recurring dreams or aspirations keep coming back to me, and what might they be telling me?",
  "How do I recharge when I'm feeling depleted, and am I making enough time for it?",
  "What habit would I like to develop, and what's the smallest first step I could take?",
  "When was the last time I truly surprised myself, and what did I learn from it?",
  "What legacy or impact would I like to leave in the lives of those around me?",
];

export default function QuestionOfTheDay({
  setActiveTab,
}: QuestionOfTheDayProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEntryExists, setTodayEntryExists] = useState(false);
  const [existingEntry, setExistingEntry] =
    useState<QuestionJournalEntry | null>(null);

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // See if we already have an entry for today
    const todayEntry = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      setTodayEntryExists(true);
      setExistingEntry(todayEntry);
    } else {
      // Select a question based on the day of year for consistency
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
          86400000
      );
      const questionIndex = dayOfYear % questions.length;
      setQuestion(questions[questionIndex]);
    }
  }, [entries]);

  const handleSubmit = async () => {
    if (answer.trim() === "") {
      toast.error("Please enter your answer before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      // Add markdown formatting to include the question at the top
      const formattedEntry = `## ${question}\n\n${answer}`;

      // Create entry data
      const entryData = {
        date: today,
        entry: formattedEntry,
      };

      // Save to database
      const result = await ApiService.addRecord("question_journal", entryData);
      if (result) {
        // Add to state
        addEntry(result, "question_journal");
        toast.success("Your answer has been saved");
        setAnswer(""); // Clear the form

        // Navigate to history if requested
        if (setActiveTab) {
          setActiveTab("history");
        }
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("There was an error saving your entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (todayEntryExists && existingEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Question - {formatDate(new Date())}</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: existingEntry.entry.replace(/\n/g, "<br/>"),
            }}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setActiveTab && setActiveTab("history")}
          >
            View All Entries
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Question - {formatDate(new Date())}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-md text-lg font-medium">
          {question}
        </div>

        <div className="space-y-2">
          <h3 className="text-md font-medium">Your Answer:</h3>
          <MarkdownEditor
            value={answer}
            onChange={setAnswer}
            placeholder="Write your answer here..."
            minHeight="200px"
            maxHeight="500px"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
