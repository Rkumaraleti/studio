"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { suggestMenuItemDescriptions, SuggestMenuItemDescriptionsInput } from '@/ai/flows/suggest-menu-descriptions';
import { useToast } from '@/hooks/use-toast';

interface AiDescriptionGeneratorProps {
  itemName: string;
  onSuggestionAccept: (description: string) => void;
}

export function AiDescriptionGenerator({ itemName, onSuggestionAccept }: AiDescriptionGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    if (!itemName.trim()) {
      toast({
        title: "Item Name Required",
        description: "Please enter an item name before generating a description.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const input: SuggestMenuItemDescriptionsInput = { itemName };
        const result = await suggestMenuItemDescriptions(input);
        if (result.description) {
          setSuggestedDescription(result.description);
          toast({
            title: "Suggestion Ready",
            description: "AI has generated a description for your item.",
          });
        } else {
          throw new Error("No description generated.");
        }
      } catch (error) {
        console.error("Error generating AI description:", error);
        toast({
          title: "Error",
          description: "Failed to generate AI description. Please try again.",
          variant: "destructive",
        });
        setSuggestedDescription('');
      }
    });
  };

  return (
    <div className="space-y-2 mt-4">
      <Button
        type="button"
        onClick={handleGenerateDescription}
        disabled={isPending || !itemName.trim()}
        variant="outline"
        size="sm"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Suggest with AI
      </Button>
      {suggestedDescription && (
        <div className="space-y-2 p-3 border rounded-md bg-secondary/30">
          <Label htmlFor="ai-suggested-description">AI Suggested Description:</Label>
          <Textarea
            id="ai-suggested-description"
            value={suggestedDescription}
            readOnly
            rows={3}
            className="bg-background"
          />
          <Button
            type="button"
            onClick={() => {
              onSuggestionAccept(suggestedDescription);
              setSuggestedDescription(''); // Clear suggestion after accepting
            }}
            size="sm"
          >
            Accept Suggestion
          </Button>
        </div>
      )}
    </div>
  );
}
