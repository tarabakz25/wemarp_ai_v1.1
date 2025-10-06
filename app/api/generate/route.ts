import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLLMClient } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { buildMarpPrompt, extractMarpMarkdown, validateMarpMarkdown } from "@/lib/prompts/marp-generator";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { prompt, theme = "default", tone = "business", projectId } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Check usage quota (simple implementation - can be enhanced)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayGenerations = await prisma.generation.count({
      where: {
        createdById: userId,
        createdAt: { gte: today },
      },
    });

    const FREE_DAILY_LIMIT = 20;
    if (todayGenerations >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily generation limit reached (20/day for free users)" },
        { status: 429 }
      );
    }

    // Generate Marp Markdown via LLM
    const marpPrompt = buildMarpPrompt({ userPrompt: prompt, theme, tone });
    const client = getLLMClient();
    const startTime = Date.now();
    
    const llmResult = await client.generate({
      instruction: marpPrompt,
      maxTokens: 2048,
    });

    const duration = Date.now() - startTime;
    const rawMd = extractMarpMarkdown(llmResult.text);
    
    // Validate Marp Markdown
    const validation = validateMarpMarkdown(rawMd);
    if (!validation.valid) {
      console.error("Invalid Marp MD:", validation.error);
      return NextResponse.json(
        { error: `Invalid Marp output: ${validation.error}` },
        { status: 500 }
      );
    }

    // Create or use existing project
    let project;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId, ownerId: userId },
      });
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    } else {
      // Create new project with auto-generated title
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
      project = await prisma.project.create({
        data: {
          title,
          ownerId: userId,
        },
      });
    }

    // Get next version number
    const lastVersion = await prisma.version.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNo: "desc" },
    });
    const nextVersionNo = (lastVersion?.versionNo ?? 0) + 1;

    // Create version
    const version = await prisma.version.create({
      data: {
        projectId: project.id,
        versionNo: nextVersionNo,
        marpMd: rawMd,
        llmModel: llmResult.model,
        promptSnapshot: prompt,
        status: "generated",
        createdById: userId,
      },
    });

    // Update project's currentVersionId
    await prisma.project.update({
      where: { id: project.id },
      data: { currentVersionId: version.id },
    });

    // Log generation
    await prisma.generation.create({
      data: {
        projectId: project.id,
        versionId: version.id,
        status: "succeeded",
        model: llmResult.model,
        prompt,
        response: rawMd.slice(0, 1000), // Store first 1KB
        tokenUsage: llmResult.usage as any,
        metadata: { duration, theme, tone },
        createdById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      versionId: version.id,
      versionNo: nextVersionNo,
      marpMd: rawMd,
      model: llmResult.model,
    });
  } catch (error: any) {
    console.error("Error in /api/generate:", {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });

    let message = error?.message || "Internal Server Error";
    let status = 500;

    if (message.includes("429") || message.includes("rate limit")) {
      status = 429;
      message = "LLM API rate limit reached. Please try again later.";
    } else if (message.includes("401") || message.includes("authentication")) {
      status = 401;
      message = "LLM API authentication failed.";
    }

    return NextResponse.json({ error: message }, { status });
  }
}
