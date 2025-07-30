// src/components/diagram/diagram-view.tsx
"use client";

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import { renderMermaidDiagram } from '@/lib/mermaid-utils';
import { Loader2, Image as ImageIcon, Maximize, Code2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DiagramViewProps {
  diagramCode: string;
  isLoading: boolean;
  onViewFullScreen: () => void;
  isCodeVisible: boolean;
  onToggleCodeVisibility: () => void;
  className?: string;
}

const DiagramView: FC<DiagramViewProps> = ({ 
  diagramCode, 
  isLoading, 
  onViewFullScreen, 
  isCodeVisible, 
  onToggleCodeVisibility, 
  className = "" 
}) => {
  const diagramContainerId = 'mermaid-diagram-container'; // Main view container ID
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const prevCodeRef = useRef<string | undefined>();
  const prevIsLoadingRef = useRef<boolean | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    const containerElement = diagramContainerRef.current;

    if (!isLoading) {
      if (diagramCode && containerElement) {
        // Render if code changed OR if loading state just finished and there's code
        if (diagramCode !== prevCodeRef.current || (prevIsLoadingRef.current === true && !isLoading)) {
          renderMermaidDiagram(diagramContainerId, diagramCode);
        }
      } else if (!diagramCode && containerElement) {
        // Clear the container if there's no code
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
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center text-primary">
          <ImageIcon className="mr-2 h-5 w-5" />
          Diagram Preview
        </CardTitle>
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCodeVisibility}
              disabled={isLoading}
              className="ml-auto px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
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
              className="ml-auto px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
              aria-label="View diagram fullscreen"
            >
              <Maximize className="mr-2 h-4 w-4" />
              Fullscreen
            </Button>
        </div>
      </CardHeader>
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
        
        {/* This div is where Mermaid renders the diagram for the main panel view */}
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
