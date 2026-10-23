"use client";
import { useState } from "react";
import AdminShell from "../AdminShell";

const navy = "#0A2333";
const orange = "#F97316";

function compressImage(file: File, maxPx = 1024, q = 0.85): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else { width = Math.round(width * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", q);
      resolve({ base64: dataUrl.split(",")[1], type: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function MarkdownRenderer({ md }: { md: string }) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let inCode = false;
  let codeLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={i} style={{ background: "#1e293b", color: "#e2e8f0", padding: "14px 16px", borderRadius: 8, overflowX: "auto", fontSize: 12.5, lineHeight: 1.6, margin: "8px 0 16px" }}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) { codeLines.push(line); i++; continue; }

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} style={{ fontSize: 20, fontWeight: 800, color: navy, margin: "0 0 16px" }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: navy, margin: "20px 0 8px", paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} style={{ fontSize: 13.5, fontWeight: 700, color: "#374151", margin: "14px 0 6px" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} style={{ fontSize: 13.5, color: "#374151", marginBottom: 4, marginLeft: 16 }}>{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={{ fontSize: 13.5, color: "#374151", margin: "0 0 8px", lineHeight: 1.6 }}>{renderInline(line)}</p>);
    }
    i++;
  }

  return <div style={{ lineHeight: 1.7 }}>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: "0.9em", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

export default function PrimaryImagePage() {
  const [productImages, setProductImages] = useState<{ base64: string; type: string; name: string }[]>([]);
  const [competitor, setCompetitor] = useState<{ base64: string; type: string } | null>(null);
  const [competitorName, setCompetitorName] = useState("");
  const [sqpText, setSqpText] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProductImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    setProductImages(compressed.map((c, i) => ({ ...c, name: files[i].name })));
    e.target.value = "";
  }

  async function handleCompetitor(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { base64, type } = await compressImage(file, 2048, 0.9);
    setCompetitor({ base64, type });
    setCompetitorName(file.name);
    e.target.value = "";
  }

  async function generate() {
    if (!competitor || productImages.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const token = typeof window !== "undefined" ? (localStorage.getItem("vc_admin_token") ?? "") : "";

    try {
      const res = await fetch("/api/admin/primary-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ productImages, competitorScreenshot: competitor, sqpData: sqpText || undefined, productName: productName || undefined }),
      });
      const data = await res.json() as { markdown?: string; error?: string };
      if (!res.ok || !data.markdown) throw new Error(data.error ?? "Generation failed");
      setResult(data.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadMd() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productName || "product"}-primary-image-hypotheses.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canGenerate = productImages.length > 0 && competitor !== null && !loading;

  return (
    <AdminShell title="Primary Image Hypotheses">
      <div style={{ padding: 24, maxWidth: 900 }}>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Product name */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6 }}>PRODUCT NAME (optional)</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="e.g. Avocado Keeper"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13.5, boxSizing: "border-box" }}
            />
          </div>

          {/* Product images */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>PRODUCT IMAGES <span style={{ color: "#dc2626" }}>*</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {productImages.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:${img.type};base64,${img.base64}`} alt={img.name}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "2px solid #e5e7eb", display: "block" }} />
                  <button onClick={() => setProductImages(p => p.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#dc2626", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ))}
              {productImages.length < 3 && (
                <label style={{ width: 60, height: 60, borderRadius: 8, border: "2px dashed #d1d5db", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 2 }}>
                  <span style={{ fontSize: 22, color: "#9ca3af", lineHeight: 1 }}>+</span>
                  <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>PHOTO</span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleProductImages} />
                </label>
              )}
            </div>
            <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>Current listing photo + plain product shots (up to 3)</p>
          </div>

          {/* Competitor screenshot */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>COMPETITOR SCREENSHOT <span style={{ color: "#dc2626" }}>*</span></div>
            {competitor ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:${competitor.type};base64,${competitor.base64}`} alt="competitor"
                  style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "2px solid #22c55e", display: "block" }} />
                <div>
                  <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>{competitorName}</div>
                  <button onClick={() => { setCompetitor(null); setCompetitorName(""); }}
                    style={{ fontSize: 11.5, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>Remove</button>
                </div>
              </div>
            ) : (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", border: "2px dashed #d1d5db", borderRadius: 8, background: "#f9fafb" }}>
                <span style={{ fontSize: 20, color: "#9ca3af" }}>📸</span>
                <span style={{ fontSize: 12.5, color: "#6b7280" }}>Upload GoFullPage screenshot of Amazon search results</span>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCompetitor} />
              </label>
            )}
          </div>

          {/* SQP (optional) */}
          <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>SQP DATA <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>(optional)</span></div>
            <textarea
              value={sqpText}
              onChange={e => setSqpText(e.target.value)}
              placeholder="Paste Search Query Performance data here (Brand Analytics export)…"
              rows={4}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!canGenerate}
          style={{
            padding: "11px 28px", borderRadius: 10, border: "none",
            background: canGenerate ? orange : "#d1d5db",
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: canGenerate ? "pointer" : "default",
            marginBottom: 28,
          }}
        >
          {loading ? "Generating hypotheses…" : "⚡ Generate Hypotheses"}
        </button>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13.5, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: 13.5 }}>
            <div style={{ marginBottom: 8 }}>Analyzing product images and competitor field…</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>This takes ~20–40 seconds</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: navy, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Primary Image Hypotheses</span>
              <button
                onClick={downloadMd}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: orange, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                ⬇ Download .md
              </button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <MarkdownRenderer md={result} />
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
