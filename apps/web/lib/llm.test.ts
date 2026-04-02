import Anthropic from '@anthropic-ai/sdk';

import {callClaude, createAnthropicClient} from './llm';

jest.mock('@anthropic-ai/sdk');

describe('llm', () => {
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('createAnthropicClient', () => {
    it('creates and returns an Anthropic client when API key is set', () => {
      const client = createAnthropicClient();

      expect(client).toBeInstanceOf(Anthropic);
      expect(Anthropic).toHaveBeenCalledWith({apiKey: mockApiKey});
    });

    it('throws an error when ANTHROPIC_API_KEY environment variable is not set', () => {
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => createAnthropicClient()).toThrow(
        'ANTHROPIC_API_KEY environment variable is not set',
      );
    });
  });

  describe('callClaude', () => {
    it('returns text content from Claude response', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{text: 'Sample response', type: 'text'}],
            stop_reason: 'end_turn',
          }),
        },
      } as unknown as Anthropic;

      const result = await callClaude(
        mockClient,
        'You are helpful.',
        'What is 2+2?',
      );

      expect(result).toBe('Sample response');
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        max_tokens: 4096,
        messages: [{content: 'What is 2+2?', role: 'user'}],
        model: 'claude-sonnet-4-5',
        system: 'You are helpful.',
      });
    });

    it('throws claude_empty_response when content is not text', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{type: 'image'}],
            stop_reason: 'end_turn',
          }),
        },
      } as unknown as Anthropic;

      await expect(callClaude(mockClient, 'system', 'user')).rejects.toThrow(
        'claude_empty_response',
      );
    });

    it('throws claude_empty_response when content is empty', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [],
            stop_reason: 'end_turn',
          }),
        },
      } as unknown as Anthropic;

      await expect(callClaude(mockClient, 'system', 'user')).rejects.toThrow(
        'claude_empty_response',
      );
    });

    it('throws claude_content_filtered when max_tokens is reached', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{text: 'Truncated response...', type: 'text'}],
            stop_reason: 'max_tokens',
          }),
        },
      } as unknown as Anthropic;

      await expect(callClaude(mockClient, 'system', 'user')).rejects.toThrow(
        'claude_content_filtered',
      );
    });

    it('propagates Anthropic SDK errors', async () => {
      const mockError = new Error('Rate limit exceeded');
      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue(mockError),
        },
      } as unknown as Anthropic;

      await expect(callClaude(mockClient, 'system', 'user')).rejects.toThrow(
        'Rate limit exceeded',
      );
    });
  });
});
