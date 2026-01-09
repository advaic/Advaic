"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
export { Tooltip };

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
}

export const TooltipProvider = Tooltip.Provider;
export const TooltipTrigger = Tooltip.Trigger;
export const TooltipContent = Tooltip.Content;
export const TooltipRoot = Tooltip.Root;
export const TooltipPortal = Tooltip.Portal;
export const TooltipArrow = Tooltip.Arrow;

export function TooltipWrapper({ children, content }: TooltipWrapperProps) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="cursor-pointer inline-flex items-center">
            {children}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="z-50 max-w-sm rounded-md bg-neutral-800 px-3 py-2 text-sm text-white shadow-md"
          >
            {content}
            <Tooltip.Arrow className="fill-neutral-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
