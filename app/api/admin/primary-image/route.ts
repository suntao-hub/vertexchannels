import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAuth } from "@/lib/admin/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    productImages?: { base64: string; type: string; name: string }[];
    competitorScreenshot?: { base64: string; type: string };
    sqpData?: string;
    productName?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productImages = [], competitorScreenshot, sqpData, productName } = body;

  if (!competitorScreenshot) {
    return NextResponse.json({ error: "Competitor screenshot is required" }, { status: 400 });
  }
  if (productImages.length === 0) {
    return NextResponse.json({ error: "At least one product image is required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const imageBlocks: Anthropic.ImageBlockParam[] = [
    ...productImages.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        data: img.base64,
      },
    })),
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: competitorScreenshot.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        data: competitorScreenshot.base64,
      },
    },
  ];

  const systemPrompt = `You are an Amazon primary image specialist. Your job is to analyze a product's current images and the competitive landscape on Amazon search results, then produce 5 concrete, testable hypotheses for a new primary image that will improve click-through rate.

Amazon main image rules (non-negotiable):
- Pure white background (RGB 255,255,255)
- Product fills ~85% of the frame
- NO text, badges, watermarks, borders, inset graphics, or accessories not included
- Text rule: text NEVER overlaid on image — it must sit on a physical hang tag or printed packaging/box placed in scene
- Compliant concepts can go live directly; gray-area concepts (text, props, non-included items) must run through A/B test in Seller Central → Brands → Manage Your Experiments

Output a markdown document with exactly this structure:
1. "What I looked at" — current image strengths/weaknesses + competitor field analysis (saturated vs winning tactics)
2. "The single biggest opportunity" — 1 short paragraph
3. "⚠️ Compliance note" — TOS rules + A/B test guidance
4. "Reference images to attach" — which photo to use for each concept
5. Five concepts (Concept 1–5), each with:
   - **Hypothesis:** what change will lift CTR and why
   - **SOP tactic:** which tactic  **TOS risk:** compliant / gray-area → A/B test
   - **Prompt:** paste-ready AI image generation prompt (starts from the reference photo, specifies pure white background, product fills 85%, any text on physical tag/box only, uses [bracketed placeholders] for specs)
6. "Suggested test order" — ranked with reasoning`;

  const userContent: Anthropic.MessageParam["content"] = [
    ...imageBlocks,
    {
      type: "text",
      text: `${productName ? `Product: ${productName}\n\n` : ""}The first ${productImages.length} image(s) are the product photo(s). The last image is the competitor GoFullPage screenshot of Amazon search results.${sqpData ? `\n\nSQP Data:\n${sqpData}` : ""}\n\nGenerate 5 primary image hypotheses following the template.`,
    },
  ];

  try {
    const response = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ markdown: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[primary-image] Claude error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
