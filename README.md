# md-comment

**Google Docs-style commenting for GitHub markdown files — built for humans and AI agents to collaborate on the same document.**

[Try it live →](https://md-comment.fly.dev)

---

## The Problem

You're reading a long spec your teammate wrote. At paragraph 3, you think "this contradicts the API design." At paragraph 7, you have a question. At paragraph 12, a suggestion.

You don't want to switch to Slack, lose your place, and type "regarding paragraph 3..." — you want to say it *right there*, anchored to the exact text that triggered the thought. Then your teammate replies inline, you refine your point, and eventually an AI agent reads the entire threaded discussion and implements the agreed-upon changes.

That workflow doesn't exist for markdown files in GitHub. Until now.

## What md-comment Does

Paste any GitHub markdown URL. Select text. Comment. That's it.

Your comments are stored as structured JSON on a dedicated `md-comments` branch in your repo — no external database, no vendor lock-in. Every comment is version-controlled, diffable, and readable by any tool that can read a file.

### For Humans

- **Select any text → comment** — highlight a passage in the rendered markdown, leave a threaded comment anchored to that exact spot
- **Threaded replies** — discuss inline, right next to the text you're talking about
- **Resolve & reopen** — mark threads resolved when addressed; reopen if needed
- **Works with private repos** — authenticate with GitHub OAuth, access anything you can access on GitHub
- **File tree sidebar** — browse all files in the repo without leaving the app; click any markdown file to navigate to it

### For AI Agents

This is where it gets interesting.

Every comment stores the `commitSha` of the file version it was made against. An AI agent can:

```bash
# Read all comments on a file
cat md-comments:comments/path/to/file.md.json

# See exactly what the commenter was looking at
git show abc123:path/to/file.md

# Diff what changed since the comment was made
git diff abc123..HEAD -- path/to/file.md
```

The agent doesn't need a human to summarize "what the feedback was." It reads the JSON, sees the anchored text, sees the threaded discussion, and implements what was agreed upon. Comments become *instructions* that survive across sessions, across agents, across time.

### CLI for Automation

```bash
# List all comments on a file
npx tsx cli/comment.ts list owner/repo path/to/file.md

# Add a comment programmatically
npx tsx cli/comment.ts add owner/repo path/to/file.md \
  --text "exact text to anchor to" \
  --body "This section needs clarification"

# Reply to a comment
npx tsx cli/comment.ts reply owner/repo path/to/file.md \
  --id comment-uuid --body "Agreed, I'll rewrite this"

# Resolve a thread
npx tsx cli/comment.ts resolve owner/repo path/to/file.md --id comment-uuid
```

## The Pitch, Honestly

During development, we put on a product manager hat and stress-tested the value proposition. The honest assessment:

**Why this matters:** Reading and reacting are simultaneous. When you read a document and have an idea — a question, a suggestion, a disagreement — you want to express it *at the point you're reading*, not in a separate chat window. Google Docs figured this out years ago. But if your documents live in GitHub as markdown, you've been stuck with either (a) no inline comments at all, or (b) copying text into PR reviews or issues with manual line references.

**The real unlock** is what happens *after* the discussion. Humans debate in-context. Then an AI agent reads the structured discussion and executes the decisions. The JSON format isn't just clean engineering — it's a protocol between human intent and AI action.

**The honest challenge:** If your docs are in Google Docs, stay there. md-comment is for teams that keep specs, RFCs, ADRs, and documentation in markdown, in git. Developer teams, open-source projects, AI-native companies. If that's you, this tool closes a real gap.

## How It Works Under the Hood

1. You authenticate with GitHub OAuth
2. The app fetches and renders any markdown file via the GitHub API
3. Text selection is captured and mapped back to raw markdown offsets (handling the mismatch between rendered HTML and raw markdown with `*bold*`, `\n`, etc.)
4. Comments are stored as JSON on an orphan `md-comments` branch — the branch has no shared history with your code, so it never conflicts with your work
5. Highlights are rendered as CSS overlays positioned via `Range.getClientRects()` — the markdown DOM is never mutated

## Try It

1. Go to [md-comment.fly.dev](https://md-comment.fly.dev)
2. Sign in with GitHub
3. Paste a link to any markdown file in a repo you have access to
4. Select some text and leave a comment

The comments will appear as a JSON file on the `md-comments` branch of that repo. Your collaborators (human or AI) can see them immediately.

## Tech Stack

Next.js 15 · React 19 · TypeScript · Auth.js v5 · Octokit · react-markdown · SWR · Tailwind CSS · shadcn/ui · Deployed on Fly.io

## Development

```bash
pnpm install
pnpm dev
```

Requires a `.env.local` with GitHub OAuth credentials and an `AUTH_SECRET`. See Auth.js v5 docs for setup.
