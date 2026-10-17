"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { calendarDays, dateAllowed, monthAllowed, shiftMonth } from "@/lib/calendar";
import { calendarLabel, calendarMonths, calendarWeekdays, fullCalendarDate } from "@/lib/calendar-labels";
import { indiaDate } from "@/lib/dates";
import { useLanguage } from "./language-provider";
import { UiIcon } from "./ui-icon";

type PickerMode = "date" | "month";

export function DatePicker({
  id,
  name,
  label,
  mode = "date",
  min,
  max,
  value,
  defaultValue = "",
  onChange,
  required = false,
}: {
  id: string;
  name?: string;
  label: string;
  mode?: PickerMode;
  min: string;
  max: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  const { language, t } = useLanguage();
  const today = indiaDate();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState((value ?? defaultValue).slice(0, 7) || today.slice(0, 7));
  const [focusedDate, setFocusedDate] = useState("");
  const [opensUp, setOpensUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupId = useId();
  const selected = value ?? internalValue;
  const minMonth = min.slice(0, 7);
  const maxMonth = max.slice(0, 7);
  const year = Number(viewMonth.slice(0, 4));

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [open]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    function reset() {
      setInternalValue(defaultValue);
      setOpen(false);
    }
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return;
    const target = mode === "date" ? focusedDate : `${viewMonth}`;
    const frame = requestAnimationFrame(() => document.getElementById(`${popupId}-${target}`)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusedDate, mode, open, popupId, viewMonth]);

  function openPicker() {
    if (open) {
      setOpen(false);
      return;
    }
    const initialMonth = selected.slice(0, 7) || today.slice(0, 7);
    setViewMonth(initialMonth);
    const initialDate = dateAllowed(selected, min, max)
      ? selected
      : dateAllowed(today, min, max) ? today : min;
    setFocusedDate(initialDate);
    const bounds = triggerRef.current?.getBoundingClientRect();
    setOpensUp(Boolean(bounds && window.innerHeight - bounds.bottom < 370 && bounds.top > 370));
    setOpen(true);
  }

  function choose(next: string) {
    const allowed = mode === "date" ? dateAllowed(next, min, max) : monthAllowed(next, min, max);
    if (!allowed) return;
    setInternalValue(next);
    onChange?.(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveDay(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const nextDate = new Date(`${day}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + offset);
    const next = nextDate.toISOString().slice(0, 10);
    if (!dateAllowed(next, min, max)) return;
    setFocusedDate(next);
    setViewMonth(next.slice(0, 7));
  }

  const display = selected ? calendarLabel(selected, language, mode) : t.chooseDate;
  const heading = mode === "date" ? calendarLabel(viewMonth, language, "month") : String(year);
  const weekdays = calendarWeekdays(language);
  const months = calendarMonths(language);

  return (
    <div className="date-picker" ref={rootRef}>
      {name && <input ref={inputRef} type="hidden" name={name} value={selected} />}
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className="date-trigger"
        aria-label={`${label}: ${display}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        aria-required={required}
        onClick={openPicker}
      >
        <UiIcon name="calendar" size={19} />
        <span>{display}</span>
      </button>
      {open && (
        <div
          id={popupId}
          className={`date-popup${opensUp ? " date-popup-up" : ""}`}
          role="dialog"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="date-popup-head">
            <button
              type="button"
              className="date-nav"
              aria-label={t.previous}
              disabled={mode === "date" ? shiftMonth(viewMonth, -1) < minMonth : `${year - 1}-12` < minMonth}
              onClick={() => setViewMonth(mode === "date" ? shiftMonth(viewMonth, -1) : `${year - 1}-01`)}
            >‹</button>
            <strong>{heading}</strong>
            <button
              type="button"
              className="date-nav"
              aria-label={t.next}
              disabled={mode === "date" ? shiftMonth(viewMonth, 1) > maxMonth : `${year + 1}-01` > maxMonth}
              onClick={() => setViewMonth(mode === "date" ? shiftMonth(viewMonth, 1) : `${year + 1}-01`)}
            >›</button>
          </div>
          {mode === "date" ? (
            <>
              <div className="date-weekdays">
                {weekdays.map((weekday, index) => <span key={index}>{weekday}</span>)}
              </div>
              <div className="date-days">
                {calendarDays(viewMonth).map((day, index) => day ? (
                  <button
                    id={`${popupId}-${day}`}
                    type="button"
                    key={day}
                    className="date-day"
                    disabled={!dateAllowed(day, min, max)}
                    aria-label={fullCalendarDate(day, language)}
                    aria-current={day === today ? "date" : undefined}
                    aria-pressed={day === selected}
                    tabIndex={day === focusedDate ? 0 : -1}
                    onFocus={() => setFocusedDate(day)}
                    onKeyDown={(event) => moveDay(event, day)}
                    onClick={() => choose(day)}
                  >{Number(day.slice(-2))}</button>
                ) : <span key={`blank-${index}`} />)}
              </div>
            </>
          ) : (
            <div className="date-months">
              {Array.from({ length: 12 }, (_, index) => {
                const next = `${year}-${String(index + 1).padStart(2, "0")}`;
                return (
                  <button
                    id={`${popupId}-${next}`}
                    type="button"
                    key={next}
                    disabled={!monthAllowed(next, min, max)}
                    aria-pressed={next === selected}
                    onClick={() => choose(next)}
                  >
                    {months[index]}
                  </button>
                );
              })}
            </div>
          )}
          {(mode === "date" ? dateAllowed(today, min, max) : monthAllowed(today.slice(0, 7), min, max)) && (
            <button type="button" className="date-today" onClick={() => choose(mode === "date" ? today : today.slice(0, 7))}>
              {mode === "date" ? t.today : t.thisMonth}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
