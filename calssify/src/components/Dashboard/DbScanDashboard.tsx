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
} from "recharts";

interface ClassificationRow {
  name: string;
  count: number;
  matched?: number;
}

interface MetadataRow {
  tableName: string;
  rowCount: number;
  pii: number;
  identifiers: number;
  behavioral: number;
  owner: string;
}

export default function DbScanPage() {
  const [classificationCounts, setClassificationCounts] = useState<
    ClassificationRow[]
  >([]);
  const [metadata, setMetadata] = useState<MetadataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("http://localhost:3000/dashboard/db-scan");
        setClassificationCounts(res.data.classificationCounts);
        setMetadata(res.data.metadata);
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
    <div className="grid gap-4 lg:grid-cols-2 ">
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <DashboardCard title="DB PII Classification" subtitle="Count of findings">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classificationCounts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCard>

      <DashboardCard
        title="Table Metadata"
        subtitle="PII distribution by table"
      >
        <div className="Overflow-x-auto overflow-y-auto max-h-[300px] text-white scrollbar-hide">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Table</th>
                <th className="py-2 pr-4">Rows</th>
                <th className="py-2 pr-4">PII</th>
                <th className="py-2 pr-4">Identifiers</th>
                <th className="py-2 pr-4">Behavioral</th> 
                <th className="py-2 pr-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metadata.map((row) => (
                <tr key={row.tableName}>
                  <td className="py-2 pr-4">{row.tableName}</td>
                  <td className="py-2 pr-4">{row.rowCount}</td>
                  <td className="py-2 pr-4">{row.pii}</td>
                  <td className="py-2 pr-4">{row.identifiers}</td>
                  <td className="py-2 pr-4">{row.behavioral}</td>
                  <td className="py-2 pr-4">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
