"use client";

import type { NextPage } from "next";
import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import AppHeader from "@/components/layout/app-header";
import DiagramView from "@/components/diagram/diagram-view";
import CodeView from "@/components/diagram/code-view";
import ChatInput from "@/components/diagram/prompt-form";
import ExportControls from "@/components/diagram/export-controls";
import { generateDiagram } from "@/ai/flows/diagram-generation";
import type { DiagramGenerationInput } from "@/ai/flows/diagram-generation";
import { useToast } from "@/hooks/use-toast";
import { renderMermaidDiagram } from "@/lib/mermaid-utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Network,
  XIcon,
  Bot,
  User,
  Lightbulb,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Canvg } from "canvg";

interface Message {
  role: "user" | "assistant" | string;
  content: string;
  diagramSvg?: string;
  diagramCode?: string;
}

interface Suggestion {
  suggestedType: string;
  reason: string;
  originalPrompt: string;
}

const DiagramPage: NextPage = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [diagramCode, setDiagramCode] = useState("");
  const [currentSvgContent, setCurrentSvgContent] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! Describe the diagram you'd like to create, or ask me to modify the current one.",
    },
  ]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const diagramTypes = [
    { value: "flowchart", label: "Flowchart" },
    { value: "classDiagram", label: "UML Class Diagram" },
    { value: "sequenceDiagram", label: "UML Sequence Diagram" },
    { value: "stateDiagram", label: "UML State Diagram" },
    { value: "erDiagram", label: "ER Diagram" },
    { value: "gantt", label: "Gantt Chart" },
    { value: "mindmap", label: "Mind Map" },
    { value: "timeline", label: "Timeline" },
    { value: "networkDiagram", label: "Network Diagram" },
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) router.replace("/login");
  }, [currentUser, authLoading, router]);

  // Fetch chat history
  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser || !currentUser._id) return;
      try {
        const res = await fetch(`/api/chats/${currentUser._id}`);
        if (!res.ok) throw new Error("Failed to fetch chat history");
        const data = await res.json();
        let messagesWithSvg = data.messages || [];
        setMessages(messagesWithSvg);

        // Set last diagram code if exists
        const lastDiagramMsg = messagesWithSvg
          .slice()
          .reverse()
          .find((m: Message) => m.diagramCode);
        if (lastDiagramMsg && lastDiagramMsg.diagramCode) {
          setDiagramCode(lastDiagramMsg.diagramCode);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchChats();
  }, [currentUser]);

  const debouncedRenderDiagram = useCallback(
    debounce(
      async (code: string, containerId: string = "mermaid-diagram-container") => {
        const svg = await renderMermaidDiagram(containerId, code);
        if (svg && containerId === "mermaid-diagram-container")
          setCurrentSvgContent(svg);
        return svg;
      },
      300
    ),
    []
  );

  useEffect(() => {
    if (isDiagramModalOpen && diagramCode) {
      startTransition(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        await debouncedRenderDiagram(diagramCode, "mermaid-modal-diagram-container");
      });
    }
  }, [isDiagramModalOpen, diagramCode, debouncedRenderDiagram]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, suggestion]);

  const persistChat = async (updatedMessages: Message[]) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const res = await fetch(`/api/chats/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to persist chat:", errText);
      }
    } catch (err) {
      console.error("Failed to persist chat:", err);
    }
  };

  // Update last assistant diagram message on code edit
  const handleCodeChange = (newCode: string) => {
    setDiagramCode(newCode);
    startTransition(() => {
      debouncedRenderDiagram(newCode);
    });

    const updatedMessages = [...messages];
    for (let i = updatedMessages.length - 1; i >= 0; i--) {
      const msg = updatedMessages[i];
      if (msg.role === "assistant" && msg.diagramCode !== undefined) {
        renderMermaidDiagram("mermaid-diagram-container-chat", newCode).then(
          (svg) => {
            msg.diagramCode = newCode;
            msg.diagramSvg = svg;
            setMessages(updatedMessages);
            persistChat(updatedMessages);
          }
        );
        break;
      }
    }
  };

  const handleGenerateSvgForMessage = async (msgIndex: number, code: string) => {
    try {
      const svg = await renderMermaidDiagram("mermaid-diagram-container-chat", code);

      setMessages((prevMessages) => {
        const updated = [...prevMessages];
        updated[msgIndex] = {
          ...updated[msgIndex],
          diagramSvg: svg,
        };
        return updated;
      });

      setDiagramCode(code);
      setCurrentSvgContent(svg || "");

      persistChat(messages.map((m, idx) => idx === msgIndex ? { ...m, diagramSvg: svg } : m));
    } catch (error) {
      console.error("Failed to generate SVG for message:", error);
    }
  };

  const handleSendMessage = async (promptText: string, newDiagramType?: string) => {
    if (!promptText.trim()) return;
    setSuggestion(null);

    const updatedMessages: Message[] = [...messages, { role: "user", content: promptText }];
    setMessages(updatedMessages);

    startTransition(async () => {
      try {
        let documentDataUri: string | undefined;
        if (documentFile) {
          documentDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(documentFile);
          });
          setDocumentFile(null);
        }

        const input: DiagramGenerationInput = {
          prompt: promptText,
          currentDiagramLabel:
            diagramTypes.find((d) => d.value === (newDiagramType || diagramType))?.label || "Flowchart",
          previousDiagramCode: diagramCode || undefined,
          documentDataUri,
        };

        const result = await generateDiagram(input);
        setDiagramCode(result.diagramCode);

        const svg = await renderMermaidDiagram("mermaid-diagram-container-chat", result.diagramCode);

        let assistantMsg: Message;

        if (newDiagramType) {
          assistantMsg = {
            role: "assistant",
            content: "I've regenerated the diagram with the new type.",
            diagramSvg: svg,
            diagramCode: result.diagramCode,
          };
        } else if (result.suggestedDiagramType && result.suggestionReason) {
          setSuggestion({
            suggestedType: result.suggestedDiagramType,
            reason: result.suggestionReason,
            originalPrompt: promptText,
          });
          assistantMsg = {
            role: "assistant",
            content: "I have a suggestion for a different diagram type.",
            diagramSvg: svg,
            diagramCode: result.diagramCode,
          };
        } else {
          assistantMsg = {
            role: "assistant",
            content: "I've updated the diagram based on your request.",
            diagramSvg: svg,
            diagramCode: result.diagramCode,
          };
        }

        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        persistChat(finalMessages);
      } catch (error) {
        const errorMessage = (error as Error).message || "An unexpected error occurred.";
        const errorMsg: Message = { role: "assistant", content: `Error: ${errorMessage}` };
        const finalMessages = [...updatedMessages, errorMsg];
        setMessages(finalMessages);
        toast({
          variant: "destructive",
          title: "Error Generating Diagram",
          description: errorMessage,
        });
        persistChat(finalMessages);
      }
    });
  };

  const handleAcceptSuggestion = () => {
    if (!suggestion) return;
    const { suggestedType, originalPrompt } = suggestion;
    setDiagramType(suggestedType);
    setMessages((prev) => [...prev, { role: "user", content: `Okay, let's try it as a '${suggestedType}'.` }]);
    setSuggestion(null);
    handleSendMessage(originalPrompt, suggestedType);
  };

  const handleOpenDiagramModal = () => diagramCode && setIsDiagramModalOpen(true);

  // ✅ Updated download handlers
