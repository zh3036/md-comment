# Extra Tweet Sets for md-comment

Requested add-ons:
1) Short 280-char versions
2) Founder-story thread
3) Technical audience version

---

## A) Short 280-char versions (3 options)

### Short v1
Built **md-comment** for teams writing specs in GitHub markdown.  
Select text → comment inline → discuss in thread → resolve.  
Comments are stored as JSON on an `md-comments` branch, so humans + AI agents can both read and execute decisions.  
https://md-comment.fly.dev

### Short v2
If your docs live in markdown + git, feedback should too.  
**md-comment** adds Google Docs-style inline comments to GitHub markdown files, with commit-aware JSON storage for AI workflows.  
No external DB. No lock-in.  
https://md-comment.fly.dev

### Short v3
Most AI coding workflows break at doc feedback.  
**md-comment** fixes that: inline comments on markdown, threaded discussion, and structured JSON agents can consume with commit context.  
From human intent to executable changes.  
Demo: https://md-comment.fly.dev

---

## B) Founder-story thread (X thread draft)

### 1/
I kept seeing the same friction in AI-native teams:

Specs live in GitHub markdown.
Feedback lives in Slack.
Decisions get lost.
Agents get partial context.

So we built **md-comment**.

### 2/
The core use case is simple:

Read a markdown spec.
Highlight exact text.
Comment *in place*.
Thread replies.
Resolve when done.

Google Docs-style collaboration, but for GitHub markdown.

### 3/
What changed everything for us:

We store comments as structured JSON on a dedicated `md-comments` branch.

That means every discussion is:
- versioned
- diffable
- scriptable

### 4/
Each comment also stores the `commitSha` of the file version it was made against.

So an AI agent can:
- read the feedback thread
- inspect the exact historical file
- diff against HEAD
- implement the agreed change

### 5/
This turns comments into more than communication.

They become a protocol between **human intent** and **AI execution**.

Not “please summarize what happened.”
Actual machine-readable context.

### 6/
We designed it to stay inside the git workflow:
- no external DB requirement
- no vendor lock-in
- works with private repos via GitHub OAuth

### 7/
Who this is for:
- teams writing RFCs/specs/ADRs in markdown
- open-source maintainers
- AI-native product/engineering orgs

Who it’s not for:
- teams fully standardized on Google Docs

### 8/
If this sounds like your workflow, try it and tell me where it breaks.

Live: https://md-comment.fly.dev
Repo: https://github.com/zh3036/md-comment

---

## C) Technical audience version (3 options)

### Technical v1
md-comment adds inline, threaded comments to GitHub markdown files and persists them as JSON in a dedicated `md-comments` branch.

Design choices:
- comment anchoring to selected text
- commit-aware context (`commitSha`)
- git-native storage (versioned/diffable)
- private repo support via GitHub OAuth

Goal: make doc feedback executable by both humans and agents.

### Technical v2
For teams running AI coding workflows:

Code review is structured (PRs).
Doc review often isn’t.

md-comment introduces a machine-readable comment layer for markdown docs:
- anchored inline comments
- threaded discussion + resolution state
- JSON persistence in-repo
- commit-aware historical replay

This closes the gap between discussion and implementation.

### Technical v3
md-comment is a collaboration primitive for markdown-first teams.

Instead of scattering feedback across chat, issues, and ad hoc notes, it keeps discussion attached to exact text and stores it in git as structured data.

Result:
- deterministic context for agent execution
- auditable decision trails
- no dependency on proprietary comment backends

If your specs are in git, your feedback should be too.
