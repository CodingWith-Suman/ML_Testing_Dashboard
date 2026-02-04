import { Router, Request, Response } from "express";
import { PrismaClient } from "../../prisma/generated/prisma";
import asyncHandler from "express-async-handler";

const router = Router();
const prisma = new PrismaClient();

/** -----------------------------
 *Scan Counter (Weekly, Monthly, Quarterly)
 * ----------------------------- */
router.get(
  "/scanCounter",
  asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();

    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);

    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const lastQuarter = new Date();
    lastQuarter.setMonth(now.getMonth() - 3);

    const weeklyStats = await prisma.batch.aggregate({
      _sum: { totalNumFiles: true },
      where: { createdAt: { gte: lastWeek, lte: now } },
    });

    const monthlyStats = await prisma.batch.aggregate({
      _sum: { totalNumFiles: true },
      where: { createdAt: { gte: lastMonth, lte: now } },
    });

    const quarterlyStats = await prisma.batch.aggregate({
      _sum: { totalNumFiles: true },
      where: { createdAt: { gte: lastQuarter, lte: now } },
    });

    res.json({
      weeklyFilesScanned: weeklyStats._sum.totalNumFiles || 0,
      monthlyFilesScanned: monthlyStats._sum.totalNumFiles || 0,
      quarterlyFilesScanned: quarterlyStats._sum.totalNumFiles || 0,
    });
  })
);
/*--------------------------------
Scan type distribution over time
----------------------------------*/
router.get(
  "/scan-type-distribution",
  asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();

    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);

    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const lastQuarter = new Date();
    lastQuarter.setMonth(now.getMonth() - 3);

    // Helper to count by scanType
    const getCounts = async (start: Date, end: Date) => {
      const grouped = await prisma.batch.groupBy({
        by: ["scanType"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { _all: true },
      });
      return grouped.map((g) => ({ name: g.scanType, value: g._count._all }));
    };

    const weekly = await getCounts(lastWeek, now);
    const monthly = await getCounts(lastMonth, now);
    const quarterly = await getCounts(lastQuarter, now);

    res.json({ weekly, monthly, quarterly });
  })
);

/** -----------------------------
 *Image Scan Dashboard
 * ----------------------------- */
router.get(
  "/image-scan",
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.query;

    const labelCounts = await prisma.imageResult.groupBy({
      by: ["label"],
      where: batchId ? { batchId: String(batchId) } : undefined,
      _count: { _all: true },
    });

    const rows = await prisma.imageResult.findMany({
      where: batchId ? { batchId: String(batchId) } : undefined,
      select: { confidence: true },
    });

    const buckets = [
      { name: "0-20", min: 0, max: 20, value: 0 },
      { name: "21-40", min: 21, max: 40, value: 0 },
      { name: "41-60", min: 41, max: 60, value: 0 },
      { name: "61-80", min: 61, max: 80, value: 0 },
      { name: "81-100", min: 81, max: 100, value: 0 },
    ];

    rows.forEach(({ confidence }) => {
      for (const b of buckets) {
        if (confidence >= b.min && confidence <= b.max) {
          b.value += 1;
          break;
        }
      }
    });

    res.json({
      labels: labelCounts.map((r) => ({
        label: r.label,
        value: r._count._all,
      })),
      confidenceBuckets: buckets,
    });
  })
);

/** -----------------------------
 *Document Scan Dashboard
 * ----------------------------- */
router.get(
  "/document-scan",
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.query;

    const piiFoundCounts = await prisma.documentResult.groupBy({
      by: ["piiFound"],
      where: batchId ? { batchId: String(batchId) } : undefined,
      _count: { _all: true },
    });

    const typeCounts = await prisma.documentResult.groupBy({
      by: ["fileType"],
      where: batchId ? { batchId: String(batchId) } : undefined,
      _count: { _all: true },
    });

    const classificationSums = await prisma.documentClassification.groupBy({
      by: ["piiType"],
      where: batchId ? { document: { batchId: String(batchId) } } : undefined,
      _sum: { count: true },
    });

    res.json({
      piiFoundCounts: piiFoundCounts.map((r) => ({
        name: r.piiFound ? "PII Found" : "No PII",
        value: r._count._all,
      })),
      typeCounts: typeCounts.map((r) => ({
        name: r.fileType || "Unknown",
        value: r._count._all,
      })),
      classificationSums: classificationSums.map((r) => ({
        name: r.piiType,
        value: r._sum.count || 0,
      })),
    });
  })
);

/** -----------------------------
 *Database Scan Dashboard
 * ----------------------------- */
router.get(
  "/db-scan",
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.query;

    const classificationCounts = await prisma.dbFullPiiResult.groupBy({
      by: ["classification"],
      where: batchId ? { db: { batchId: String(batchId) } } : undefined,
      _count: { _all: true },
      _sum: { matched: true },
    });

    const metadata = await prisma.dbFullPiiMetadata.findMany({
      where: batchId ? { db: { batchId: String(batchId) } } : undefined,
      select: {
        tableName: true,
        rowCount: true,
        pii: true,
        identifiers: true,
        behavioral: true,
        owner: true,
      },
      orderBy: { tableName: "asc" },
    });

    res.json({
      classificationCounts: classificationCounts.map((r) => ({
        name: r.classification || "Unknown",
        count: r._count._all,
        matched: r._sum.matched || 0,
      })),
      metadata,
    });
  })
);

export default router;
