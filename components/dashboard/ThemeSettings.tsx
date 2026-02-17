"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { getTheme, applyThemeToRoot } from "@/lib/theme";

export default function ThemeSettings({ business }: { business: any }) {
  const [primary, setPrimary] = useState(business?.theme?.primary || "#FF7D00");
  const [accent, setAccent] = useState(business?.theme?.accent || "#78290F");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyThemeToRoot(getTheme({ theme: { primary, accent } }));
  }, [primary, accent]);

  const saveTheme = async () => {
    setSaving(true);
    try {
      const res = await axios.patch("/api/business/theme", { primary, accent });
      if (res.data.success) alert("Theme updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update theme.");
    } finally {
      setSaving(false);
    }
  };

  const theme = getTheme({ theme: { primary, accent } });

  return (
    <div
      className="rounded-xl shadow p-6 space-y-4"
      style={{ background: theme.backgroundSoft, border: `1px solid ${theme.primary}` }}
    >
      <h3 className="font-semibold text-lg" style={{ color: theme.primaryDark }}>
        Theme Settings
      </h3>

      <div className="flex items-center gap-4">
        <label style={{ color: theme.primaryDark }}>Primary Color:</label>
        <input
          type="color"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          style={{ border: `1px solid ${theme.primary}`, borderRadius: 4 }}
        />
      </div>

      <div className="flex items-center gap-4">
        <label style={{ color: theme.primaryDark }}>Accent Color:</label>
        <input
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          style={{ border: `1px solid ${theme.primary}`, borderRadius: 4 }}
        />
      </div>

      <Button
        onClick={saveTheme}
        disabled={saving}
        style={{ background: theme.primary, color: "white" }}
      >
        {saving ? "Saving..." : "Save Theme"}
      </Button>
    </div>
  );
}
