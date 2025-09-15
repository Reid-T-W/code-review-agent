import { tool } from "ai";
import { simpleGit } from "simple-git";
import { z } from "zod";

const excludeFiles = ["dist", "bun.lock"];

const fileChange = z.object({
  rootDir: z.string().min(1).describe("The root directory"),
});

const commitMessageInput = z.object({
  diffs: z.array(
    z.object({
      file: z.string(),
      diff: z.string(),
    })
  ),
});

const markdownWriterInput = z.object({
  content: z.string().describe("The content to convert into markdown"),
});


type FileChange = z.infer<typeof fileChange>;

async function getFileChangesInDirectory({ rootDir }: FileChange) {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  const diffs: { file: string; diff: string }[] = [];

  for (const file of summary.files) {
    if (excludeFiles.includes(file.file)) continue;
    const diff = await git.diff(["--", file.file]);
    diffs.push({ file: file.file, diff });
  }

  return diffs;
}

async function commitMessageGenerator({ diffs }: z.infer<typeof commitMessageInput>) {
  if (!diffs.length) {
    return "chore: no changes detected";
  }

  // A simple heuristic commit message
  const changedFiles = diffs.map(d => d.file).join(", ");
  return `feat: updated ${changedFiles}`;
}

async function markDownWriter({ content }: z.infer<typeof markdownWriterInput>) {
  // For now, just wrap text in markdown (extend with formatting rules later)
  return `# Auto-Generated Documentation\n\n${content}`;
}
    
export const getFileChangesInDirectoryTool = tool({
  description: "Gets the code changes made in given directory",
  inputSchema: fileChange,
  execute: getFileChangesInDirectory,
});

export const getCommitMessageGeneratorTool = tool({
    description: "Generates a commit message based on code diffs",
    inputSchema: commitMessageInput,
    execute: commitMessageGenerator,
});

export const getMarkDownWriterTool = tool({
    description: "Converts given text content into markdown format",
    inputSchema: markdownWriterInput,
    execute: markDownWriter,
});