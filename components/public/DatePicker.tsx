"use client";

interface Props {
  date: string;
  onChange: (date: string) => void;
}

export default function DatePicker({ date, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Select Date</label>
      <input
        type="date"
        value={date}
        min={new Date().toISOString().split("T")[0]}
        onChange={e => onChange(e.target.value)}
        className="border rounded-md px-3 py-2"
      />
    </div>
  );
}