const handleExportSVG = () => {
  // Get the actual rendered SVG element in the DOM
  const svgElement = document.querySelector("#mermaid-diagram-container svg") as SVGSVGElement;
  if (!svgElement) {
    console.error("SVG element not found");
    return;
  }

  // Serialize the SVG element to a string
  let svgContent = new XMLSerializer().serializeToString(svgElement);

  // Ensure XML namespace exists
  if (!svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgContent = svgContent.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  // Create blob and trigger download
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "diagram.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};



const handleExportPNG = async () => {
  const svgElement = document.querySelector("#mermaid-diagram-container svg") as SVGSVGElement;
  if (!svgElement) return;

  const svgContent = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const v = await Canvg.fromString(ctx, svgContent);
  await v.render();

  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "diagram.png";
    link.click();
  });
};


  const handleExportJSON = () => {
    if (!diagramCode) return;
    const blob = new Blob([JSON.stringify({ diagramCode }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagram.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading || !currentUser)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-grow p-2 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={35} minSize={25} className="flex flex-col p-2 gap-2">
            <Card className="flex-grow flex flex-col min-h-0">
              <CardHeader>
                <CardTitle className="text-primary flex items-center">
                  <Bot className="mr-2 h-5 w-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full p-4" ref={chatContainerRef}>
                  <div className="flex flex-col gap-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 border">
                            <Bot className="h-5 w-5 text-primary mx-auto" />
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-2 max-w-[85%]">
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              message.role === "user" ? "bg-primary text-white" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>

                          {message.diagramSvg && (
                            <div
                              className="border rounded-lg overflow-auto"
                              dangerouslySetInnerHTML={{ __html: message.diagramSvg }}
                            />
                          )}
                          {!message.diagramSvg && message.diagramCode && (
                            <pre
                              className="text-xs bg-gray-100 p-2 rounded cursor-pointer"
                              onClick={() => handleGenerateSvgForMessage(index, message.diagramCode!)}
                            >
                              {message.diagramCode}
                            </pre>
                          )}
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 border">
                            <User className="h-5 w-5 mx-auto" />
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p>Thinking...</p>
                      </div>
                    )}
                    {suggestion && (
                      <Alert>
                        <Lightbulb className="h-5 w-5" />
                        <AlertTitle>Suggestion</AlertTitle>
                        <AlertDescription>{suggestion.reason}</AlertDescription>
                        <div className="mt-2 flex gap-2">
                          <Button onClick={handleAcceptSuggestion}>Switch</Button>
                          <Button variant="outline" onClick={() => setSuggestion(null)}>
                            Dismiss
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-2 border-t">
                <ChatInput onSubmit={handleSendMessage} isLoading={isPending} documentFile={documentFile} setDocumentFile={setDocumentFile} />
              </div>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center">
                  <Network className="mr-2 h-5 w-5" />
                  Diagram Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Diagram Type</label>
                  <Select value={diagramType} onValueChange={setDiagramType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {diagramTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Export Options</label>
                  <ExportControls onExportSVG={handleExportSVG} onExportPNG={handleExportPNG} onExportJSON={handleExportJSON} canExport={!!diagramCode} />
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Diagram + Code Panel */}
          <ResizablePanel defaultSize={65} minSize={30} className="flex flex-col p-2 gap-2">
            {isCodeVisible ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
                  <DiagramView
                    diagramCode={diagramCode}
                    isLoading={isPending}
                    onViewFullScreen={handleOpenDiagramModal}
                    isCodeVisible={isCodeVisible}
                    onToggleCodeVisibility={() => setIsCodeVisible((v) => !v)}
                    className="flex-grow"
                    hideHeader={false}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
                  <CodeView diagramCode={diagramCode} onCodeChange={handleCodeChange} isLoading={isPending} className="flex-grow" hideHeader={false} />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <DiagramView
                diagramCode={diagramCode}
                isLoading={isPending}
                onViewFullScreen={handleOpenDiagramModal}
                isCodeVisible={isCodeVisible}
                onToggleCodeVisibility={() => setIsCodeVisible((v) => !v)}
                className="flex-grow"
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <Dialog open={isDiagramModalOpen} onOpenChange={setIsDiagramModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-w-none max-h-none p-0 m-0 rounded-lg">
          <DialogTitle className="sr-only">Diagram Fullscreen</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-3 left-3 z-50">
              <XIcon className="h-6 w-6" />
            </Button>
          </DialogClose>
          <div className="w-full h-full p-8 overflow-auto">
            <div id="mermaid-modal-diagram-container" className="min-w-full min-h-full" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Debounce helper function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default DiagramPage;
