'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface CitySuggestion {
  id: string;
  name: string;
  state: string;
  stateCode: string;
}

/** Set an input's value so React/react-hook-form onChange handlers fire too. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * City input with a custom autocomplete dropdown backed by the seeded India
 * city list (GET /api/lawyers/cities?q=). Custom listbox instead of a native
 * <datalist> so suggestions render identically in every browser.
 */
export default function CityInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  },
) {
  const [options, setOptions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      if (debounce.current) clearTimeout(debounce.current);
      abort.current?.abort();
    };
  }, []);

  function onInput(e: React.FormEvent<HTMLInputElement>) {
    const q = e.currentTarget.value;
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      try {
        const res = await fetch(
          `${API_BASE}/lawyers/cities?q=${encodeURIComponent(q)}`,
          { signal: abort.current.signal },
        );
        if (res.ok) {
          const list = (await res.json()) as CitySuggestion[];
          setOptions(list);
          setOpen(list.length > 0);
          setActive(-1);
        }
      } catch {
        /* aborted or backend offline — keep quiet */
      }
    }, 200);
  }

  function choose(city: CitySuggestion) {
    if (inputRef.current) setNativeValue(inputRef.current, city.name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        choose(options[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const { className, ref: outerRef, ...rest } = props;

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        {...rest}
        ref={(el) => {
          inputRef.current = el;
          // keep react-hook-form's ref working too
          if (typeof outerRef === 'function') outerRef(el);
          else if (outerRef && 'current' in outerRef) {
            (outerRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }
        }}
        className={className}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onFocus={() => options.length > 0 && setOpen(true)}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="city-suggestions"
      />
      {open && (
        <ul
          id="city-suggestions"
          role="listbox"
          aria-label="City suggestions"
          className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 text-left shadow-xl"
        >
          {options.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so it fires before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 text-sm ${
                i === active ? 'bg-bg-soft text-navy' : 'text-slate-700'
              }`}
            >
              <Icon name="location-dot" aria-hidden="true" className="mr-1.5 text-gold" />
              <span className="font-semibold">{c.name}</span>
              <span className="text-slate-400">, {c.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
