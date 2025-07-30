
// src/lib/mermaid-utils.ts
import mermaid from 'mermaid';

// Call initializeMermaid once when the module is loaded, ensuring it runs on client.
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
  });
}

const stripMarkdownFences = (code: string): string => {
  const fenceRegex = /^\s*```(?:mermaid|graphviz)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = code.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return code.trim();
};

export const renderMermaidDiagram = async (elementId: string, rawCode: string): Promise<string | undefined> => {
  const container = document.getElementById(elementId);

  if (!container) {
    if (rawCode.trim()) {
      console.warn(`Mermaid container with id '${elementId}' not found in DOM. Cannot render diagram.`);
    }
    return undefined;
  }

  const code = stripMarkdownFences(rawCode);

  if (!code) {
    container.innerHTML = ''; // Clear if no code
    return undefined;
  }

  try {
    const internalSvgId = `mermaid-svg-${elementId}-${Date.now()}`;
    const { svg, bindFunctions } = await mermaid.render(internalSvgId, code);
    container.innerHTML = svg;
    if (bindFunctions) {
      bindFunctions(container);
    }
    return svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    console.error('Problematic Mermaid code passed to render:', code);
    container.innerHTML = `<div class="p-4 text-destructive bg-destructive/10 border border-destructive rounded-md">
        <p class="font-semibold">Error rendering diagram:</p>
        <pre class="mt-2 text-sm whitespace-pre-wrap">${(error as Error).message || 'Unknown error'}</pre>
        <p class="mt-2 text-xs">Please check your diagram code for syntax errors. Ensure it does not include Markdown fences like \`\`\`mermaid.\`\`\`</p>
        <p class="mt-2 text-xs font-semibold">Code submitted to Mermaid:</p>
        <pre class="mt-1 text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded-sm overflow-auto max-h-40">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`;
    return undefined;
  }
};

export const exportSVG = (svgContent: string, filename: string = 'diagram.svg') => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  if (document.body.contains(link)) {
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
};

export const exportPNG = (svgContent: string, filename: string = 'diagram.png') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert("Could not create canvas context for PNG export.");
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous"; // Attempt to handle potential CORS issues with SVG content

  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const padding = 20;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth === 0 || naturalHeight === 0) {
      console.error("SVG image has zero intrinsic dimensions, cannot export PNG.");
      URL.revokeObjectURL(url);
      alert("Diagram has no content or dimensions, cannot export as PNG.");
      return;
    }

    canvas.width = naturalWidth + padding * 2;
    canvas.height = naturalHeight + padding * 2;

    // Set canvas background to match the application's background
    try {
        ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor || 'white';
    } catch (e) {
        ctx.fillStyle = 'white'; // Fallback if computed style fails (e.g. in tests)
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the SVG image onto the canvas
    ctx.drawImage(img, padding, padding, naturalWidth, naturalHeight);
    URL.revokeObjectURL(url); // Clean up the object URL once drawn

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Error calling toDataURL (canvas might be tainted):", e);
      alert("Failed to export PNG. The diagram may contain external content that cannot be included. Please try generating the diagram without external images.");
    }
  };

  img.onerror = (e) => {
    console.error("Error loading SVG into Image object for PNG export:", e);
    URL.revokeObjectURL(url);
    alert("Failed to load diagram for PNG export. The SVG data might be malformed or an error occurred during loading.");
  };

  img.src = url;
};

export const exportJSON = (diagramCode: string, filename: string = 'diagram.json') => {
  const jsonData = JSON.stringify({ diagramCode: stripMarkdownFences(diagramCode) }, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  if (document.body.contains(link)) {
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
};
