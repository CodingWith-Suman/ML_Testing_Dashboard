import { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../ui/DashboardCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ImageScanPage() {
  const [labels, setLabels] = useState([]);
  const [confidenceBuckets, setConfidenceBuckets] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/dashboard/image-scan").then((res) => {
      setLabels(res.data.labels);
      setConfidenceBuckets(res.data.confidenceBuckets);
    });
  }, []);

  // Colors for confidence buckets
  const confidenceColors = [
    "#ef4444", // Red
    "#ef4422", // Red
    "#f59e0b", // Orange
    "#f97316", // Amber
    "#10b981", // Green
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Pie Chart for Image Labels */}
      <DashboardCard title="Image Label Breakdown">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={labels}
              dataKey="value"
              nameKey="label"
              outerRadius={148}
            >
              {labels.map((_, i) => (
                <Cell key={i} fill={["#2563eb", "#f59e0b", "#10b981"][i % 3]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* Bar Chart for Confidence Distribution */}
      <DashboardCard title="Confidence Distribution">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={confidenceBuckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {confidenceBuckets.map((_, i) => (
                <Cell
                  key={i}
                  fill={confidenceColors[i % confidenceColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </DashboardCard>
    </div>
  );
}
