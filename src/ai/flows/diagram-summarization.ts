// diagram-summarization.ts
'use server';
/**
 * @fileOverview Summarizes the contents of a diagram provided as code.
 *
 * - summarizeDiagram - A function that accepts diagram code and returns a summary.
 * - DiagramSummarizationInput - The input type for the summarizeDiagram function.
 * - DiagramSummarizationOutput - The return type for the summarizeDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagramSummarizationInputSchema = z.object({
  diagramCode: z
    .string()
    .describe('The code representing the diagram (e.g., Mermaid, Graphviz).'),
});

export type DiagramSummarizationInput = z.infer<typeof DiagramSummarizationInputSchema>;

const DiagramSummarizationOutputSchema = z.object({
  summary: z.string().describe('A textual summary of the diagram.'),
});

export type DiagramSummarizationOutput = z.infer<typeof DiagramSummarizationOutputSchema>;

export async function summarizeDiagram(input: DiagramSummarizationInput): Promise<DiagramSummarizationOutput> {
  return diagramSummarizationFlow(input);
}

const diagramSummarizationPrompt = ai.definePrompt({
  name: 'diagramSummarizationPrompt',
  input: {schema: DiagramSummarizationInputSchema},
  output: {schema: DiagramSummarizationOutputSchema},
  prompt: `You are an expert in understanding diagrams represented as code.

  Please analyze the following diagram code and provide a concise summary of what the diagram represents.

  Diagram Code:
  \`\`\`
  {{{diagramCode}}}
  \`\`\`

  Summary:`, // Ensure the output focuses solely on the diagram's summary.
});

const diagramSummarizationFlow = ai.defineFlow(
  {
    name: 'diagramSummarizationFlow',
    inputSchema: DiagramSummarizationInputSchema,
    outputSchema: DiagramSummarizationOutputSchema,
  },
  async input => {
    const {output} = await diagramSummarizationPrompt(input);
    return output!;
  }
);
