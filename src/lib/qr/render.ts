// Browser-only helpers. Heavy libraries are imported on demand so they never touch SSR or the diner menu.
import { INK, qrModuleColour } from "./colour";
import { sized } from "@/lib/unsplash";

export type QrStyle = { branded: boolean; accent: string; logo: string | null };

async function make(data: string, style: QrStyle, size: number, type: "svg" | "canvas") {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const colour = style.branded ? qrModuleColour(style.accent) : INK;
  const logo = style.branded && style.logo ? sized(style.logo, 400, 400) : undefined;
  return new QRCodeStyling({
    width: size, height: size, type, data, margin: Math.round(size * 0.04),
    qrOptions: { errorCorrectionLevel: style.branded ? "H" : "M" },
    dotsOptions: { color: colour, type: style.branded ? "dots" : "square" },
    cornersSquareOptions: { color: colour, type: style.branded ? "extra-rounded" : "square" },
    cornersDotOptions: { color: colour, type: style.branded ? "dot" : "square" },
    backgroundOptions: { color: "#FFFFFF" },
    ...(logo ? { image: logo, imageOptions: { crossOrigin: "anonymous", margin: Math.round(size * 0.012), imageSize: 0.32, hideBackgroundDots: true } } : {}),
  });
}

export async function qrBlob(data: string, style: QrStyle, kind: "png" | "svg", size = 2048): Promise<Blob> {
  const qr = await make(data, style, size, kind === "svg" ? "svg" : "canvas");
  const raw = await qr.getRawData(kind);
  if (!raw) throw new Error("Couldn't draw that QR code");
  return raw instanceof Blob ? raw : new Blob([raw as BlobPart], { type: kind === "svg" ? "image/svg+xml" : "image/png" });
}

export async function qrImage(data: string, style: QrStyle, size: number): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(await qrBlob(data, style, "png", size));
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const fileSafe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";

export async function zipQrs(items: { name: string; url: string }[], style: QrStyle): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  for (const it of items) {
    let base = fileSafe(it.name);
    while (used.has(base)) base += "-2";
    used.add(base);
    const [png, svg] = await Promise.all([qrBlob(it.url, style, "png"), qrBlob(it.url, style, "svg")]);
    zip.file(`${base}.png`, png);
    zip.file(`${base}.svg`, svg);
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

/**
 * A4 PDF with two fold-in-half table tents per page. Each tent is drawn on a 300dpi canvas
 * (so the theme's web fonts render exactly), with the top panel upside down for folding.
 */
export async function tentsPdf(opts: {
  restaurant: string; displayFont: string; sansFont: string; accent: string; style: QrStyle;
  tables: { label: string; url: string }[];
}): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const W = 2480, H = 1754, P = H / 2; // 210 × 148.5mm at 300dpi; P = one panel
  const display = `"${opts.displayFont}", Georgia, serif`;
  const sans = `"${opts.sansFont}", system-ui, sans-serif`;
  await Promise.all([document.fonts.load(`120px ${display}`), document.fonts.load(`48px ${sans}`)]).catch(() => undefined);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const accent = qrModuleColour(opts.accent);

  const fit = (ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, start: number, max: number) => {
    let px = start;
    ctx.font = font(px);
    while (px > 24 && ctx.measureText(text).width > max) { px -= 4; ctx.font = font(px); }
    return px;
  };

  const panel = (ctx: CanvasRenderingContext2D, qr: HTMLImageElement, label: string) => {
    const pad = 130, q = 560;
    ctx.drawImage(qr, pad, (P - q) / 2, q, q);
    const x = pad + q + 110, maxW = W - x - pad;
    ctx.fillStyle = INK;
    ctx.textBaseline = "alphabetic";
    fit(ctx, opts.restaurant, (px) => `${px}px ${display}`, 96, maxW);
    ctx.fillText(opts.restaurant, x, 250);
    ctx.font = `44px ${sans}`;
    ctx.fillStyle = "#5c574f";
    ctx.fillText("Scan to see the menu & order", x, 330);
    ctx.fillStyle = accent;
    ctx.font = `500 40px ${sans}`;
    ctx.fillText("TABLE", x, 480);
    ctx.fillStyle = INK;
    fit(ctx, label, (px) => `${px}px ${display}`, 260, maxW);
    ctx.fillText(label, x, 720);
    ctx.font = `30px ${sans}`;
    ctx.fillStyle = "#8a847a";
    ctx.fillText("Powered by Plated", x, P - 70);
  };

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < opts.tables.length; i++) {
    const t = opts.tables[i]!;
    const qr = await qrImage(t.url, opts.style, 1200);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    // bottom panel, upright
    ctx.save(); ctx.translate(0, P); panel(ctx, qr, t.label); ctx.restore();
    // top panel, upside down so it reads correctly once folded
    ctx.save(); ctx.translate(W, P); ctx.rotate(Math.PI); panel(ctx, qr, t.label); ctx.restore();
    // fold + cut guides
    ctx.strokeStyle = "#cfc6b6"; ctx.lineWidth = 3; ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(0, P); ctx.lineTo(W, P); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `26px ${sans}`; ctx.fillStyle = "#b3aa9b"; ctx.fillText("fold", W - 110, P - 14);
    if (i % 2 === 0 && i > 0) pdf.addPage();
    const y = (i % 2) * 148.5;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, y, 210, 148.5, undefined, "FAST");
    if (i % 2 === 0) { pdf.setDrawColor(200, 190, 175); pdf.setLineDashPattern([2, 2], 0); pdf.line(0, 148.5, 210, 148.5); }
  }
  return pdf.output("blob");
}
