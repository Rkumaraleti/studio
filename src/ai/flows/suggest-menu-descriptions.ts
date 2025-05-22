// 'use server';

/**
 * @fileOverview AI-powered menu item description generator.
 *
 * - suggestMenuItemDescriptions - A function that generates menu item descriptions.
 * - SuggestMenuItemDescriptionsInput - The input type for the suggestMenuItemDescriptions function.
 * - SuggestMenuItemDescriptionsOutput - The return type for the suggestMenuItemDescriptions function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMenuItemDescriptionsInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
});
export type SuggestMenuItemDescriptionsInput = z.infer<typeof SuggestMenuItemDescriptionsInputSchema>;

const SuggestMenuItemDescriptionsOutputSchema = z.object({
  description: z.string().describe('An enticing description of the menu item.'),
});
export type SuggestMenuItemDescriptionsOutput = z.infer<typeof SuggestMenuItemDescriptionsOutputSchema>;

export async function suggestMenuItemDescriptions(input: SuggestMenuItemDescriptionsInput): Promise<SuggestMenuItemDescriptionsOutput> {
  return suggestMenuItemDescriptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMenuItemDescriptionsPrompt',
  input: {schema: SuggestMenuItemDescriptionsInputSchema},
  output: {schema: SuggestMenuItemDescriptionsOutputSchema},
  prompt: `You are a creative marketing expert specializing in food.  Generate an enticing description for the following menu item:

Item Name: {{{itemName}}}

Description:`, // Keep this to one line.
});

const suggestMenuItemDescriptionsFlow = ai.defineFlow(
  {
    name: 'suggestMenuItemDescriptionsFlow',
    inputSchema: SuggestMenuItemDescriptionsInputSchema,
    outputSchema: SuggestMenuItemDescriptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
