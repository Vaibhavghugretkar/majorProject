// src/components/diagram/code-view.tsx
"use client";

import type { FC } from 'react';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCode2, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeViewProps {
  diagramCode: string;
  onCodeChange: (newCode: string) => void;
  isLoading: boolean;
  className?: string;
}

const CodeView: FC<CodeViewProps> = ({ diagramCode, onCodeChange, isLoading, className = "" }) => {
  const { toast } = useToast();

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

  return (
    <Card className={`flex flex-col shadow-lg ${className}`}>
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center text-primary">
          <FileCode2 className="mr-2 h-5 w-5" />
          Diagram Code (Mermaid)
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCode}
          disabled={isLoading || !diagramCode}
          className="ml-auto px-3 border-primary text-primary hover:bg-primary/10 hover:text-primary"
          aria-label="Copy diagram code"
        >
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy
        </Button>
      </CardHeader>
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
  );
};

export default CodeView;