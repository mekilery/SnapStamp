'use server';

/**
 * @fileOverview A flow that suggests relevant nearby businesses to include in a photo's location tag.
 *
 * - determineNearbyBusiness - A function that handles the determination of a relevant nearby business.
 * - DetermineNearbyBusinessInput - The input type for the determineNearbyBusiness function.
 * - DetermineNearbyBusinessOutput - The return type for the determineNearbyBusiness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineNearbyBusinessInputSchema = z.object({
  locationDescription: z
    .string()
    .describe('A description of the location where the photo was taken.'),
  nearbyBusinesses: z
    .array(z.string())
    .describe('A list of nearby businesses at the location.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the location, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetermineNearbyBusinessInput = z.infer<
  typeof DetermineNearbyBusinessInputSchema
>;

const DetermineNearbyBusinessOutputSchema = z.object({
  includeBusiness: z
    .string()
    .optional()
    .describe(
      'The name of the nearby business to include in the location tag, if any. If none, this field should be empty.'
    ),
  reason: z
    .string()
    .optional()
    .describe('The reason for including or not including the business.'),
});
export type DetermineNearbyBusinessOutput = z.infer<
  typeof DetermineNearbyBusinessOutputSchema
>;

export async function determineNearbyBusiness(
  input: DetermineNearbyBusinessInput
): Promise<DetermineNearbyBusinessOutput> {
  return determineNearbyBusinessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineNearbyBusinessPrompt',
  input: {schema: DetermineNearbyBusinessInputSchema},
  output: {schema: DetermineNearbyBusinessOutputSchema},
  prompt: `You are an expert advisor on determining relevant nearby businesses to include in a photo's location tag.

  Given the following location description, list of nearby businesses, and a photo, determine whether to include one of the businesses in the location tag.

  Location Description: {{{locationDescription}}}
  Nearby Businesses: {{#each nearbyBusinesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Photo: {{media url=photoDataUri}}

  Consider the relevance of each business to the photo and the location. Only include a business if it adds significant context or interest to the photo. If no business is relevant, leave the includeBusiness field empty.

  Explain your reasoning in the reason field.

  Output in JSON format:
  {{outputSchema}}`,
});

const determineNearbyBusinessFlow = ai.defineFlow(
  {
    name: 'determineNearbyBusinessFlow',
    inputSchema: DetermineNearbyBusinessInputSchema,
    outputSchema: DetermineNearbyBusinessOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
