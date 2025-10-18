// {
//   "webgen-add-dependency": {
//     "description": "Use this tool to add a dependency to the project. The dependency should be a valid npm package name.",
//     "parameters": {
//       "properties": {
//         "package": {
//           "example": "lodash@latest",
//           "type": "string"
//         }
//       },
//       "required": ["package"],
//       "type": "object"
//     }
//   },
//   "webgen-search-files": {
//     "description": "Regex-based code search with file filtering and context.\n\nSearch using regex patterns across files in your project.\n\nParameters:\n- query: Regex pattern to find (e.g., \"useState\")\n- include_pattern: Files to include using glob syntax (e.g., \"src/**\")\n- exclude_pattern: Files to exclude using glob syntax (e.g., \"**/*.test.tsx\")\n- case_sensitive: Whether to match case (default: false)\n\nTip: Use \\\\ to escape special characters in regex patterns.",
//     "parameters": {
//       "properties": {
//         "case_sensitive": {
//           "example": "false",
//           "type": "boolean"
//         },
//         "exclude_pattern": {
//           "example": "src/components/ui/**",
//           "type": "string"
//         },
//         "include_pattern": {
//           "example": "src/**",
//           "type": "string"
//         },
//         "query": {
//           "example": "useEffect\\(",
//           "type": "string"
//         }
//       },
//       "required": ["query", "include_pattern"],
//       "type": "object"
//     }
//   },
//   "webgen-write": {
//     "description": "\nUse this tool to write to a file. Overwrites the existing file if there is one. The file path should be relative to the project root.\n\n  ### IMPORTANT: MINIMIZE CODE WRITING\n  - PREFER using webgen-line-replace for most changes instead of rewriting entire files\n  - This tool is mainly meant for creating new files or as fallback if webgen-line-replace fails\n  - When writing is necessary, MAXIMIZE use of \"// ... keep existing code\" to maintain unmodified sections\n  - ONLY write the specific sections that need to change - be as lazy as possible with your writes\n  \n  ### Using \"keep existing code\" (MANDATORY for large unchanged sections):\n  - Any unchanged code block over 5 lines MUST use \"// ... keep existing code\" comment\n  - The comment MUST contain the EXACT string \"... keep existing code\" \n  - Example: \"// ... keep existing code (user interface components)\"\n  - NEVER rewrite large sections of code that don't need to change\n  \n  Example with proper use of keep existing code:\n  ```\n  import React from 'react';\n  import './App.css';\n  \n  function App() {\n    // ... keep existing code (all UI components)\n    \n    // Only the new footer is being added\n    const Footer = () => (\n      New Footer Component\n    );\n    \n    return (\n      \n        // ... keep existing code (main content)\n        \n      \n    );\n  }\n  \n  export default App;\n  ```\n\n  ### Parallel Tool Usage\n  - If you need to create multiple files, it is very important that you create all of them at once instead of one by one, because it's much faster\n",
//     "parameters": {
//       "properties": {
//         "content": {
//           "example": "console.log('Hello, World!')",
//           "type": "string"
//         },
//         "file_path": {
//           "example": "src/main.ts",
//           "type": "string"
//         }
//       },
//       "required": ["file_path", "content"],
//       "type": "object"
//     }
//   },
//   "webgen-line-replace": {
//     "description": "Line-Based Search and Replace Tool\n\nUse this tool to find and replace specific content in a file you have access to, using explicit line numbers. This is the PREFERRED and PRIMARY tool for editing existing files. Always use this tool when modifying existing code rather than rewriting entire files.\n\nProvide the following details to make an edit:\n\t1.\tfile_path - The path of the file to modify\n\t2.\tsearch - The content to search for (use ellipsis ... for large sections instead of writing them out in full)\n\t3.\tfirst_replaced_line - The line number of the first line in the search (1-indexed)\n\t4.\tlast_replaced_line - The line number of the last line in the search (1-indexed)\n\t5.\treplace - The new content to replace the found content\n\nThe tool will validate that search matches the content at the specified line range and then replace it with replace.\n\nIMPORTANT: When invoking this tool multiple times in parallel (multiple edits to the same file), always use the original line numbers from the file as you initially viewed it. Do not adjust line numbers based on previous edits.\n\nELLIPSIS USAGE:\nWhen replacing sections of code longer than ~6 lines, you should use ellipsis (...) in your search to reduce the number of lines you need to specify (writing fewer lines is faster).\n- Include the first few lines (typically 2-3 lines) of the section you want to replace\n- Add \"...\" on its own line to indicate omitted content\n- Include the last few lines (typically 2-3 lines) of the section you want to replace\n- The key is to provide enough unique context at the beginning and end to ensure accurate matching\n- Focus on uniqueness rather than exact line counts - sometimes 2 lines is enough, sometimes you need 4\n\n\n\nExample:\nTo replace a user card component at lines 22-42:\n\nOriginal content in file (lines 20-45):\n20:   return (\n21:     \n22:       \n23:         \n24:         {user.name}\n25:         {user.email}\n26:         {user.role}\n27:         {user.department}\n28:         {user.location}\n29:         \n30:            onEdit(user.id)}>Edit\n31:            onDelete(user.id)}>Delete\n32:            onView(user.id)}>View\n33:         \n34:         \n35:           Created: {user.createdAt}\n36:           Updated: {user.updatedAt}\n37:           Status: {user.status}\n38:         \n39:         \n40:           Permissions: {user.permissions.join(', ')}\n41:         \n42:       \n43:     \n44:   );\n45: }\n\nFor a large replacement like this, you must use ellipsis:\n- search: \"      \\n        \\n...\\n          Permissions: {user.permissions.join(', ')}\\n        \\n      \"\n- first_replaced_line: 22\n- last_replaced_line: 42\n- replace: \"      \\n        \\n           {\\n              e.currentTarget.src = '/default-avatar.png';\\n            }}\\n          />\\n        \\n        \\n          {user.name}\\n          {user.email}\\n          \\n            {user.role}\\n            {user.department}\\n          \\n        \\n        \\n           onEdit(user.id)}\\n            aria-label=\\\"Edit user profile\\\"\\n          >\\n            Edit Profile\\n          \\n        \\n      \"\n\nCritical guidelines:\n\t1. Line Numbers - Specify exact first_replaced_line and last_replaced_line (1-indexed, first line is line 1)\n\t2. Ellipsis Usage - For large sections (>6 lines), use ellipsis (...) to include only the first few and last few key identifying lines for cleaner, more focused matching\n\t3. Content Validation - The prefix and suffix parts of search (before and after ellipsis) must contain exact content matches from the file (without line numbers). The tool validates these parts against the actual file content\n\t4. File Validation - The file must exist and be readable\n\t5. Parallel Tool Calls - When multiple edits are needed, invoke necessary tools simultaneously in parallel. Do NOT wait for one edit to complete before starting the next\n\t6. Original Line Numbers - When making multiple edits to the same file, always use original line numbers from your initial view of the file",
//     "parameters": {
//       "properties": {
//         "file_path": {
//           "example": "src/components/TaskList.tsx",
//           "type": "string"
//         },
//         "first_replaced_line": {
//           "description": "First line number to replace (1-indexed)",
//           "example": "15",
//           "type": "number"
//         },
//         "last_replaced_line": {
//           "description": "Last line number to replace (1-indexed)",
//           "example": "28",
//           "type": "number"
//         },
//         "replace": {
//           "description": "New content to replace the search content with (without line numbers)",
//           "example": "  const handleTaskComplete = useCallback((taskId: string) => {\n    const updatedTasks = tasks.map(task =>\n      task.id === taskId \n        ? { ...task, completed: !task.completed, completedAt: new Date() }\n        : task\n    );\n    setTasks(updatedTasks);\n    onTaskUpdate?.(updatedTasks);\n    \n    // Analytics tracking\n    analytics.track('task_completed', { taskId, timestamp: Date.now() });\n  }, [tasks, onTaskUpdate]);",
//           "type": "string"
//         },
//         "search": {
//           "description": "Content to search for in the file (without line numbers). This should match the existing code that will be replaced.",
//           "example": "  const handleTaskComplete = (taskId: string) => {\n    setTasks(tasks.map(task =>\n...\n    ));\n    onTaskUpdate?.(updatedTasks);\n  };",
//           "type": "string"
//         }
//       },
//       "required": ["file_path", "search", "first_replaced_line", "last_replaced_line", "replace"],
//       "type": "object"
//     }
//   },
//   "webgen-view": {
//     "description": "Use this tool to read the contents of a file. If it's a project file, the file path should be relative to the project root. You can optionally specify line ranges to read using the lines parameter (e.g., \"1-800, 1001-1500\"). By default, the first 500 lines are read if lines is not specified.\n\nIMPORTANT GUIDELINES:\n- Do NOT use this tool if the file contents have already been provided in \n- Do NOT specify line ranges unless the file is very large (>500 lines) - rely on the default behavior which shows the first 500 lines\n- Only use line ranges when you need to see specific sections of large files that weren't shown in the default view\n- If you need to read multiple files, invoke this tool multiple times in parallel (not sequentially) for efficiency",
//     "parameters": {
//       "properties": {
//         "file_path": {
//           "example": "src/App.tsx",
//           "type": "string"
//         },
//         "lines": {
//           "example": "1-800, 1001-1500",
//           "type": "string"
//         }
//       },
//       "required": ["file_path"],
//       "type": "object"
//     }
//   },
//   "webgen-read-console-logs": {
//     "description": "Use this tool to read the contents of the latest console logs at the moment the user sent the request.\nYou can optionally provide a search query to filter the logs. If empty you will get all latest logs.\nYou may not be able to see the logs that didn't happen recently.\nThe logs will not update while you are building and writing code. So do not expect to be able to verify if you fixed an issue by reading logs again. They will be the same as when you started writing code.\nDO NOT USE THIS MORE THAN ONCE since you will get the same logs each time.",
//     "parameters": {
//       "properties": {
//         "search": {
//           "example": "error",
//           "type": "string"
//         }
//       },
//       "required": ["search"],
//       "type": "object"
//     }
//   },
//   "webgen-remove-dependency": {
//     "description": "Use this tool to uninstall a package from the project.",
//     "parameters": {
//       "properties": {
//         "package": {
//           "example": "lodash",
//           "type": "string"
//         }
//       },
//       "required": ["package"],
//       "type": "object"
//     }
//   },
//   "webgen-rename": {
//     "description": "You MUST use this tool to rename a file instead of creating new files and deleting old ones. The original and new file path should be relative to the project root.",
//     "parameters": {
//       "properties": {
//         "new_file_path": {
//           "example": "src/main_new2.ts",
//           "type": "string"
//         },
//         "original_file_path": {
//           "example": "src/main.ts",
//           "type": "string"
//         }
//       },
//       "required": ["original_file_path", "new_file_path"],
//       "type": "object"
//     }
//   },
//   "webgen-delete": {
//     "description": "Use this tool to delete a file. The file path should be relative to the project root.",
//     "parameters": {
//       "properties": {
//         "file_path": {
//           "example": "src/App.tsx",
//           "type": "string"
//         }
//       },
//       "required": ["file_path"],
//       "type": "object"
//     }
//   },
//   "websearch--web_search": {
//     "description": "Performs a web search and returns relevant results with text content.\nUse this to find current information, documentation, or any web-based content.\nYou can optionally ask for links or image links to be returned as well.\nYou can also optionally specify a category of search results to return.\nValid categories are (you must use the exact string):\n- \"news\"\n- \"linkedin profile\"\n- \"pdf\"\n- \"github\"\n- \"personal site\"\n- \"financial report\"\n\nThere are no other categories. If you don't specify a category, the search will be general.\n\nWhen to use?\n- When you don't have any information about what the user is asking for.\n- When you need to find current information, documentation, or any web-based content.\n- When you need to find specific technical information, etc.\n- When you need to find information about a specific person, company, or organization.\n- When you need to find information about a specific event, product, or service.\n- When you need to find real (not AI generated) images about a specific person, company, or organization.\n\n** Search guidelines **\n\nYou can filter results to specific domains using \"site:domain.com\" in your query.\nYou can specify multiple domains: \"site:docs.anthropic.com site:github.com API documentation\" will search on both domains.\nYou can search for exact phrases by putting them in double quotes: '\"gpt5\" model name OAI' will include \"gpt5\" in the search.\nYou can exclude specific words by prefixing them with minus: jaguar speed -car will exclude \"car\" from the search.\nFor technical information, the following sources are especially useful: stackoverflow, github, official docs of the product, framework, or service.\nAccount for \"Current date\" in your responses. For example, if you instructions say \"Current date: 2025-07-01\", and the user wants the latest docs, do\nnot use 2024 in the search query. Use 2025!\n",
//     "parameters": {
//       "properties": {
//         "category": {
//           "description": "Category of search results to return",
//           "type": "string"
//         },
//         "imageLinks": {
//           "description": "Number of image links to return for each result",
//           "type": "number"
//         },
//         "links": {
//           "description": "Number of links to return for each result",
//           "type": "number"
//         },
//         "numResults": {
//           "description": "Number of search results to return (default: 5)",
//           "type": "number"
//         },
//         "query": {
//           "description": "The search query",
//           "type": "string"
//         }
//       },
//       "required": ["query"],
//       "type": "object"
//     }
//   }
