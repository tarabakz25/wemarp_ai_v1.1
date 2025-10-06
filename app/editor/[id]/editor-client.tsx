"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Version {
  id: string;
  versionNo: number;
  marpMd: string;
  status: string;
  createdAt: Date;
}

interface Project {
  id: string;
  title: string;
  description?: string | null;
}

interface EditorClientProps {
  project: Project;
  currentVersion: Version | null;
  recentVersions: Version[];
}

export default function EditorClient({
  project,
  currentVersion,
  recentVersions,
}: EditorClientProps) {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(currentVersion?.marpMd || "");
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("default");

  // Generate HTML preview using marp-core (client-side)
  useEffect(() => {
    const generatePreview = async () => {
      try {
        const { Marp } = await import("@marp-team/marp-core");
        const marp = new Marp();
        const { html, css } = marp.render(markdown);
        
        // Combine CSS and HTML for preview
        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>${css}</style>
              <style>
                body { margin: 0; padding: 20px; background: #f0f0f0; }
                section { 
                  margin: 20px auto; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  background: white;
                }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `;
        
        setPreview(fullHtml);
      } catch (err) {
        console.error("Preview error:", err);
        setPreview("<p>Preview error</p>");
      }
    };

    if (markdown) {
      generatePreview();
    }
  }, [markdown]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marpMd: markdown }),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      // Refresh the page to get updated version list
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (type: "png" | "pdf" | "md") => {
    if (type === "md") {
      // Direct download of markdown
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // TODO: Implement PNG/PDF export via backend
    alert(`${type.toUpperCase()} export coming soon!`);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-600 hover:text-gray-900"
          >
            ← ダッシュボード
          </button>
          <h1 className="text-xl font-bold">{project.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="gaia">Gaia</option>
            <option value="uncover">Uncover</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {saving ? "保存中..." : "保存"}
          </button>

          <div className="relative group">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
              エクスポート
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
              <button
                onClick={() => handleExport("md")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport("png")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                PNG画像
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b text-sm font-medium">
            Markdown Editor
          </div>
          <textarea
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Marp Markdownを入力..."
          />
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          <div className="bg-gray-100 px-4 py-2 border-b text-sm font-medium">
            プレビュー
          </div>
          <div className="flex-1 overflow-auto">
            <iframe
              srcDoc={preview}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        </div>
      </div>

      {/* Version History Sidebar */}
      <div className="fixed right-4 bottom-4 w-64 bg-white rounded-lg shadow-lg border p-4 max-h-96 overflow-auto">
        <h3 className="font-bold mb-2">バージョン履歴</h3>
        <div className="space-y-2">
          {recentVersions.map((v) => (
            <button
              key={v.id}
              onClick={() => setMarkdown(v.marpMd)}
              className="block w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
            >
              <div className="font-medium">v{v.versionNo}</div>
              <div className="text-xs text-gray-500">
                {new Date(v.createdAt).toLocaleString("ja-JP")}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
