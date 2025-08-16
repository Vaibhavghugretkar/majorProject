// src/lib/mermaid-utils.ts
import mermaid from "mermaid";
import { Canvg } from "canvg";

// Call initializeMermaid once when the module is loaded, ensuring it runs on client.
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
  });
}

const stripMarkdownFences = (code: string): string => {
  const fenceRegex =
    /^\s*```(?:mermaid|graphviz)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = code.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return code.trim();
};

/**
 * Universal Mermaid Transformer
 * - Cleans code
 * - Detects diagram type
 * - Normalizes syntax
 * - Always returns { code, error? }
 */
const transform = function transformMermaidUniversal(raw: string): {
  code: string;
  error?: string;
} {
  try {
    let code = raw.trim();

    // 1. Remove Markdown fences
    code = code.replace(/```mermaid|```/g, "").trim();

    // 2. Known Mermaid types
    const diagramTypes = [
      "flowchart",
      "graph",
      "sequenceDiagram",
      "classDiagram",
      "erDiagram",
      "stateDiagram",
      "gantt",
      "journey",
      "pie",
      "mindmap",
      "timeline",
      // aliases
      "networkDiagram",
      "architectureDiagram",
    ];

    // 3. Detect type
    let detectedType = diagramTypes.find((t) => code.startsWith(t));

    // 4. Normalize aliases → flowchart
    if (
      /^\s*networkDiagram/i.test(code) ||
      /^\s*architectureDiagram/i.test(code)
    ) {
      code = code.replace(
        /^\s*(networkDiagram|architectureDiagram)/i,
        "flowchart TD"
      );
      detectedType = "flowchart";
    }

    // 5. Default to flowchart if type missing
    if (!detectedType) {
      code = "flowchart TD\n" + code;
      detectedType = "flowchart";
    }

    // 6. Apply type-specific fixes
    switch (detectedType) {
      case "flowchart":
      case "graph":
        // Subgraph names must be quoted if they contain spaces
        code = code.replace(
          /subgraph\s+([A-Za-z0-9_-]+\s+[A-Za-z0-9_-]+)/g,
          (_, name) => {
            return `subgraph "${name}"`;
          }
        );

        // Normalize edge labels ("-- "label" -->" → "-->|label|")
        code = code.replace(/--\s*"([^"]+)"\s*-->/g, "-->|$1|");
        break;

      case "sequenceDiagram":
        // Remove unsupported "subgraph"
        code = code.replace(/subgraph .*?end/gms, "");
        break;

      case "gantt":
        // Ensure dateFormat
        if (!/dateFormat/.test(code)) {
          code = code.replace(/^gantt/, "gantt\n  dateFormat  YYYY-MM-DD");
        }
        break;

      case "pie":
        // Ensure "pie" has title if missing
        if (!/title\s+/i.test(code)) {
          code = code.replace(/^pie/, "pie\n  title Pie Chart");
        }
        break;

      case "journey":
        // Ensure journey has title
        if (!/title\s+/i.test(code)) {
          code = code.replace(/^journey/, "journey\n  title Journey");
        }
        break;

      // other types usually don’t need normalization
    }

    // 7. Validate first line
    if (
      !/^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gantt|journey|pie|mindmap|timeline)/.test(
        code
      )
    ) {
      return { code, error: "Unknown or unsupported Mermaid diagram type." };
    }

    return { code };
  } catch (err: any) {
    return {
      code: raw,
      error: "Transformation failed: " + (err.message || "Unknown error"),
    };
  }
};

export const renderMermaidDiagram = async (
  elementId: string,
  rawCode: string
): Promise<string | undefined> => {
  const container = document.getElementById(elementId);

  if (!container) {
    if (rawCode.trim()) {
      console.warn(
        `Mermaid container with id '${elementId}' not found in DOM. Cannot render diagram.`
      );
    }
    return undefined;
  }

  const initCode = stripMarkdownFences(rawCode);

  // ✅ Auto-convert invalid "node ..." syntax to valid flowchart syntax
  const { code, error } = transform(initCode);

  if (error) {
    throw new Error(`Diagram transformation failed: ${error}`);
  }

  if (!code) {
    container.innerHTML = ""; // Clear if no code
    return undefined;
  }

  try {
    const internalSvgId = `mermaid-svg-${elementId}-${Date.now()}`;
    const { svg, bindFunctions } = await mermaid.render(internalSvgId, code);

    // Create a wrapper div for the SVG
    const wrapper = container.querySelector(".diagram-wrapper") || container;
    wrapper.innerHTML = svg;

    // Get the SVG element
    const svgElement = wrapper.querySelector("svg") as SVGSVGElement;
    if (svgElement) {
      // Make SVG responsive
      svgElement.style.width = "100%";
      svgElement.style.height = "100%";
      svgElement.style.maxHeight = "100%";
      svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

      // Calculate and apply scaling
      const containerRect = wrapper.getBoundingClientRect();
      const svgRect = svgElement.getBoundingClientRect();
      const scale = Math.min(
        containerRect.width / svgRect.width,
        containerRect.height / svgRect.height
      );

      if (scale < 1) {
        (wrapper as HTMLElement).style.transform = `scale(${scale})`;
      }
    }

    if (bindFunctions) {
      bindFunctions(wrapper);
    }
    return svg;
  } catch (error) {
    console.error("Mermaid rendering error:", error);
    console.error("Problematic Mermaid code passed to render:", code);
    container.innerHTML = `<div class="p-4 text-destructive bg-destructive/10 border border-destructive rounded-md">
        <p class="font-semibold">Error rendering diagram:</p>
        <pre class="mt-2 text-sm whitespace-pre-wrap">${
          (error as Error).message || "Unknown error"
        }</pre>
        <p class="mt-2 text-xs">Please check your diagram code for syntax errors. Ensure it does not include Markdown fences like \`\`\`mermaid.\`\`\`</p>
        <p class="mt-2 text-xs font-semibold">Code submitted to Mermaid:</p>
        <pre class="mt-1 text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded-sm overflow-auto max-h-40">${code
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>
      </div>`;
    return undefined;
  }
};

