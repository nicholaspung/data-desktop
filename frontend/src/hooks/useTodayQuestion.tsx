import { useState, useEffect } from "react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";

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

export function useTodayQuestion() {
  const [todayQuestion, setTodayQuestion] = useState<string>("");

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntry = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      const match = todayEntry.entry.match(/^##\s+(.+?)(\n|$)/m);
      if (match && match[1]) {
        setTodayQuestion(match[1].trim());
      }
    } else {
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
          86400000
      );
      const questionIndex = dayOfYear % questions.length;
      setTodayQuestion(questions[questionIndex]);
    }
  }, [entries]);

  return { todayQuestion, questions };
}
