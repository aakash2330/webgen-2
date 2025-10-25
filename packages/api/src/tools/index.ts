import { getAllFilesTool } from "./findFile";
import { getFileContentTool } from "./getFileContent";
import { getUpdateFileTool } from "./updateFile";
import { getAddDependencyTool } from "./addDependency";
import { getSearchFilesTool } from "./searchFiles";
import { getWriteFileTool } from "./writeFile";
import { getLineReplaceTool } from "./lineReplace";
import { getViewFileTool } from "./viewFile";
import { getReadConsoleLogsTool } from "./readConsoleLogs";
import { getRemoveDependencyTool } from "./removeDependency";
import { getRenameFileTool } from "./renameFile";
import { getDeleteFileTool } from "./deleteFile";
import { getWebSearchTool } from "./webSearch";

export function getTools(projectId: string) {
  const tools = {
    ...getAllFilesTool(projectId),
    ...getFileContentTool(),
    ...getUpdateFileTool(projectId),
    ...getAddDependencyTool(projectId),
    ...getSearchFilesTool(projectId),
    ...getWriteFileTool(projectId),
    ...getLineReplaceTool(projectId),
    ...getViewFileTool(projectId),
    ...getReadConsoleLogsTool(projectId),
    ...getRemoveDependencyTool(projectId),
    ...getRenameFileTool(projectId),
    ...getDeleteFileTool(projectId),
    ...getWebSearchTool(),
  } as Record<string, any>;

  for (const [toolName, toolDef] of Object.entries(tools)) {
    if (toolDef && typeof toolDef.execute === "function") {
      const originalExecute = toolDef.execute;
      toolDef.execute = async (...args: unknown[]) => {
        console.log(
          `************** ${toolName} has been called *******************`,
        );
        return await originalExecute(...args);
      };
    }
  }

  return tools;
}