export const exportSVG = (
  svgContent: string,
  filename: string = "diagram.svg"
) => {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  if (document.body.contains(link)) {
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
};

export const exportPNG = async (
  svgContent: string,
  filename: string = "diagram.png",
  previewElementId?: string
) => {
  const styleTag = `<style>
  text { font-family: Arial, sans-serif; font-size: 16px; fill: #222; }
</style>`;
  const injectedSvg = convertForeignObjectLabelsToText(
    svgContent.replace(/(<svg[^>]*>)/i, `$1${styleTag}`)
  );

  // console.log(injectedSvg);

  // Parse SVG to get width/height
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(injectedSvg, "image/svg+xml");
  const svgEl = svgDoc.documentElement as unknown as SVGSVGElement;

  // Robust dimension calculation
  let width = 800;
  let height = 600;
  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const vb = viewBox.split(" ").map(Number);
    if (vb.length === 4) {
      width = vb[2];
      height = vb[3];
    }
  } else {
    width = parseInt(svgEl.getAttribute("width") || "800", 10);
    height = parseInt(svgEl.getAttribute("height") || "600", 10);
  }

  const padding = 20;
  const scale = 3; // For high-DPI exports
  const canvas = document.createElement("canvas");
  canvas.width = (width + padding * 2) * scale;
  canvas.height = (height + padding * 2) * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    alert("Could not create canvas context for PNG export.");
    return;
  }

  // Fill background white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Scale context for high DPI
  ctx.setTransform(scale, 0, 0, scale, padding * scale, padding * scale);

  // Use canvg to render SVG onto canvas
  try {
    const v = await Canvg.from(ctx, injectedSvg, {
      ignoreAnimation: true,
      ignoreMouse: true,
      ignoreClear: true,
    });
    await v.render();
  } catch (e) {
    console.error("Canvg render error:", e);
    alert(
      "Failed to render SVG for PNG export. Please try using SVG export instead."
    );
    return;
  }

  // Optionally preview the PNG in the DOM
  if (previewElementId) {
    const preview = document.getElementById(previewElementId);
    if (preview) {
      preview.innerHTML = "";
      const pngUrl = canvas.toDataURL("image/png");
      const pngImg = document.createElement("img");
      pngImg.src = pngUrl;
      pngImg.alt = "PNG Preview";
      pngImg.style.maxWidth = "100%";
      preview.appendChild(pngImg);
    }
  }

  // Download PNG
  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Failed to create PNG blob.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (e) {
    console.error("Error exporting PNG:", e);
    alert("Failed to export PNG. Please try again or use SVG export instead.");
  }
};

export const exportJSON = (
  diagramCode: string,
  filename: string = "diagram.json"
) => {
  const jsonData = JSON.stringify(
    { diagramCode: stripMarkdownFences(diagramCode) },
    null,
    2
  );
  const blob = new Blob([jsonData], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  if (document.body.contains(link)) {
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
};

function convertForeignObjectLabelsToText(svg: string): string {
  return svg.replace(
    /(<g[^>]*transform="translate\(([^,]+),\s*([^\)]+)\)"[^>]*>)([\s\S]*?)(<rect([^>]*)\/?>)([\s\S]*?)<foreignObject[^>]*width="([^"]+)" height="([^"]+)"[^>]*>[\s\S]*?<span[^>]*class="nodeLabel"[^>]*>(.*?)<\/span>[\s\S]*?<\/foreignObject>([\s\S]*?)<\/g>/g,
    (
      match,
      gOpen,
      x,
      y,
      beforeRect,
      rectTag,
      rectAttrs,
      afterRect,
      foWidth,
      foHeight,
      label,
      afterFO
    ) => {
      // Extract x, y, width, height from rect
      const xMatch = rectTag.match(/x="([^"]+)"/);
      const yMatch = rectTag.match(/y="([^"]+)"/);
      const widthMatch = rectTag.match(/width="([^"]+)"/);
      const heightMatch = rectTag.match(/height="([^"]+)"/);

      const rectX = xMatch ? Number(xMatch[1]) : 0;
      const rectY = yMatch ? Number(yMatch[1]) : 0;
      const rectWidth = widthMatch ? Number(widthMatch[1]) : Number(foWidth);
      const rectHeight = heightMatch
        ? Number(heightMatch[1])
        : Number(foHeight);

      // Center text in the box
      const textX = rectX + rectWidth / 2;
      const textY = rectY + rectHeight / 2;

      return `${gOpen}${beforeRect}${rectTag}${afterRect}<text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="16" fill="#222" text-anchor="middle" dominant-baseline="middle">${label}</text>${afterFO}</g>`;
    }
  );
}
