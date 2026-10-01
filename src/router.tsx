import { createRouter, Link } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
        File missing
      </p>
      <h1 className="font-display text-4xl italic">No such artist file</h1>
      <p className="max-w-md text-sm text-muted">
        That page is not in the catalogue. Search a name to open a monograph.
      </p>
      <Link to="/" className="mt-2 text-sm text-fg underline-offset-4 hover:underline">
        Return to Monograph
      </Link>
    </main>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
    defaultPreload: false,
    scrollRestoration: true,
  });
}
