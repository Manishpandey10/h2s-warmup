"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type Option = { value: string; label: string; lang?: string };

export function ChoiceSelect({
  id,
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  compact = false,
}: {
  id: string;
  name?: string;
  label: string;
  options: readonly Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  compact?: boolean;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));

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
      setInternalValue(defaultValue ?? options[0]?.value ?? "");
      setOpen(false);
    }
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, options]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    setInternalValue(option.value);
    onChange?.(option.value);
    setActive(index);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActive(selectedIndex);
        setOpen(true);
      } else {
        setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
      }
    } else if (open && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : options.length - 1);
    } else if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(active);
    } else if (!open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setActive(selectedIndex);
      setOpen(true);
    }
  }

  return (
    <div className={`choice-select${compact ? " choice-select-compact" : ""}`} ref={rootRef}>
      {name && <input ref={inputRef} type="hidden" name={name} value={selectedValue} />}
      <button
        id={id}
        ref={buttonRef}
        className="choice-trigger"
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open ? `${menuId}-${active}` : undefined}
        onClick={() => {
          setActive(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
      >
        <span lang={options[selectedIndex]?.lang}>{options[selectedIndex]?.label}</span>
      </button>
      {open && (
        <div id={menuId} className="choice-menu" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <div
              id={`${menuId}-${index}`}
              className="choice-option"
              role="option"
              aria-selected={option.value === selectedValue}
              data-active={index === active}
              key={option.value}
              lang={option.lang}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <span className="choice-check" aria-hidden="true">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
