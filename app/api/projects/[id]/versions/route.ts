import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const projectId = params.id;
    const { marpMd } = await request.json();

    if (!marpMd || typeof marpMd !== "string") {
      return NextResponse.json({ error: "marpMd is required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId, ownerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get next version number
    const lastVersion = await prisma.version.findFirst({
      where: { projectId },
      orderBy: { versionNo: "desc" },
    });
    const nextVersionNo = (lastVersion?.versionNo ?? 0) + 1;

    // Create new version
    const version = await prisma.version.create({
      data: {
        projectId,
        versionNo: nextVersionNo,
        marpMd,
        status: "edited",
        createdById: userId,
      },
    });

    // Update project's currentVersionId and updatedAt
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentVersionId: version.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      versionId: version.id,
      versionNo: nextVersionNo,
    });
  } catch (error: any) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
