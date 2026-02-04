import React, { Fragment } from "react";

export interface Metadata {
  [key: string]: string | number | null | undefined;
}

export interface ResultEntry {
  filename?: string;
  table?: string;
  column?: string;
  value?: string | number | null;
  label?: string;
  inferred_label?: string;
  metadata?: Metadata;
  showMetadata?: boolean;
  /** Confidence in range [0, 1] or [0, 100]; will be normalized */
  confidence?: number;
}

export interface ResultsTableProps {
  results: ResultEntry[];
  imageMode?: "classify" | "extract" | "metadata"; // Allowing all 3 for compatibility
  onToggleMetadata: (index: number) => void;
}

const formatConfidence = (conf?: number) => {
  if (conf === null || conf === undefined || Number.isNaN(conf)) return "-";
  // Accept both 0–1 and 0–100 inputs
  const normalized = conf > 1 ? conf : conf * 100;
  return `${normalized.toFixed(1)}%`;
};

const confidenceBadgeClass = (conf?: number) => {
  if (conf === null || conf === undefined || Number.isNaN(conf)) {
    return "bg-gray-200 text-gray-700";
  }
  const normalized = conf > 1 ? conf : conf * 100;
  if (normalized >= 85)
    return "bg-green-100 text-green-800 border border-green-300";
  if (normalized >= 60)
    return "bg-amber-100 text-amber-800 border border-amber-300";
  return "bg-red-100 text-red-800 border border-red-300";
};

const ImageResultsTable: React.FC<ResultsTableProps> = ({
  results,
  imageMode = "classify",
  onToggleMetadata,
}) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Sl. No</th>
            <th className="px-4 py-2 text-left">Source</th>
            <th className="px-4 py-2 text-left">Label</th>
            <th className="px-4 py-2 text-left">Confidence</th>
            <th className="px-4 py-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => (
            <Fragment key={`${res.filename || res.table}-${idx}`}>
              <tr className="border-t bg-white hover:bg-gray-50 transition">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {res.filename || res.table || "-"}
                </td>
                <td className="px-4 py-3">
                  {imageMode === "classify"
                    ? res.label || "-"
                    : res.inferred_label || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${confidenceBadgeClass(
                      res.confidence
                    )}`}
                  >
                    {formatConfidence(res.confidence)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <button
                    onClick={() => onToggleMetadata(idx)}
                    className="text-blue-600 underline"
                  >
                    {res.showMetadata ? "Hide" : "Show"} Details
                  </button>
                </td>
              </tr>

              {res.showMetadata && (
                <tr className="bg-gray-100 border-t">
                  <td colSpan={5} className="px-6 py-4 text-xs">
                    <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                        {JSON.stringify(
                          res.metadata || {
                            table: res.table,
                            column: res.column,
                            value: res.value,
                            label:
                              imageMode === "classify"
                                ? res.label
                                : res.inferred_label,
                            confidence: res.confidence,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImageResultsTable;
