import { poundsToKilograms } from "@/lib/units/weight";
import type { WeightUnit } from "@/lib/units/types";

import type { PersistedStrengthRecord, StrengthRecordType } from "../types";

interface StrengthRecordSummaryProps {
  records: PersistedStrengthRecord[];
  displayUnit: WeightUnit;
}

const RECORD_ORDER: StrengthRecordType[] = [
  "highest_weight",
  "highest_estimated_one_rep_max",
  "highest_volume",
];

const RECORD_LABELS: Record<StrengthRecordType, string> = {
  highest_weight: "Heaviest weight",
  highest_estimated_one_rep_max: "Estimated 1RM",
  highest_volume: "Session volume",
};

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function StrengthRecordSummary({
  records,
  displayUnit,
}: StrengthRecordSummaryProps) {
  const orderedRecords = _orderRecords(records);

  if (orderedRecords.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Strength records"
      className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Strength records
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {orderedRecords.map((record) => (
          <div key={record.type} className="rounded-md bg-white/80 p-3">
            <dt className="text-sm font-medium text-emerald-900">
              {RECORD_LABELS[record.type]}
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-950">
              {_formatRecordValue(record, displayUnit)}
            </dd>
            <dd className="mt-1 text-xs font-medium text-gray-600">
              {_formatRecordContext(record, displayUnit)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function _orderRecords(
  records: PersistedStrengthRecord[],
): PersistedStrengthRecord[] {
  const byType = new Map(records.map((record) => [record.type, record]));

  return RECORD_ORDER.flatMap((type) => {
    const record = byType.get(type);

    return record ? [record] : [];
  });
}

function _formatRecordContext(
  record: PersistedStrengthRecord,
  displayUnit: WeightUnit,
): string {
  if (!record.previousRecord) {
    return "Baseline established";
  }

  const currentValue = _getDisplayValue(record.value, record.type, displayUnit);
  const previousValue = _getDisplayValue(
    record.previousRecord.value,
    record.type,
    displayUnit,
  );
  const delta = currentValue - previousValue;
  const unit = _getDisplayUnit(record.type, displayUnit);

  return `${_formatDelta(delta)} ${unit} from ${_formatNumber(previousValue)} ${unit}`;
}

function _formatRecordValue(
  record: PersistedStrengthRecord,
  displayUnit: WeightUnit,
): string {
  return `${_formatNumber(
    _getDisplayValue(record.value, record.type, displayUnit),
  )} ${_getDisplayUnit(record.type, displayUnit)}`;
}

function _getDisplayValue(
  value: number,
  type: StrengthRecordType,
  displayUnit: WeightUnit,
): number {
  if (displayUnit === "lb") {
    return value;
  }

  if (
    type === "highest_weight" ||
    type === "highest_estimated_one_rep_max" ||
    type === "highest_volume"
  ) {
    return poundsToKilograms(value);
  }

  return value;
}

function _getDisplayUnit(
  type: StrengthRecordType,
  displayUnit: WeightUnit,
): string {
  return type === "highest_volume" ? `${displayUnit}·reps` : displayUnit;
}

function _formatDelta(value: number): string {
  const formatted = _formatNumber(Math.abs(value));

  if (value < 0) {
    return `-${formatted}`;
  }

  return `+${formatted}`;
}

function _formatNumber(value: number): string {
  return VALUE_FORMATTER.format(value);
}
