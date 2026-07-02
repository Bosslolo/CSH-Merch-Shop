async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#0f1f3d";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#c9a84c";
    ctx.fillText("CSH Merch", 2, 2);
    return canvas.toDataURL();
  } catch {
    return "canvas-blocked";
  }
}

export async function getVisitorFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(navigator.hardwareConcurrency ?? 0),
    canvasFingerprint(),
  ];
  return sha256(parts.join("|"));
}
