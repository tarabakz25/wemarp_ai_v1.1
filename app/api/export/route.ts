import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Export API - Creates export job for PNG/PDF generation
 * 
 * NOTE: Actual rendering with Marp CLI requires Node.js runtime and Puppeteer,
 * which is not available in Edge runtime. This should be moved to:
 * 1. Vercel Serverless Function (Node.js runtime)
 * 2. Background job worker
 * 3. Separate render service
 * 
 * For MVP, this endpoint creates the job record.
 * Actual rendering will be implemented in Phase 2.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { versionId, type } = await request.json();

    if (!versionId || !type) {
      return NextResponse.json(
        { error: "versionId and type are required" },
        { status: 400 }
      );
    }

    if (!["png", "pdf", "html"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid export type" },
        { status: 400 }
      );
    }

    // Verify version ownership
    const version = await prisma.version.findUnique({
      where: { id: versionId },
      include: {
        project: true,
      },
    });

    if (!version || version.project.ownerId !== userId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Create export job
    const exportJob = await prisma.export.create({
      data: {
        versionId,
        type: type as any,
        status: "queued",
        createdById: userId,
      },
    });

    // TODO: Trigger background job for actual rendering
    // For now, mark as queued and return job ID

    return NextResponse.json({
      success: true,
      exportId: exportJob.id,
      status: "queued",
      message: "Export job created. Background processing will complete shortly.",
    });
  } catch (error: any) {
    console.error("Error creating export:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get("id");

    if (!exportId) {
      return NextResponse.json({ error: "Export ID required" }, { status: 400 });
    }

    const exportJob = await prisma.export.findUnique({
      where: { id: exportId },
      include: {
        version: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!exportJob || exportJob.version.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: exportJob.id,
      type: exportJob.type,
      status: exportJob.status,
      storagePath: exportJob.storagePath,
      errorText: exportJob.errorText,
      createdAt: exportJob.createdAt,
    });
  } catch (error: any) {
    console.error("Error fetching export:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
