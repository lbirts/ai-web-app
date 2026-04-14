interface SseChunkState {
  pending: string;
  content: string;
  done: boolean;
}

function extractDeltaFromDataLine(data: string): string {
  if (!data || data === "[DONE]") return "";
  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

export function consumeSseChunk(
  state: SseChunkState,
  decodedChunk: string,
): SseChunkState {
  let pending = state.pending + decodedChunk;
  let content = state.content;
  let done = state.done;

  const lines = pending.split("\n");
  pending = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trimEnd();
    if (data === "[DONE]") {
      done = true;
      break;
    }
    content += extractDeltaFromDataLine(data);
  }

  return { pending, content, done };
}

export function flushSsePending(state: SseChunkState): SseChunkState {
  const dataLine = state.pending.trim();
  if (!dataLine.startsWith("data: ")) {
    return { ...state, pending: "" };
  }

  const data = dataLine.slice(6).trimEnd();
  const appended = extractDeltaFromDataLine(data);
  return {
    pending: "",
    done: state.done || data === "[DONE]",
    content: state.content + appended,
  };
}
