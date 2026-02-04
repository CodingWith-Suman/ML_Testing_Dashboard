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
  Legend,
} from "recharts";

interface ScanData {
  name: string;
  weekly: number;
  monthly: number;
  quarterly: number;
}

export default function ScanTypeDistribution() {
  const [data, setData] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          "http://localhost:3000/dashboard/scan-type-distribution"
        );
        const { weekly, monthly, quarterly } = res.data;

        // Merge into one array for grouped bars
        const merged: ScanData[] = [
          "IMAGE_SCAN",
          "DOCUMENT_SCAN",
          "DB_SCAN",
        ].map((type) => ({
          name: type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          weekly: weekly.find((d: any) => d.name === type)?.value || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          monthly: monthly.find((d: any) => d.name === type)?.value || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quarterly: quarterly.find((d: any) => d.name === type)?.value || 0,
        }));

        setData(merged);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardCard
      title="Scan Types Distribution"
      subtitle="Weekly, Monthly, Quarterly"
    >
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="weekly" fill="#2563eb" />
          <Bar dataKey="monthly" fill="#f59e0b" />
          <Bar dataKey="quarterly" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
