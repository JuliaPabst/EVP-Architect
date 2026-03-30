import Anthropic from '@anthropic-ai/sdk';

/**
 * Factory function to create an Anthropic client
 * @returns Anthropic client instance
 * @throws Error if ANTHROPIC_API_KEY environment variable is not set
 */
export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  return new Anthropic({apiKey});
}

/**
 * Call Claude Sonnet and return the text response
 * @param client Anthropic client instance
 * @param systemPrompt System message defining the role and instructions
 * @param userPrompt User message with the task
 * @returns The text response from Claude
 * @throws Error with code 'claude_empty_response' if the response contains no text
 * @throws Error with code 'claude_content_filtered' if the response was cut off (stop_reason: max_tokens)
 * @throws Other Anthropic SDK errors for timeout, rate limit, etc.
 */
export async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await client.messages.create({
    max_tokens: 4096,
    messages: [
      {
        content: userPrompt,
        role: 'user',
      },
    ],
    model: 'claude-sonnet-4-5',
    system: systemPrompt,
  });

  const content = response.content[0];

  if (content?.type !== 'text') {
    throw new Error('claude_empty_response');
  }

  if (response.stop_reason === 'max_tokens') {
    throw new Error('claude_content_filtered');
  }

  return content.text;
}
