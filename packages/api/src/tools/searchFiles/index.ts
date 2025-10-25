import { getTextObject, listKeys, projectPrefix } from "../s3";
import { tool } from "ai";
import z from "zod";

const searchSchema = z.object({
  query: z.string().describe("Regex pattern to search for (use \\ to escape)"),
  include_pattern: z.string().describe("Glob of files to include, e.g., src/**"),
  exclude_pattern: z.string().optional().describe("Glob to exclude, e.g., **/*.test.tsx"),
  case_sensitive: z.boolean().optional().describe("Case sensitive search (default false)")
});

type SearchInput = z.infer<typeof searchSchema>;

function globToRegex(glob: string) {
  const escaped = glob.replace(/[.+^${}()|\[\]\\]/g, "\\$&");
  const regexStr = "^" + escaped.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$";
  return new RegExp(regexStr);
}

export function getSearchFilesTool(projectId: string) {
  return {
    "webgen-search-files": tool({
      description: "Regex search across project files stored in DB with simple glob include/exclude filters.",
      inputSchema: searchSchema,
      execute: async (params) => searchFiles({ ...params, projectId })
    })
  };
}

export async function searchFiles({
  query,
  include_pattern,
  exclude_pattern,
  case_sensitive,
  projectId
}: SearchInput & { projectId: string }) {
  const includeRe = globToRegex(include_pattern);
  const excludeRe = exclude_pattern ? globToRegex(exclude_pattern) : undefined;
  const flags = case_sensitive ? undefined : "i";
  const pattern = flags ? new RegExp(query, flags) : new RegExp(query);

  const prefix = projectPrefix(projectId);
  const keys = await listKeys(prefix);

  const results: Array<{ path: string; fileId: string; matches: Array<{ line: number; text: string }> }> = [];
  for (const key of keys) {
    const relPath = key.replace(prefix, "");
    if (!includeRe.test(relPath)) continue;
    if (excludeRe && excludeRe.test(relPath)) continue;
    const text = await getTextObject(key);
    const lines = text.split(/\r?\n/);
    const matches = [] as Array<{ line: number; text: string }>;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (pattern.test(line)) {
        matches.push({ line: i + 1, text: line });
      }
    }
    if (matches.length) results.push({ path: relPath, fileId: key, matches });
  }
  return { count: results.length, results };
}


