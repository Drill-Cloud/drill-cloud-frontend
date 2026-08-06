import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { CurrentItem } from '../../entities/current/types';
import { formatNumber } from '../../utils/format';

type HistoryTagPickerProps = {
  getTagLabel: (tag: string) => string;
  items: CurrentItem[];
  open: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  onOpenChange: (value: boolean) => void;
};

function matchesQuery(item: CurrentItem, label: string, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  const values = [item.tag, label, item.tagGroup, item.unitOfMeasurement].filter(Boolean);

  return values.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function HistoryTagPicker({
  getTagLabel,
  items,
  open,
  value,
  onChange,
  onOpenChange,
}: HistoryTagPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const hasActiveFilter = Boolean(query.trim());
  const selectedSet = useMemo(() => new Set(value), [value]);
  const visibleItems = useMemo(
    () => items.filter((item) => matchesQuery(item, getTagLabel(item.tag), query.trim())),
    [getTagLabel, items, query],
  );
  const selectedPreview = value.slice(0, 4);
  const hiddenSelectedCount = Math.max(0, value.length - selectedPreview.length);

  const focusInput = () => {
    onOpenChange(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleTag = (tag: string) => {
    onChange(selectedSet.has(tag) ? value.filter((selected) => selected !== tag) : [...value, tag]);
  };

  const selectVisibleTags = () => {
    onChange(Array.from(new Set(visibleItems.map((item) => item.tag))));
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((selected) => selected !== tag));
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !query && value.length > 0) {
      onChange(value.slice(0, -1));
    }

    if (event.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <div className="history-tag-picker">
      <div
        className="history-tag-picker__control"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={focusInput}
      >
        <span className="history-tag-picker__label">
          Показатели
          <strong>
            {value.length} выбрано · {visibleItems.length} найдено
          </strong>
        </span>

        <div className="history-tag-picker__chips">
          {selectedPreview.length ? (
            selectedPreview.map((tag) => (
              <span className="history-tag-picker__chip" key={tag}>
                <span className="history-tag-picker__chip-text">{getTagLabel(tag)}</span>
                <button
                  type="button"
                  aria-label={`Убрать ${getTagLabel(tag)}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeTag(tag);
                  }}
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </span>
            ))
          ) : (
            <span className="history-tag-picker__placeholder">Добавьте показатели на график</span>
          )}
          {hiddenSelectedCount > 0 ? (
            <span className="history-tag-picker__chip history-tag-picker__chip--count">+{hiddenSelectedCount}</span>
          ) : null}
          <input
            ref={inputRef}
            value={query}
            placeholder={value.length ? 'Найти еще...' : 'Поиск показателя'}
            onChange={(event) => {
              setQuery(event.target.value);
              onOpenChange(true);
            }}
            onFocus={() => onOpenChange(true)}
            onKeyDown={handleInputKeyDown}
          />
        </div>

        <button
          type="button"
          className="history-tag-picker__chevron"
          aria-label={open ? 'Скрыть выбор показателей' : 'Показать выбор показателей'}
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!open);
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {open ? (
        <div className="history-tag-picker__dropdown">
          <div className="history-tag-picker__toolbar">
            <span className="history-tag-picker__scope">
              {hasActiveFilter ? `Найдено по фильтру: ${visibleItems.length}` : `Всего показателей: ${items.length}`}
            </span>
            <div className="tag-selector__tools history-tag-picker__tools">
              <button type="button" disabled={visibleItems.length === 0} onClick={selectVisibleTags}>
                Выбрать все
              </button>
              <button type="button" disabled={value.length === 0} onClick={() => onChange([])}>
                Снять все
              </button>
            </div>
          </div>

          <div id={listId} className="tag-select-list" role="listbox">
            {visibleItems.map((item) => {
              const selected = selectedSet.has(item.tag);
              const label = getTagLabel(item.tag);

              return (
                <button
                  key={item.tag}
                  type="button"
                  className={`tag-select-item ${selected ? 'tag-select-item--selected' : ''}`}
                  title={item.tag}
                  onClick={() => toggleTag(item.tag)}
                  aria-pressed={selected}
                  role="option"
                  aria-selected={selected}
                >
                  <span className="tag-select-item__name">
                    <span>{label}</span>
                    {label !== item.tag ? <small>{item.tag}</small> : null}
                  </span>
                  <span className="tag-select-item__side">
                    <strong>{formatNumber(item.value)}</strong>
                    {selected ? <Check size={15} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
