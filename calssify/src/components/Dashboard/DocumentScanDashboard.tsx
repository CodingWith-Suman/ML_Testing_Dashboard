import { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../ui/DashboardCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface CountRow {
  name: string;
  value: number;
}

export default function DocumentScanPage() {
  const [piiFoundCounts, setPiiFoundCounts] = useState<CountRow[]>([]);
  const [typeCounts, setTypeCounts] = useState<CountRow[]>([]);
  const [classificationSums, setClassificationSums] = useState<CountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          "http://localhost:3000/dashboard/document-scan"
        );
        setPiiFoundCounts(res.data.piiFoundCounts);
        setTypeCounts(res.data.typeCounts);
        setClassificationSums(res.data.classificationSums);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Color maps for categories
  const piiPresenceColors: Record<string, string> = {
    "PII Found": "#34d399", // Green
    "No PII": "#ef4444", // Red
  };

  const fileTypeColors: Record<string, string> = {
    pdf: "#f97316", // Orange
    docx: "#2563eb", // Blue
    csv: "#22c55e", // Green
    txt: "#9333ea", // Purple
    default: "#6b7280", // Gray fallback
  };

  const piiClassificationColors: Record<string, string> = {
    email: "#3b82f6", // Blue
    pan: "#f59e0b", // Amber
    name: "#34d399",
    address: "#6b7280",
    aadhaar: "#10b981", // Green
    passport: "#9333ea", // Purple
    bank_account: "#ef4444", // Red
    default: "#6366f1", // Indigo fallback
  };

  return (
    <div className="grid gap-4 grid-cols-17 lg:grid-cols-15">
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {/* PII Presence */}
      <div className="col-span-3 ">
        <DashboardCard
          title="PII Presence"
          subtitle="Documents with vs without PII"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={piiFoundCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {piiFoundCounts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      piiPresenceColors[entry.name] ||
                      piiPresenceColors["default"]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Document Types */}
      <div className="col-span-6 ">
        <DashboardCard title="Document Types" subtitle="Breakdown by file type">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {typeCounts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      fileTypeColors[entry.name] || fileTypeColors["default"]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* PII Classifications */}
      <div className="col-span-6 ">
        <DashboardCard
          title="PII Classifications"
          subtitle="Occurrences per type"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classificationSums}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                tick={{ fontSize: 12 }}
                angle={-15}
                dy={10}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {classificationSums.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      piiClassificationColors[entry.name] ||
                      piiClassificationColors["default"]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>
    </div>
  );
}
