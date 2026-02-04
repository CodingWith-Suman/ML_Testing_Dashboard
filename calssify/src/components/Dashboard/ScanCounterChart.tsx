import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import DashboardCard from "../ui/DashboardCard";

interface ScanData {
  period: string;
  files: number;
}

const ScanCounterChart = () => {
  const [data, setData] = useState<ScanData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(
        "http://localhost:3000/dashboard/scanCounter"
      );
      const { weeklyFilesScanned, monthlyFilesScanned, quarterlyFilesScanned } =
        res.data;

      setData([
        { period: "Weekly", files: weeklyFilesScanned },
        { period: "Monthly", files: monthlyFilesScanned },
        { period: "Quarterly", files: quarterlyFilesScanned },
      ]);
    };

    fetchData();
  }, []);

  return (
    <DashboardCard title="ScanCount/time" subtitle="Weekly, Monthly, Quarterly">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="files" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

export default ScanCounterChart;
