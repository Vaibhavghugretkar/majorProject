// src/components/diagram/code-view.tsx
"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { FileCode2, ClipboardCopy, Maximize2, XIcon, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CodeViewProps {
  diagramCode: string;
  onCodeChange: (newCode: string) => void;
  isLoading: boolean;
  className?: string;
  hideHeader?: boolean;
}

const CodeView: FC<CodeViewProps> = ({ diagramCode, onCodeChange, isLoading, className = "", hideHeader = false }) => {
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Monitor header width to determine if we should show compact view
  useEffect(() => {
    if (!headerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // If header width is less than 350px, show compact menu
        setIsCompact(entry.contentRect.width < 350);
      }
    });

    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCopyCode = async () => {
    if (!diagramCode) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Copy',
        description: 'There is no code in the editor.',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(diagramCode);
      toast({
        title: 'Code Copied!',
        description: 'Diagram code copied to clipboard.',
      });
    } catch (err) {
      console.error('Failed to copy code: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy code to clipboard.',
      });
    }
  };

  const handleFullScreen = () => {
    setIsFullScreen(true);
  };

  return (
    <>
      <Card className={`flex flex-col shadow-lg ${className}`}>
        {!hideHeader && (
          <CardHeader ref={headerRef} className="py-3 px-4 border-b flex flex-row items-center justify-between min-h-[60px]">
            <CardTitle className="text-lg flex items-center text-primary">
              <FileCode2 className="mr-2 h-5 w-5 flex-shrink-0" />
              <span className={isCompact ? "hidden" : ""}>Diagram Code (Mermaid)</span>
            </CardTitle>
            <div className="flex gap-2">
              {!isCompact ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullScreen}
                    disabled={isLoading}
                    className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label="Open fullscreen editor"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    disabled={isLoading || !diagramCode}
                    className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label="Copy diagram code"
                  >
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                      aria-label="Code options"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={handleFullScreen}
                      disabled={isLoading}
                      className="cursor-pointer"
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Fullscreen
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyCode}
                      disabled={isLoading || !diagramCode}
                      className="cursor-pointer"
                    >
                      <ClipboardCopy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0 flex-grow flex">
          <Textarea
            value={diagramCode}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="graph TD; A-->B;"
            className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm bg-background"
            disabled={isLoading}
            aria-label="Diagram Code Editor"
          />
        </CardContent>
      </Card>

      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-w-none max-h-none p-0 m-0 rounded-lg">
          <DialogTitle className="sr-only">Code Editor Fullscreen</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-50">
              <XIcon className="h-6 w-6" />
            </Button>
          </DialogClose>
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-muted/50">
              <div className="flex items-center">
                <FileCode2 className="mr-2 h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-primary">Diagram Code (Mermaid)</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={isLoading || !diagramCode}
                className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                aria-label="Copy diagram code"
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={diagramCode}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="graph TD; A-->B;"
                className="h-full w-full resize-none border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 font-mono text-sm bg-background"
                disabled={isLoading}
                aria-label="Diagram Code Editor Fullscreen"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeView;