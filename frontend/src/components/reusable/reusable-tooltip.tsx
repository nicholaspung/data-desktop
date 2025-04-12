import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function ReusableTooltip({
  contentClassName,
  renderTrigger,
  renderContent,
  delayDuration,
  side,
  align,
}: {
  contentClassName?: string;
  renderTrigger: ReactNode;
  renderContent: ReactNode;
  delayDuration?: number;
  side?: "right";
  align?: "center";
}) {
  const Trigger = () => (
    <TooltipTrigger asChild>{renderTrigger}</TooltipTrigger>
  );
  const Content = () => (
    <TooltipContent className={contentClassName} side={side} align={align}>
      {renderContent}
    </TooltipContent>
  );

  if (delayDuration) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={delayDuration}>
          <Trigger />
          <Content />
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <Trigger />
        <Content />
      </Tooltip>
    </TooltipProvider>
  );
}
