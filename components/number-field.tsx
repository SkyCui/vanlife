'use client';

import {useEffect, useState} from 'react';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  max?: number;
};

export function NumberField({label, value, onChange, suffix = '', max = 1e9}: Props) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  return <label className="field">
    <span>{label}</span>
    <div className="input-unit">
      <input type="number" min="0" max={max} step="any" value={text}
        onFocus={() => setEditing(true)}
        onChange={event => {
          const next = event.target.value;
          setText(next);
          // Keep the editable string, including an empty field, separate from
          // the numeric budget. Clearing a field must not insert a new zero.
          const number = next === '' ? 0 : event.target.valueAsNumber;
          if (Number.isFinite(number)) onChange(number);
        }}
        onBlur={() => {
          const number = Number(text);
          const normalized = Number.isFinite(number) ? number : value;
          setText(String(normalized));
          onChange(normalized);
          setEditing(false);
        }}/>
      {suffix && <span>{suffix}</span>}
    </div>
  </label>;
}
