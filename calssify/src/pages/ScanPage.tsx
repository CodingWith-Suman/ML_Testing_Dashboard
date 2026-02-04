
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import ModeSelector from "../components/ui/ModeSelector";

import ImageScanUpload from "../components/ui/ImageScanUpload";
import ImageResultsTable from "../components/results/ImageResultsTable";

import DbScanForm from "../components/DbScanForm";
import DbScanMetadata, { type TableMetadata } from "../components/results/DbScanMetadata";
import DbResultsTable, { type TableScan } from "../components/results/DbResultsTable";

import DocumentUploader from "../components/forms/DocumentUploader";
import DocumentPiiResultsTable from "../components/results/DocumentPiiResultsTable";

import PiiTypeSelector from "../components/forms/PiiTypeSelector";
import type { ClassificationResult, DocumentPiiResult, PayloadType } from "../types/types";

const Scan: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab =
    (searchParams.get("tab") as "image" | "db" | "document-pii") ?? "image";
  const setCurrentTab = (tab: "image" | "db" | "document-pii") => setSearchParams({ tab });

  const [selectedPiiTypes, setSelectedPiiTypes] = useState<string[]>([]);

  // ===== Image states =====
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageResults, setImageResults] = useState<ClassificationResult[]>([]);
  const [imageProgress, setImageProgress] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageMode, setImageMode] = useState<"classify" | "metadata">("classify");

  // ===== DB states =====
  const [dbConnString, setDbConnString] = useState<string>("");
  const [dbScanType, setDbScanType] = useState<"pii-meta" | "pii-full" | "pii-table">("pii-full");
  const [tableName, setTableName] = useState<string>("");
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbResults, setDbResults] = useState<TableScan[]>([]);
  const [dbResultsMetadata, setDbResultsMetadata] =
    useState<{ db_Name: string; table_metadata: TableMetadata[] } | null>(null);

  // ✅ NEW: DB Type + Connection Mode & Parameters
  const [dbType, setDbType] = useState<string>("postgres");
  const [connectionMode, setConnectionMode] = useState<"string" | "params">("string");
  const [host, setHost] = useState<string>("");
  const [port, setPort] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [database, setDatabase] = useState<string>("");

  // ===== Document states =====
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [documentPiiResults, setDocumentPiiResults] = useState<DocumentPiiResult[]>([]);
  const [docPiiLoading, setDocPiiLoading] = useState(false);
  const [docPiiProgress, setDocPiiProgress] = useState(0);

  // ===== WS refs =====
  const wsRef = useRef<WebSocket | null>(null);
  const requestId = useRef<string>(uuidv4());

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setImageResults([]);
    setImageFiles([]);
    setDbResults([]);
    setDocumentPiiResults([]);
    setDocFiles([]);
  }, [currentTab]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ===== Image helpers =====
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles(Array.from(e.target.files));
  };

  const toggleImageMetadata = (index: number) => {
    setImageResults((prev) =>
      prev.map((res, i) => (i === index ? { ...res, showMetadata: !res.showMetadata } : res))
    );
  };

  const uploadImageScan = async (scanType: "classify" | "metadata") => {
    if (imageFiles.length === 0 || imageLoading) return;
    setImageLoading(true);
    setImageMode(scanType);
    setImageProgress(10);
    setImageResults([]);
    const id = "cmgkgxt5a0000le6041a90zln";
    requestId.current = id;
    if (wsRef.current) wsRef.current.close();
    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;
    socket.onopen = () => {
      socket.send(JSON.stringify({ id }));
      setTimeout(async () => {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("images", file));
        try {
          await axios.post(`http://localhost:3000/image?id=${id}&type=${scanType}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          setImageLoading(false);
          setImageProgress(0);
          wsRef.current?.close();
        }
      }, 100);
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;
      if (data.done) return socket.close();
      setImageResults((prev) => [
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data.batch ?? []).map((r: any) => ({ ...r, showMetadata: false })),
      ]);
      setImageProgress((prev) => Math.min(prev + 15, 95));
    };
    socket.onerror = () => {
      setImageLoading(false);
      setImageProgress(0);
      socket.close();
    };
    socket.onclose = () => {
      setDocPiiProgress(100);
      setTimeout(() => {
        setImageLoading(false);
        setImageProgress(0);
      }, 500);
    };
  };

  // ===== Document helpers =====
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDocFiles(Array.from(e.target.files));
  };

  const toggleDocPiiMetadata = (index: number) => {
    setDocumentPiiResults((prev) =>
      prev.map((res, i) => (i === index ? { ...res, showMetadata: !res.showMetadata } : res))
    );
  };

  const uploadDocumentPii = async () => {
    if (docFiles.length === 0 || docPiiLoading) return;
    setDocPiiLoading(true);
    setDocPiiProgress(10);
    setDocumentPiiResults([]);
    const id = uuidv4();
    requestId.current = id;
    if (wsRef.current) wsRef.current.close();
    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;
    socket.onopen = () => {
      socket.send(JSON.stringify({ id, type: "document-pii" }));
      setTimeout(async () => {
        const formData = new FormData();
        docFiles.forEach((file) => formData.append("files", file));
        selectedPiiTypes.forEach((type) => formData.append("pii_types", type));
        try {
          await axios.post(`http://localhost:3000/document-pii?id=${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          setDocPiiLoading(false);
          setDocPiiProgress(0);
          wsRef.current?.close();
        }
      }, 100);
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;
      if (Array.isArray(data.batch)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDocumentPiiResults(data.batch.map((r: any) => ({ ...r, showMetadata: false })));
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      } else if (data.batch) {
        setDocumentPiiResults([{ ...data.batch, showMetadata: false }]);
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      }
      if (data.error) {
        setDocumentPiiResults([
          { file_name: "Error", pii_found: false, error: data.error, showMetadata: false },
        ]);
        setDocPiiLoading(false);
        setDocPiiProgress(0);
      }
      if (data.done) {
        socket.close();
        setDocPiiProgress(100);
      }
    };
    socket.onerror = () => {
      setDocPiiLoading(false);
      setDocPiiProgress(0);
      socket.close();
    };
    socket.onclose = () => {
      setTimeout(() => {
        setDocPiiLoading(false);
        setDocPiiProgress(0);
      }, 500);
    };
  };

  // ===== DB helpers =====
  const toggleDbMetadata = (index: number) => {
    setDbResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, showMetadata: !r.showMetadata } : r))
    );
  };

  const runDbScan = async () => {
    // Guard: require either a full connection string OR all param fields filled
    if (connectionMode === "string" && !dbConnString.trim()) return;
    if (
      connectionMode === "params" &&
      (!host.trim() || !port.trim() || !username.trim() || !database.trim())
    ) {
      // You can surface a toast/snackbar here to inform missing fields.
      return;
    }

    setDbLoading(true);
    setDbResults([]);
    setDbResultsMetadata(null);

    // ✅ Build payload based on selected connection mode
    const payload: PayloadType = {
        scan_type: dbScanType,
        db_type: dbType,
        host: "",
        conn_string: "",
        port: 0,
        username: "",
        password: "",
        database: ""
    };

    if (connectionMode === "string") {
      payload.conn_string = dbConnString;
    } else {
      // Use conventional keys (confirm with your backend contract)
      payload.host = host;
      payload.port = Number(port); // port as number
      payload.username = username;
      payload.password = password;
      payload.database = database;
    }

    if (dbScanType === "pii-table" && tableName.trim()) {
      payload.table_name = tableName.toLowerCase();
    }

    if (selectedPiiTypes.length > 0) {
      payload.pii_types = selectedPiiTypes;
    }

    try {
      const res = await axios.post("http://localhost:3000/db-pii", payload, {
        headers: { "Content-Type": "application/json" },
      });
      const rawData = res.data?.data || res.data;
      const metadata = rawData.scanData.metadata;
      setDbResultsMetadata(metadata);
      const tableScans: TableScan[] = rawData.scanData.table_scans;
      setDbResults(tableScans);
    } catch (err) {
      console.error("DB scan failed:", err);
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          {currentTab === "image" && "ID Scan"}
          {currentTab === "db" && "Database Scan"}
          {currentTab === "document-pii" && "Document Scan"}
        </h1>

        <div className="container mx-auto p-4">
          <ModeSelector currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>

        {currentTab === "image" && (
          <section>
            <ImageScanUpload
              imageLoading={imageLoading}
              imageFiles={imageFiles}
              handleImageFileChange={handleImageFileChange}
              uploadImageScan={uploadImageScan}

            />
            {imageLoading && (
              <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                <div
                  className="bg-blue-600 h-full transition-all duration-200"
                  style={{ width: `${imageProgress}%` }}
                />
              </div>
            )}
            {imageResults.length > 0 && (
              <ImageResultsTable
                results={imageResults}
                imageMode={imageMode}
                onToggleMetadata={toggleImageMetadata}
              />
            )}
          </section>
        )}

        {currentTab === "db" && (
          <section>
            <DbScanForm
              dbConnString={dbConnString}
              dbScanType={dbScanType}
              tableName={tableName}
              dbLoading={dbLoading}
              setDbConnString={setDbConnString}
              setDbScanType={setDbScanType}
              setTableName={setTableName}
              runDbScan={runDbScan}
              selectedPiiTypes={selectedPiiTypes}
              setSelectedPiiTypes={setSelectedPiiTypes}
              // ✅ NEW props for DB type + connection modes/params
              dbType={dbType}
              setDbType={setDbType}
              connectionMode={connectionMode}
              setConnectionMode={setConnectionMode}
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              database={database}
              setDatabase={setDatabase}
            />
            {dbLoading && (
              <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6 mt-1">
                <div className="bg-blue-600 h-full w-[50%] transition-all duration-200" />
              </div>
            )}
            {dbResults.length > 0 && (
              <div className="overflow-x-auto mt-6">
                {dbResultsMetadata && <DbScanMetadata metadata={dbResultsMetadata} />}
                <DbResultsTable results={dbResults} onToggleMetadata={toggleDbMetadata} />
              </div>
            )}
          </section>
        )}

        {currentTab === "document-pii" && (
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-4">Document PII Scan</h2>
            <PiiTypeSelector selected={selectedPiiTypes} setSelected={setSelectedPiiTypes} />
            <DocumentUploader
              docPiiLoading={docPiiLoading}
              docFiles={docFiles}
              docPiiProgress={docPiiProgress}
              handleDocFileChange={handleDocFileChange}
              uploadDocumentPii={uploadDocumentPii}
            />
            {docPiiLoading && (
              <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                <div
                  className="bg-purple-600 h-full transition-all duration-200"
                  style={{ width: `${docPiiProgress}%` }}
                />
              </div>
            )}
            {documentPiiResults.length > 0 && (
              <DocumentPiiResultsTable
                results={documentPiiResults}
                loading={docPiiLoading}
                onToggleMetadata={toggleDocPiiMetadata}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Scan;
