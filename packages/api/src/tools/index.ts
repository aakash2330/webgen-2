import { getAllFilesTool } from "./findFile";
import { getFileContentTool } from "./getFileContent";
import { getUpdateFileTool } from "./updateFile";

export function getTools(projectId: string) {
  const tools = {
    ...getAllFilesTool(projectId),
    ...getFileContentTool(),
    ...getUpdateFileTool(projectId),
  } as Record<string, any>;

  // Wrap each tool's execute to log the tool name when invoked
  for (const [toolName, toolDef] of Object.entries(tools)) {
    if (toolDef && typeof toolDef.execute === "function") {
      const originalExecute = toolDef.execute;
      toolDef.execute = async (...args: unknown[]) => {
        // Minimal log to avoid leaking large inputs
        console.log(`${toolName} has been called`);
        return await originalExecute(...args);
      };
    }
  }

  return tools;
}
