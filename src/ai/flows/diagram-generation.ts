
// diagram-generation.ts
'use server';

/**
 * @fileOverview Diagram generation from a text prompt and an optional document, with support for iterative editing and intelligent type suggestions.
 *
 * - generateDiagram - A function that takes a text prompt and returns a diagram code and an optional suggestion.
 * - DiagramGenerationInput - The input type for the generateDiagram function.
 * - DiagramGenerationOutput - The return type for the generateDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagramGenerationInputSchema = z.object({
  prompt: z.string().describe("The user's request to either create or modify a diagram."),
  currentDiagramLabel: z.string().describe('The user-facing label for the currently selected diagram type (e.g., "Flowchart").'),
  previousDiagramCode: z.string().optional().describe('The Mermaid code of the existing diagram to be modified. If this is not provided, a new diagram should be created.'),
  documentDataUri: z.string().optional().describe("An optional document or image (e.g., PDF, TXT, PNG) as a data URI. If provided, it's used as context for the diagram."),
});
export type DiagramGenerationInput = z.infer<typeof DiagramGenerationInputSchema>;

const DiagramGenerationOutputSchema = z.object({
  diagramCode: z.string().describe('The Mermaid code representation of the diagram, created based on the user\'s *originally selected* diagram type.'),
  suggestedDiagramType: z.string().optional().describe('If you believe a different diagram type is more suitable for the user\'s prompt, specify its machine-readable value here (e.g., "networkDiagram", "classDiagram", "erDiagram"). If the current type is appropriate, omit this field.'),
  suggestionReason: z.string().optional().describe('A brief, user-friendly explanation for why you are suggesting a different diagram type. Omit if no suggestion is made.'),
});
export type DiagramGenerationOutput = z.infer<typeof DiagramGenerationOutputSchema>;

export async function generateDiagram(input: DiagramGenerationInput): Promise<DiagramGenerationOutput> {
  return diagramGenerationFlow(input);
}

const diagramGenerationPrompt = ai.definePrompt({
  name: 'diagramGenerationPrompt',
  input: {schema: DiagramGenerationInputSchema},
  output: {schema: DiagramGenerationOutputSchema},
  prompt: `You are an expert in generating and modifying diagrams represented in Mermaid code.

**Analysis Task (Important First Step):**
1.  Analyze the user's prompt: \`{{{prompt}}}\`.
2.  The user has selected the '{{{currentDiagramLabel}}}' type.
3.  **Evaluate if this is the best type for the prompt.** For example, if the prompt describes a network architecture but the user chose 'Flowchart', a 'Network Diagram' (value: 'networkDiagram') would be more appropriate. If the prompt describes database tables, an 'ER Diagram' (value: 'erDiagram') is better than a 'Flowchart'.
4.  If you identify a better type, you MUST populate the \`suggestedDiagramType\` and \`suggestionReason\` fields in your output. For \`suggestedDiagramType\`, use the machine-readable value (e.g., 'networkDiagram', 'classDiagram').
5.  If the user's choice is appropriate, leave the suggestion fields empty.

**Generation Task:**
- **Always generate the diagram using the user's selected type: '{{{currentDiagramLabel}}}'. Do NOT use your suggested type for this generation.** The suggestion is an additional piece of helpful advice.
- Your primary goal is to fulfill the user's request based on their selected type.

**User's Request:**
\`\`\`
{{{prompt}}}
\`\`\`

{{#if previousDiagramCode}}
**Existing Diagram Code (to be modified):**
\`\`\`mermaid
{{{previousDiagramCode}}}
\`\`\`
Based on the user's request, you MUST modify the existing diagram code above.
{{else}}
**Task:** Create a new diagram from scratch based on the user's request.
{{/if}}

{{#if documentDataUri}}
The user has also uploaded a file (document or image). Use its content as additional context for your task.
- If it's a document, analyze its text.
- If it's an image, analyze its visual content.

Uploaded File Content:
{{media url=documentDataUri}}
{{/if}}

**Critical Rules for Mermaid Output:**
- The diagram code MUST be in **Mermaid format**.
- **ALWAYS enclose node text (labels) in double quotes.**
  - **Correct:** \`nodeId["This is my node text"]\`
  - **Incorrect:** \`nodeId[This is my node text]\`
- Start the code directly with the diagram type declaration (e.g., 'graph TD', 'classDiagram').
- Link text MUST be in double quotes: \`A-- "Link Label" -->B\`.
- **Crucially, do NOT include any external image URLs or links (e.g., \`![alt](http://...)\` or HTML \`<img>\` tags) within the diagram code.**
- **IMPORTANT**: Do NOT wrap your final output in Markdown code fences (e.g., \`\`\`mermaid ... \`\`\` or \`\`\` ... \`\`\`). The output must be ONLY the raw diagram code itself.
  `,
});

const diagramGenerationFlow = ai.defineFlow(
  {
    name: 'diagramGenerationFlow',
    inputSchema: DiagramGenerationInputSchema,
    outputSchema: DiagramGenerationOutputSchema,
  },
  async input => {
    const {output} = await diagramGenerationPrompt(input);
    // Additional check to remove fences if AI still includes them, though the prompt should prevent it.
    if (output && output.diagramCode) {
        const fenceRegex = /^\s*```(?:mermaid)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
        const match = output.diagramCode.match(fenceRegex);
        if (match && match[1]) {
            output.diagramCode = match[1].trim();
        } else {
            // Also trim if no fences were found, just in case of leading/trailing whitespace from AI
            output.diagramCode = output.diagramCode.trim();
        }
    }
    return output!;
  }
);

