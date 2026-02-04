import DbScanPage from "./DbScanDashboard";
import DocumentScanPage from "./DocumentScanDashboard";
import ImageScanPage from "./ImageScanDashboard";
import ScanCounterChart from "./ScanCounterChart";
import ScanTypeDistribution from "./ScanTypeDistribution";

export default function Dashboard() {
  return (
    <div className=" flex flex-col pt-7  gap-y-3.5">
      <div className="flex flex-col gap-0.5 p-1 border-2 rounded-2xl border-gray-700">
        <h2 className="pl-1.5 text-2xl md:text-base font-bold text-gray-900  truncate">
          Scan Details over time
        </h2>
        <div className="flex flex-row gap-4 w-full">
          <ScanCounterChart></ScanCounterChart>
          <ScanTypeDistribution></ScanTypeDistribution>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-1 border-2 rounded-2xl border-gray-700">
        <h2 className="pl-1.5 text-2xl md:text-base font-bold text-gray-900  truncate">
          Image Scan Details
        </h2>
        <ImageScanPage></ImageScanPage>
      </div>
      <div className="flex flex-col gap-0.5 p-1 border-2 rounded-2xl border-gray-700">
        <h2 className="pl-1.5 text-2xl  md:text-base font-bold text-gray-900  truncate">
          Document Scan Details
        </h2>
        <DocumentScanPage></DocumentScanPage>
      </div>
      <div className="flex flex-col gap-0.5 p-1 border-2 rounded-2xl border-gray-700">
        <h2 className="pl-1.5 text-2xl md:text-base font-bold text-gray-900  truncate">
          DB Scan Details
        </h2>
        <DbScanPage></DbScanPage>
      </div>
    </div>
  );
}
