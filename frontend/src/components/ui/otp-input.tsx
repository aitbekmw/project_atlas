import { useRef, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function OtpInput({ value, onChange, disabled, id }: OtpInputProps) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, next: string) {
    const cleaned = next.replace(/\D/g, "");
    if (!cleaned) {
      const nextValue = digits.map((digit, digitIndex) => (digitIndex === index ? "" : digit)).join("");
      onChange(nextValue);
      return;
    }
    const chars = cleaned.slice(0, 6 - index).split("");
    const nextDigits = [...digits];
    chars.forEach((char, offset) => {
      nextDigits[index + offset] = char;
    });
    onChange(nextDigits.join("").slice(0, 6));
    const focusAt = Math.min(index + chars.length, 5);
    refs.current[focusAt]?.focus();
    refs.current[focusAt]?.select();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-6 gap-1.5 sm:gap-2">
      {digits.map((digit, index) => (
        <Input
          key={index}
          id={index === 0 ? id : undefined}
          ref={(node: HTMLInputElement | null) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? 6 : 1}
          disabled={disabled}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn("h-12 min-w-0 px-0 text-center text-lg font-semibold tabular-nums")}
          aria-label={`${index + 1}`}
        />
      ))}
    </div>
  );
}
