# Figmatic: AI Diagram Generation Tool

Figmatic is an AI-powered diagramming platform that converts natural language prompts into professional, standards-compliant diagrams using Mermaid and related diagramming syntaxes.

---

## Overview

Figmatic helps teams visualize complex systems, architectures, workflows, and data relationships through automated diagram generation.  
It leverages large language models (Gemini) to translate plain-English descriptions into structured Mermaid code, enabling rapid creation of UML, ER, flowcharts, and other diagram types.

---

## Features

- **Text-to-diagram generation**: Convert natural language prompts directly into UML, ER, flowcharts, sequence diagrams, and more.  
- Conversational refinement: Update and refine diagrams incrementally using chat-style instructions.  
- Multimodal-ready design: Architecture planned to support text, annotated images, and sketches as inputs.  
- Real-time preview: Live Mermaid rendering with instant visual feedback as the diagram code changes.  
- Round-trip editing: Convert diagrams back into structured text for further modification and regeneration.  
- Auto-save history: Maintain a revision timeline with compare and restore capabilities.  
- Repository analyzer: Generate architectural diagrams from GitHub repository URLs.  
- Multi-format export: Export diagrams as PNG, JPG, SVG, and JSON while preserving Mermaid source.

---

## Architecture

The system is built as a modular Next.js application, orchestrating AI flows, UI, and diagram rendering.  
Core components include a prompt UI, Genkit–Gemini orchestration layer, suggestion engine, Mermaid renderer, history manager, and export services.

### High-level flow

1. User enters a natural language prompt (and optionally selects a diagram type or uploads context).  
2. Prompt processor validates and shapes input for the AI orchestration layer.  
3. Genkit sends the request to Gemini, which returns Mermaid diagram code and optional diagram-type suggestions.  
4. Mermaid renderer displays the diagram with instant preview and error feedback.  
5. History manager auto-saves each revision and enables restore/compare actions.  
6. Export service produces PNG/JPG/SVG/JSON artifacts from the selected revision.

---

## Technology Stack

- **Frontend**: Next.js (App Router), React client components.  
- **Language**: TypeScript for robust static typing.  
- **AI orchestration**: Genkit, integrating Google’s Gemini models for prompt understanding and diagram code generation.  
- **Diagram rendering**: Mermaid.js for deterministic diagram rendering from Mermaid syntax.  
- **UI components**: shadcn/ui (Radix UI) with Tailwind CSS for styling.  
- **Icons**: Lucide React.  
- **Data & session**: MongoDB/JSON-style storage for session and history (design), plus React context for mock authentication and session state.  
- **Supporting tools**: Graphviz, PlantUML, and CV/NLP/LLM frameworks considered for multimodal and export capabilities.

---

## Core Workflows

### Prompt-to-diagram generation

- Validate user prompt and optional selected diagram type and previous diagram code.  
- Analyze user intent, optionally suggest a more suitable diagram family, and generate new or updated Mermaid code.  
- Enforce Mermaid rules (labels, syntax cleanup, no external images/links, etc.) before returning the final diagram code.

### GitHub repository analyzer

- Accept a GitHub repository URL from the user.  
- Call a backend API to analyze the repository and return Mermaid diagram code representing project structure.  
- Render, clean, and fix Mermaid syntax, then allow copying code or downloading SVG/PNG outputs.

---




