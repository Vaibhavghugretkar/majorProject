// src/components/diagram/diagram-view.tsx
"use client";

import type { FC } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { renderMermaidDiagram } from '@/lib/mermaid-utils';
import { Loader2, Image as ImageIcon, Maximize, Code2Icon, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiagramViewProps {
  diagramCode: string;
  isLoading: boolean;
  onViewFullScreen: () => void;
  isCodeVisible: boolean;
  onToggleCodeVisibility: () => void;
  className?: string;
  hideHeader?: boolean;
}

const DiagramView: FC<DiagramViewProps> = ({ 
  diagramCode, 
  isLoading, 
  onViewFullScreen, 
  isCodeVisible, 
  onToggleCodeVisibility, 
  className = "",
  hideHeader = false 
}) => {
  const diagramContainerId = 'mermaid-diagram-container';
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const prevCodeRef = useRef<string | undefined>();
  const prevIsLoadingRef = useRef<boolean | undefined>();
  const [isCompact, setIsCompact] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Monitor header width to determine if we should show compact view
  useEffect(() => {
    if (!headerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // If header width is less than 400px, show compact menu
        setIsCompact(entry.contentRect.width < 400);
      }
    });

    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const containerElement = diagramContainerRef.current;

    if (!isLoading) {
      if (diagramCode && containerElement) {
        if (diagramCode !== prevCodeRef.current || (prevIsLoadingRef.current === true && !isLoading)) {
          renderMermaidDiagram(diagramContainerId, diagramCode);
        }
      } else if (!diagramCode && containerElement) {
        renderMermaidDiagram(diagramContainerId, "");
      }
    }
    
    prevCodeRef.current = diagramCode;
    prevIsLoadingRef.current = isLoading;

  }, [diagramCode, isLoading]);

  const handleViewFullScreen = () => {
    if (!diagramCode && !isLoading) {
      toast({
        variant: "destructive",
        title: "No Diagram",
        description: "There's no diagram to view in fullscreen.",
      });
      return;
    }
    if (!isLoading) {
        onViewFullScreen();
    }
  };

  return (
    <Card className={`flex flex-col shadow-lg h-full ${className}`}>
      {!hideHeader && (
        <CardHeader ref={headerRef} className="py-3 px-4 border-b flex flex-row items-center justify-between min-h-[60px]">
          <CardTitle className="text-lg flex items-center text-primary">
            <ImageIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className={isCompact ? "hidden" : ""}>Diagram Preview</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isCompact ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleCodeVisibility}
                  disabled={isLoading}
                  className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label="Toggle code editor visibility"
                >
                  <Code2Icon className="mr-2 h-4 w-4" />
                  {isCodeVisible ? 'Hide Code' : 'Show Code'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewFullScreen}
                  disabled={isLoading || !diagramCode}
                  className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label="View diagram fullscreen"
                >
                  <Maximize className="mr-2 h-4 w-4" />
                  Fullscreen
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label="Diagram options"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={onToggleCodeVisibility}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    <Code2Icon className="mr-2 h-4 w-4" />
                    {isCodeVisible ? 'Hide Code' : 'Show Code'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleViewFullScreen}
                    disabled={isLoading || !diagramCode}
                    className="cursor-pointer"
                  >
                    <Maximize className="mr-2 h-4 w-4" />
                    Fullscreen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 flex-grow flex flex-col relative overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-3 text-lg text-foreground">Generating Diagram...</p>
          </div>
        )}

        {!isLoading && !diagramCode && (
          <div className="min-h-[200px] w-full flex-grow flex items-center justify-center text-center flex-col text-muted-foreground p-4">
            <ImageIcon className="w-16 h-16 mb-3" />
            <p className="text-md">Your diagram will appear here.</p>
            <p className="text-xs">Use the prompt or code editor to get started.</p>
          </div>
        )}
        
        <div
          ref={diagramContainerRef}
          id={diagramContainerId}
          className={`min-h-[200px] w-full flex-grow flex items-start justify-center p-4 ${!diagramCode || isLoading ? 'hidden' : ''}`}
        />
      </CardContent>
    </Card>
  );
};

export default DiagramView;