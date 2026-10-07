"use client";

import { useState } from "react";

const navy   = "#0A2333";
const orange = "#F97316";

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  email: string;
  company: string;
  website: string;
  productCategories: string;
  monthlyAdSpend: string;
  channels: string[];
  goals: string;
}

const BLANK: FormData = {
  name: "", email: "", company: "", website: "",
  productCategories: "", monthlyAdSpend: "", channels: [], goals: "",
};

const CHANNEL_OPTIONS = [
  { value: "amazon",   label: "Amazon" },
  { value: "walmart",  label: "Walmart" },
  { value: "ebay",     label: "eBay" },
  { value: "newegg",   label: "Newegg" },
  { value: "own_site", label: "Own website" },
  { value: "other",    label: "Other" },
];

const AD_SPEND_OPTIONS = [
  { label: "Under $1,000 / mo",      value: "500" },
  { label: "$1,000 – $3,000 / mo",   value: "2000" },
  { label: "$3,000 – $10,000 / mo",  value: "6500" },
  { label: "$10,000 – $30,000 / mo", value: "20000" },
  { label: "$30,000+ / mo",          value: "50000" },
];

export default function ApplyPage() {
  const [step, setStep]         = useState<Step>(1);
  const [form, setForm]         = useState<FormData>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState<"success" | "rejected" | null>(null);
  const [error, setError]       = useState("");

  function toggleChannel(v: string) {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(v)
        ? f.channels.filter(c => c !== v)
        : [...f.channels, v],
    }));
  }

  const step1Valid = () => form.name.trim() && form.email.trim() && form.company.trim();
  const step2Valid = () => form.productCategories.trim() && form.monthlyAdSpend && form.channels.length > 0;

  async function submit() {
    if (!form.goals.trim()) { setError("Please describe your goals."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; rejected?: boolean };
      if (data.rejected) setResult("rejected");
      else if (data.ok)  setResult("success");
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result === "success") {
    return (
      <Page>
        <Card>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: navy, margin: "0 0 12px" }}>Application received!</h1>
            <p style={{ color: "#6B7280", lineHeight: 1.6, margin: "0 0 8px" }}>
              Thanks {form.name.split(" ")[0]}! We&apos;ll review your application and reach out
              within 48 hours to set up a discovery call.
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Keep an eye on {form.email}</p>
          </div>
        </Card>
      </Page>
    );
  }

  if (result === "rejected") {
    return (
      <Page>
        <Card>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: navy, margin: "0 0 12px" }}>Not quite the right fit yet</h1>
            <p style={{ color: "#6B7280", lineHeight: 1.6, margin: "0 0 8px" }}>
              We focus on brands spending $3,000+ per month on advertising — that&apos;s where we move the needle most.
              Once your ad spend reaches that level, we&apos;d love to work together.
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Feel free to reapply when you hit that milestone.</p>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 2, textDecoration: "none", marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: navy }}>Vertex</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: orange }}>Channels</span>
        </a>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: navy, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Apply to work with us
        </h1>
        <p style={{ color: "#6B7280", margin: 0 }}>
          Tell us about your brand and we&apos;ll be in touch within 48 hours.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 4,
            background: step >= s ? orange : "#E5E7EB", transition: "background 0.2s" }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right", margin: "4px 0 20px" }}>Step {step} of 3</p>

      <Card>
        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h2 style={h2Style}>About your business</h2>
            <Field label="Your name *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="First and last name" style={inputStyle} />
            </Field>
            <Field label="Email address *">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@yourbrand.com" style={inputStyle} />
            </Field>
            <Field label="Company / Brand name *">
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Tools LLC" style={inputStyle} />
            </Field>
            <Field label="Website (optional)">
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yourbrand.com" style={inputStyle} />
            </Field>
            <button onClick={() => step1Valid() && setStep(2)} disabled={!step1Valid()} style={btnStyle(!step1Valid())}>
              Continue →
            </button>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <h2 style={h2Style}>Your advertising</h2>
            <Field label="What do you sell? *">
              <input value={form.productCategories}
                onChange={e => setForm(f => ({ ...f, productCategories: e.target.value }))}
                placeholder="e.g. Power tools, automotive accessories, hardware" style={inputStyle} />
            </Field>
            <Field label="Monthly ad spend *">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {AD_SPEND_OPTIONS.map(opt => {
                  const on = form.monthlyAdSpend === opt.value;
                  return (
                    <label key={opt.value} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderRadius: 10, border: `1.5px solid ${on ? orange : "#E5E7EB"}`,
                      background: on ? "#FFF7ED" : "#fff", cursor: "pointer",
                      color: on ? orange : "#374151", fontWeight: on ? 600 : 400, fontSize: 14,
                      transition: "all 0.15s",
                    }}>
                      <input type="radio" name="adSpend" value={opt.value}
                        checked={on} onChange={() => setForm(f => ({ ...f, monthlyAdSpend: opt.value }))}
                        style={{ accentColor: orange }} />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Which channels are you currently on? *">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CHANNEL_OPTIONS.map(ch => {
                  const on = form.channels.includes(ch.value);
                  return (
                    <button key={ch.value} type="button" onClick={() => toggleChannel(ch.value)} style={{
                      padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${on ? orange : "#E5E7EB"}`,
                      background: on ? "#FFF7ED" : "#fff", color: on ? orange : "#6B7280",
                      fontWeight: on ? 600 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
              <button onClick={() => step2Valid() && setStep(3)} disabled={!step2Valid()} style={{ flex: 1, ...btnStyle(!step2Valid()) }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <h2 style={h2Style}>What are you looking to achieve?</h2>
            <Field label="Tell us about your goals *">
              <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                placeholder="e.g. Get onto Walmart Marketplace, recover excess inventory, grow multi-channel revenue by $500k this year…"
                rows={5} style={{ ...inputStyle, resize: "none" }} />
            </Field>
            {error && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
              <button onClick={submit} disabled={submitting || !form.goals.trim()}
                style={{ flex: 1, ...btnStyle(submitting || !form.goals.trim()) }}>
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </>
        )}
      </Card>

      <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 20 }}>
        Questions? Email{" "}
        <a href="mailto:hello@vertexchannels.com" style={{ color: "#6B7280" }}>hello@vertexchannels.com</a>
      </p>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "48px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "32px 28px" }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10,
  padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", color: navy,
};

const h2Style: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: navy, margin: "0 0 20px",
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "12px", borderRadius: 10, border: "none",
    fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#E5E7EB" : orange,
    color: disabled ? "#9CA3AF" : "#fff",
    transition: "background 0.15s",
  };
}

const backBtnStyle: React.CSSProperties = {
  flex: "0 0 90px", padding: "12px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", background: "#fff",
  fontSize: 14, fontWeight: 500, color: "#6B7280", cursor: "pointer",
};
