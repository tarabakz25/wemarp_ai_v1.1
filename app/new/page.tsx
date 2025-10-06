"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("default");
  const [tone, setTone] = useState<"academic" | "business" | "casual">("business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, theme, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました");
      }

      // Redirect to editor
      router.push(`/editor/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">新規スライド作成</h1>

        <div className="space-y-6">
          <div>
            <label className="block font-medium mb-2">
              スライドの内容を説明してください
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 min-h-32"
              placeholder="例: AIの歴史と未来について10枚のスライドを作成してください"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">テーマ</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={loading}
              >
                <option value="default">Default</option>
                <option value="gaia">Gaia</option>
                <option value="uncover">Uncover</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">トーン</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                disabled={loading}
              >
                <option value="business">ビジネス</option>
                <option value="academic">学術</option>
                <option value="casual">カジュアル</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "生成中..." : "スライドを生成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
