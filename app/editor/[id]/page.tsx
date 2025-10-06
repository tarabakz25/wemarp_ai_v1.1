import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditorClient from "./editor-client";

export default async function EditorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
      ownerId: session.user.id,
    },
    include: {
      currentVersion: true,
      versions: {
        orderBy: { versionNo: "desc" },
        take: 5,
      },
    },
  });

  if (!project) {
    redirect("/dashboard");
  }

  return (
    <EditorClient
      project={project}
      currentVersion={project.currentVersion}
      recentVersions={project.versions}
    />
  );
}
