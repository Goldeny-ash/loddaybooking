"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  bookings: any[];
}

export default function PerformanceChart({ bookings }: Props) {
  const data = getLast7DaysData(bookings);

  return (
    <div
      className="rounded-xl shadow p-6"
      style={{
        backgroundColor: "var(--brand-bg-soft)",
        border: "1px solid var(--brand-primary)",
      }}
    >
      <h2
        className="font-bold mb-4"
        style={{ color: "var(--brand-primary-dark)" }}
      >
        Performance Overview (Last 7 Days)
      </h2>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--brand-primary)"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="bookings"
              stroke="var(--brand-accent)"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getLast7DaysData(bookings: any[]) {
  const today = new Date();
  const result: any[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(today.getDate() - i);

    const dayString = day.toISOString().split("T")[0];

    const dayBookings = bookings.filter((b) =>
      b.date?.toString().includes(dayString)
    );

    const revenue = dayBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    result.push({
      date: day.toLocaleDateString("en-US", { weekday: "short" }),
      bookings: dayBookings.length,
      revenue,
    });
  }

  return result;
}