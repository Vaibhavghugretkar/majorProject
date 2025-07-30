
// src/components/diagram/prompt-form.tsx
"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Paperclip, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptFormProps {
  onSubmit: (prompt: string) => Promise<void>;
  isLoading: boolean;
  documentFile: File | null;
  setDocumentFile: (file: File | null) => void;
}

const PromptForm: FC<PromptFormProps> = ({ onSubmit, isLoading, documentFile, setDocumentFile }) => {
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
        });
        setDocumentFile(null);
        event.target.value = ''; // Reset file input
      } else {
        setDocumentFile(file);
        setPrompt(prev => prev ? `${prev} ${file.name}` : file.name); // Add filename to prompt
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && !documentFile) || isLoading) return;
    await onSubmit(prompt || "Summarize the uploaded document into a diagram.");
    setPrompt(''); // Clear prompt after submit
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Make the database node green..."
          rows={3}
          className="resize-none bg-input focus-visible:ring-accent pr-24"
          disabled={isLoading}
          aria-label="Chat message input"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
          }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
            <Input
                id="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept=".pdf,.txt,.md,.json,.doc,.docx,.png,.jpg,.jpeg,.webp"
                disabled={isLoading}
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="ghost" size="icon" asChild className="pointer-events-none text-muted-foreground hover:text-foreground">
                    <span><Paperclip className="h-5 w-5" /></span>
                </Button>
            </Label>
            <Button type="submit" size="icon" disabled={isLoading || (!prompt.trim() && !documentFile)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
            </Button>
        </div>
      </div>
       {documentFile && (
            <div className="flex items-center justify-between p-1.5 bg-muted/50 rounded-md text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                <Paperclip className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-foreground" title={documentFile.name}>
                    Attached: {documentFile.name}
                </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={() => setDocumentFile(null)}
                    aria-label="Remove file"
                >
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
            </div>
        )}
    </form>
  );
};

export default PromptForm;
