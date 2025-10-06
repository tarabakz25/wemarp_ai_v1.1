"use client";
import { useState, useEffect } from "react";

export default function LLMTestPage() {
  // デバッグ用の環境変数表示
  useEffect(() => {
    console.log("Environment check:", {
      hasApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      apiKeyPrefix: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 7) || "none",
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL,
      baseUrl: process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL
    });
  }, []);
  const [instructin, setInstruction] = useState("");
  const [userInput, setUserIput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const run = async () => {
    const now = Date.now();
    const minInterval = 3000; // 3 seconds minimum between requests

    if (now - lastRequestTime < minInterval) {
      const remainingTime = Math.ceil((minInterval - (now - lastRequestTime)) / 1000);
      setCooldownTime(remainingTime);
      return;
    }

    setLoading(true);
    setResponse(null);
    setLastRequestTime(now);

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instructin,
          userInput,
          maxTokens: 500,
          temprature: 0.7,
        }),
      });
      const data = await res.json();
      console.log("/api/llm response:", data);
      if (res.ok) {
        const text = typeof data?.text === "string" ? data.text : "";
        setResponse(text !== "" ? text : JSON.stringify(data, null, 2));
      } else {
        let errorMessage = data.error || "Unknown error";
        if (res.status === 429) {
          errorMessage = "レート制限に達しました。しばらく待ってから再試行してください。";
        } else if (res.status === 401) {
          errorMessage = "認証エラーです。APIキーを確認してください。";
        } else if (res.status === 500) {
          errorMessage = "サーバーエラーです。しばらく待ってから再試行してください。";
        }
        setResponse(`エラー (${res.status}): ${errorMessage}`);
        console.error("API Error:", { status: res.status, error: data.error });
      }
    }
    catch (error: any) {
      setResponse(`Error: ${error.message || "Unknown error"}`);
    }
    finally {
      setLoading(false);
    }
  };

  // Countdown effect for cooldown time
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold mb-4">LLM Test Page</h1>
      <div className="mb-4">
        <label className="block font-medium mb-1">Instruction:</label>
        <textarea
          className="w-full border border-gray-300 rounded p-2"
          rows={4}
          value={instructin}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">User Input (optional):</label>
        <textarea
          className="w-full border border-gray-300 rounded p-2"
          rows={4}
          value={userInput}
          onChange={(e) => setUserIput(e.target.value)}
        />
      </div>
      <button
        className={`px-4 py-2 rounded ${
          loading || !instructin.trim() || cooldownTime > 0
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
        }`}
        onClick={run}
        disabled={loading || !instructin.trim() || cooldownTime > 0}
      >
        {loading
          ? "Running..."
          : cooldownTime > 0
          ? `Wait ${cooldownTime}s`
          : "Run"
        }
      </button>
      {response !== null && (
        <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50 whitespace-pre-wrap">
          {response === "" ? "(empty)" : response}
        </div>
      )}  
    </div>
  )
}
