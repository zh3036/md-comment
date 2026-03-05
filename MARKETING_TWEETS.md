# Marketing Tweets for md-comment

Based on: `README.md` in `zh3036/md-comment`

---

## Version 1 — Product story + pain point

We built **md-comment** because markdown collaboration in GitHub is still awkward.

You read a spec, spot a contradiction in paragraph 3, question in paragraph 7, suggestion in paragraph 12… and then what?

You jump to Slack, lose context, paraphrase, and create confusion.

md-comment gives GitHub markdown files a **Google Docs-style comment layer**:
- select exact text
- leave inline threaded comments
- resolve/reopen discussions
- keep everything anchored to the source document

But the real unlock is for AI-native teams:

Comments are stored as structured JSON in a dedicated `md-comments` branch.
Each comment includes `commitSha`.

So agents can read feedback, inspect the exact file version, diff changes, and implement decisions without needing a human to re-explain context.

That turns comments from “chat artifacts” into a durable protocol between **human intent** and **AI execution**.

If your specs/RFCs/ADRs live in markdown + git, this fills a real gap.

Try it: https://md-comment.fly.dev

---

## Version 2 — Contrarian angle for AI builders

Hot take:

Most AI coding workflows still break at one place: **document feedback**.

Code has PR comments.
Docs in GitHub markdown mostly don’t have a great inline workflow.

So we built **md-comment**:

A lightweight layer that brings Google Docs-style inline comments to any GitHub markdown file.

What matters:
- comments are anchored to selected text
- discussions are threaded and resolvable
- private repos are supported via GitHub OAuth
- comments are stored in-repo (JSON on `md-comments` branch)

No external DB. No black box.

And for agents, this is huge:
- read comment JSON
- read file at exact `commitSha`
- diff what changed since feedback
- execute agreed edits

Meaning: your team can discuss like humans and implement like a system.

If your team keeps docs in markdown, this is worth trying:
https://md-comment.fly.dev

---

## Version 3 — GTM style (who it’s for + honest positioning)

I’m not trying to replace Google Docs.

If your team already lives in Google Docs, stay there.

But if your specs, RFCs, and product docs live in GitHub markdown, you know this pain:
- feedback is scattered across chats/issues/PRs
- context gets lost
- AI agents miss nuance because decisions aren’t in one machine-readable thread

That’s exactly why we built **md-comment**.

It lets you comment directly on selected markdown text, keep threaded in-context discussion, and store everything as structured JSON in a dedicated git branch.

So feedback is:
- versioned
- diffable
- scriptable
- readable by both humans and agents

This is the core idea:

**Human reads → human comments in context → team converges → AI agent executes from structured threads.**

If you’re building in an AI-native software org, this is the workflow upgrade.

Live demo: https://md-comment.fly.dev
Repo: https://github.com/zh3036/md-comment
