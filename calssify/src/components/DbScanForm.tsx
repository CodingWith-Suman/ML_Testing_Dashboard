import React from "react";
import PiiTypeSelector from "./forms/PiiTypeSelector";

interface DbScanFormProps {
  dbConnString: string;
  dbScanType: "pii-meta" | "pii-full" | "pii-table";
  tableName: string;
  dbLoading: boolean;
  setDbConnString: (val: string) => void;
  setDbScanType: (val: "pii-meta" | "pii-full" | "pii-table") => void;
  setTableName: (val: string) => void;
  runDbScan: () => void;
  selectedPiiTypes: string[];
  setSelectedPiiTypes: (types: string[]) => void;
  dbType: string;
  setDbType: (val: string) => void;

  connectionMode: "string" | "params";
  setConnectionMode: (val: "string" | "params") => void;
  host: string;
  setHost: (val: string) => void;
  port: string;
  setPort: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  database: string;
  setDatabase: (val: string) => void;
}

const DbScanForm: React.FC<DbScanFormProps> = ({
  dbConnString,
  dbScanType,
  tableName,
  dbLoading,
  setDbConnString,
  setDbScanType,
  setTableName,
  runDbScan,
  selectedPiiTypes,
  setSelectedPiiTypes,
  dbType,
  setDbType,
  connectionMode,
  setConnectionMode,
  host,
  setHost,
  port,
  setPort,
  username,
  setUsername,
  password,
  setPassword,
  database,
  setDatabase,
}) => {
  return (
    <>
      <h2 className="text-xl font-bold text-blue-800 mb-4">DB Scan</h2>
      <div className="space-y-4 mb-6">
        {/* DB Type Selector */}
        <label
          htmlFor="db-type-select"
          className="block font-semibold text-gray-700 "
        >
          Database Type
        </label>
        <select
          id="db-type-select"
          value={dbType}
          onChange={(e) => setDbType(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="postgres">Postgres</option>
          <option value="mysql">MySQL</option>
          <option value="oracle">Oracle</option>
        </select>

        <div className="space-y-4 mb-6">
          <div className=" ">
            <p className="font-semibold text-gray-700">Connection type</p>
            <label className="block text-sm font-medium text-gray-500">
              <div className="flex space-x-4 mt-2">
                <label className="flex gap-1">
                  <input
                    className=""
                    type="radio"
                    name="connectionMode"
                    value="string"
                    checked={connectionMode === "string"}
                    onChange={() => setConnectionMode("string")}
                  ></input>
                  <p>Connection String</p>
                </label>

                <label className="flex gap-1">
                  <input
                    type="radio"
                    name="ConnectionMode"
                    value="params"
                    checked={connectionMode === "params"}
                    onChange={() => setConnectionMode("params")}
                  ></input>
                  <p>Connection Parameter</p>
                </label>
              </div>
            </label>
          </div>
        </div>
        {connectionMode === "string" && (
          <>
            {/* Connection String */}
            <label
              htmlFor="db-conn-string"
              className="block text-sm font-medium text-gray-700"
            >
              DB Connection String
            </label>
            <input
              id="db-conn-string"
              type="text"
              value={dbConnString}
              onChange={(e) => setDbConnString(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              title="Enter database connection string"
              placeholder="Database connection string"
            />
          </>
        )}
        {connectionMode === "params" && (
          <div>
            <div className="grid grid-cols-2 gap-1.5">
              <label className=" ">
                <p>Host</p>
                <input
                  className=" border rounded pl-1 border-gray-300"
                  type="text"
                  value={host}
                  placeholder="host"
                  onChange={(e) => setHost(e.target.value)}
                ></input>
              </label>

              <label className=" ">
                <p>Port</p>
                <input
                  className=" border rounded pl-1 border-gray-300"
                  type="text"
                  value={port}
                  placeholder="3006"
                  onChange={(e) => setPort(e.target.value)}
                ></input>
              </label>

              <label className=" ">
                <p>UserName</p>
                <input
                  className=" border rounded pl-1 border-gray-300"
                  type="text"
                  value={username}
                  placeholder="classify_user"
                  onChange={(e) => setUsername(e.target.value)}
                ></input>
              </label>

              <label className=" ">
                <p>Password</p>
                <input
                  className=" border rounded pl-1 border-gray-300"
                  type="text"
                  value={password}
                  placeholder="password"
                  onChange={(e) => setPassword(e.target.value)}
                ></input>
              </label>

              <label className=" ">
                <p>Database</p>
                <input
                  className=" border rounded pl-1 border-gray-300"
                  type="text"
                  value={database}
                  placeholder="classify_db"
                  onChange={(e) => setDatabase(e.target.value)}
                ></input>
              </label>
            </div>
          </div>
        )}
        {/* Scan Type */}
        <>
          <label
            htmlFor="scan-type-select"
            className="block text-sm font-medium text-gray-700"
          >
            Scan Type
          </label>
          <select
            id="scan-type-select"
            value={dbScanType}
            onChange={(e) =>
              setDbScanType(
                e.target.value as "pii-meta" | "pii-full" | "pii-table"
              )
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="pii-meta">Metadata Only</option>
            <option value="pii-full">Full Scan</option>
            <option value="pii-table">Single Table</option>
          </select>
        </>
        {/* Table Name */}
        <>
          {dbScanType === "pii-table" && (
            <>
              <label
                htmlFor="table-name"
                className="block text-sm font-medium text-gray-700"
              >
                Table Name
              </label>
              <input
                id="table-name"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g. customers"
              />
            </>
          )}
        </>

        {/* PII Type Selector */}
        <>
          {(dbScanType === "pii-full" || dbScanType === "pii-table") && (
            <PiiTypeSelector
              selected={selectedPiiTypes}
              setSelected={setSelectedPiiTypes}
            />
          )}
        </>

        {/* Run Scan Button */}
        <>
          <button
            onClick={runDbScan}
            className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={
              dbLoading ||
              (connectionMode === "string" && !dbConnString) ||
              (connectionMode === "params" &&
                (!host || !port || !username || !password || !database))
            }
          >
            Run DB Scan
          </button>
        </>
      </div>
    </>
  );
};

export default DbScanForm;
