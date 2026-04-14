import { NextRequest, NextResponse } from "next/server";

type ChatRole = "system" | "user" | "assistant" | "developer";
type ChatMessage = {
  role: ChatRole;
  content: string;
};

const SYSTEM_PROMPT = `You are a travel planning assistant.

Only answer travel-related requests: destinations, itineraries, flights, hotels, transport, budgets, packing, visas (high-level), safety, weather timing, activities, food, accessibility, family/business travel, and loyalty points.

If a request is not travel-related, politely refuse and redirect to travel planning.

Behavior:
- Be concise, practical, and personalized.
- Ask follow-up questions when key details are missing (origin, dates, budget, travelers, interests, constraints).
- Provide actionable plans with clear options (budget/mid/premium when useful).
- Use bullet points and checklists.
- State assumptions clearly.
- Do not invent live prices/availability/policies; give ranges and suggest official sources to verify.

Safety:
- For visas, legal, health, or entry rules: provide general guidance and tell the user to verify with official government/airline sources.`;

function createMockSseResponse(messages: ChatMessage[]) {
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content ??
    "your trip";
  const mockText = `Mock mode: I can help plan ${lastUserMessage}.`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: mockText } }] })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function isChatRole(value: unknown): value is ChatRole {
  return (
    value === "system" ||
    value === "user" ||
    value === "assistant" ||
    value === "developer"
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  // Validate request payload at the API boundary so clients get clear 400s.
  if (!value || typeof value !== "object") return false;

  const maybe = value as { role?: unknown; content?: unknown };
  return (
    isChatRole(maybe.role) &&
    typeof maybe.content === "string" &&
    maybe.content.trim().length > 0
  );
}

export async function POST(req: NextRequest) {
  const useMockOpenAI = process.env.MOCK_OPENAI === "true";
  const apiKey = process.env.OPENAI_API_KEY;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  if (!messages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "Each message must include a valid role and non-empty content" },
      { status: 400 },
    );
  }

  const safeMessages = messages;
  const upstreamMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...safeMessages,
  ];

  if (useMockOpenAI) {
    return createMockSseResponse(upstreamMessages);
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: upstreamMessages,
        stream: true,
      }),
      // Propagate client aborts to OpenAI to avoid wasted work/tokens.
      signal: req.signal,
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            (err as { error?: { message?: string } })?.error?.message ??
            "OpenAI request failed.",
        },
        { status: upstream.status },
      );
    }

    // Pass OpenAI's SSE stream through unchanged for token-by-token UI updates.
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach OpenAI." },
      { status: 502 },
    );
  }
}
