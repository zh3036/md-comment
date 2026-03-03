import { auth, signIn, signOut } from "@/auth";
import { LandingContent } from "@/components/landing-content";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold">md-comment</h1>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {session.user.login ?? session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <button
                type="submit"
                className="bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Sign in with GitHub
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {session ? (
          <LandingContent />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">
              Comment on Markdown Files
            </h2>
            <p className="text-lg text-neutral-500 mb-8 max-w-xl mx-auto">
              Add threaded comments to any markdown file in a GitHub repo.
              Comments are stored as JSON on a separate branch — perfect for
              AI-readable review workflows.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <button
                type="submit"
                className="bg-neutral-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg text-base font-medium hover:opacity-90 transition"
              >
                Sign in with GitHub to get started
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
