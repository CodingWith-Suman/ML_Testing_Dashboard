import axios from "axios";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "../../prisma/generated/prisma";

const DB_scan_URL = "http://localhost:5000";
const router = Router();
const prisma = new PrismaClient();

type ConnStringPayload = {
  conn_string: string;
  db_type: string;
  pii_types?: string | string[];
};

type ParamsPayload = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  db_type: string;
  pii_types?: string | string[];
};

router.post(
  "/db-pii",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      conn_string,
      scan_type,
      pii_types,
      db_type,
      host,
      port,
      username,
      password,
      database,
    } = req.body;

    let payload: ConnStringPayload | ParamsPayload;

    if (conn_string && conn_string.trim() !== "") {
      // Use connection string
      payload = { conn_string, db_type };
    } else {
      // Use raw parameters
      if (!host || !port || !username || !password || !database) {
        res.status(400).json({ error: "Missing DB connection parameters" });
        return;
      }
      payload = { host, port, username, password, database, db_type };
    }

    if (pii_types) {
      (payload as any).pii_types = pii_types;
    }

    let endpoint = "";
    let scanTypeEnum: "PII_META" | "PII_FULL" | "PII_TABLE";

    switch (scan_type) {
      case "pii-meta":
        endpoint = "/metadata-classify";
        scanTypeEnum = "PII_META";
        break;
      case "pii-full":
        endpoint = "/full-pii-scan";
        scanTypeEnum = "PII_FULL";
        break;
      case "pii-table":
        endpoint = "/table-pii-scan";
        scanTypeEnum = "PII_TABLE";
        break;
      default:
        res.status(400).json({ error: "Invalid pii scan type" });
        return;
    }

    try {
      const response = await axios.post(`${DB_scan_URL}${endpoint}`, payload);
      const scanData = response.data.results;

      // Prisma logic remains unchanged
      const user = await prisma.user.upsert({
        where: { email: "johndoe@example.com" },
        update: {},
        create: {
          email: "johndoe@example.com",
          role: "SCANNER",
          firstName: "Seeded",
          lastName: "User",
        },
      });

      const batch = await prisma.batch.create({
        data: {
          scanType: "DB_SCAN",
          creatorId: user.id,
          totalNumFiles: 1,
        },
      });

      const dbRecord = await prisma.db.create({
        data: {
          databaseName: scanData.metadata.db_Name,
          scanType: scanTypeEnum,
          dbType: db_type.toUpperCase(),
          batchId: batch.id,
          totalNumOfTableScans: scanData.table_scans.length,
        },
      });

      for (const table of scanData.metadata.table_metadata) {
        await prisma.dbFullPiiMetadata.create({
          data: {
            tableName: table.name,
            rowCount: parseInt(table.rowCount),
            pii: table.classifications.pii,
            identifiers: table.classifications.identifiers,
            behavioral: table.classifications.Behavioral,
            owner: table.owner,
            dbId: dbRecord.id,
          },
        });
      }

      if (scan_type !== "pii-meta") {
        for (const table of scanData.table_scans) {
          for (const column of table.columns) {
            await prisma.dbFullPiiResult.create({
              data: {
                tableName: table.name,
                columnName: column.name,
                datatype: column.DataType,
                classification: column.classifications as any,
                scanned: column.scaned,
                matched: column.matched,
                accuracy: parseFloat(column.accuracy),
                dbId: dbRecord.id,
              },
            });
          }
        }
      }

      res.json({ status: "DB scan complete", batchId: batch.id, scanData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to query the DB scan server" });
    }
  })
);

export default router;
