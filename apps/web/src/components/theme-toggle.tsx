"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { value: "system" as const, label: "System", Icon: Monitor },
  { value: "light" as const, label: "Light", Icon: Sun },
  { value: "dark" as const, label: "Dark", Icon: Moon },
];

export function ThemeToggle({
  className,
  labeled = false,
}: {
  className?: string;
  /** Icon + text segments (e.g. profile menu) */
  labeled?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          labeled
            ? "flex h-10 w-full rounded-lg border border-border bg-muted/50 p-0.5"
            : "inline-flex h-9 shrink-0 rounded-lg border border-border bg-muted/40 p-0.5",
          className,
        )}
        aria-hidden
      >
        <span className={labeled ? "flex-1" : "size-8"} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        labeled
          ? "flex w-full rounded-lg border border-border bg-muted/50 p-0.5"
          : "inline-flex shrink-0 rounded-lg border border-border bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Color theme"
    >
      {options.map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size={labeled ? "default" : "icon"}
          className={cn(
            "shrink-0 rounded-md font-normal",
            labeled
              ? "h-9 min-h-9 flex-1 gap-1.5 px-1.5 text-xs font-medium text-muted-foreground sm:px-2"
              : "size-8",
            theme === value &&
              (labeled
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "bg-background text-foreground shadow-sm"),
          )}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          title={label}
        >
          <Icon className={cn(labeled ? "size-3.5 shrink-0" : "size-4")} aria-hidden />
          {labeled ? <span>{label}</span> : <span className="sr-only">{label}</span>}
        </Button>
      ))}
    </div>
  );
}
