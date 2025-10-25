import { tool } from "ai";
import z from "zod";

const webSearchSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  links: z.number().optional(),
  imageLinks: z.number().optional(),
  numResults: z.number().optional()
});

type WebSearchInput = z.infer<typeof webSearchSchema>;

// Placeholder implementation: network access is restricted in this environment.
// Return a structured stub so the caller can decide how to handle it.
export function getWebSearchTool() {
  return {
    "websearch--web_search": tool({
      description: "Stub web search tool. Returns an empty result set in this environment.",
      inputSchema: webSearchSchema,
      execute: async (params) => webSearch(params)
    })
  };
}

export async function webSearch({ query, category, links, imageLinks, numResults }: WebSearchInput) {
  return {
    query,
    category: category ?? null,
    links: links ?? 0,
    imageLinks: imageLinks ?? 0,
    numResults: numResults ?? 5,
    results: []
  } as const;
}


