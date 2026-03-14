import PageHeader from "./PageHeader";
import PrimaryActionBar from "./PrimaryActionBar";
import SectionCard from "./SectionCard";
import Skeleton from "./Skeleton";

function LoadingStatGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="app-surface-card rounded-2xl border app-panel-padding"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-10 w-20" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function LoadingQueueRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="app-surface-card rounded-2xl border app-panel-padding"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarAutomationSkeleton() {
  return (
    <div className="space-y-3" data-tour="sidebar-loading">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-7 w-40" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
        <Skeleton className="h-7 w-12 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="mt-2 h-5 w-16" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-24" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="mt-2 h-5 w-28" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
    </div>
  );
}

export function DashboardLoadingState() {
  return (
    <div
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="dashboard-loading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <PageHeader
          title={<Skeleton className="h-11 w-[26rem] max-w-full" />}
          meta={
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
            </div>
          }
          description={<Skeleton className="h-4 w-[24rem] max-w-full" />}
          actions={<Skeleton className="h-11 w-40 rounded-xl" />}
        />

        <div className="app-page-stack pb-6">
          <SectionCard
            title={<Skeleton className="h-7 w-40" />}
            description={<Skeleton className="h-4 w-72 max-w-full" />}
            meta={<Skeleton className="h-8 w-24 rounded-full" />}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
              <div className="space-y-4">
                <div className="app-surface-soft rounded-2xl border app-panel-padding">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                    <div>
                      <Skeleton className="h-6 w-56" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-4/5" />
                    </div>
                    <LoadingStatGrid />
                  </div>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="app-surface-card rounded-2xl border app-panel-padding"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,0.95fr)]">
                        <div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-7 w-40" />
                            </div>
                          </div>
                          <div className="mt-4 rounded-xl border app-surface-muted p-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="mt-3 h-6 w-24 rounded-full" />
                          </div>
                          <div className="mt-3 rounded-xl border app-surface-muted p-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="mt-3 h-5 w-32" />
                            <Skeleton className="mt-3 h-11 w-36 rounded-xl" />
                          </div>
                        </div>
                        <div className="rounded-xl border app-surface-muted p-4">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="mt-4 h-4 w-full" />
                          <Skeleton className="mt-2 h-4 w-4/5" />
                          <Skeleton className="mt-2 h-4 w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title={<Skeleton className="h-6 w-32" />}
                  description={<Skeleton className="h-4 w-56 max-w-full" />}
                >
                  <div className="grid gap-3">
                    <div className="app-surface-soft rounded-2xl border p-4">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-3/4" />
                    </div>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="app-surface-card rounded-2xl border p-4"
                      >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-3 h-5 w-32" />
                        <Skeleton className="mt-2 h-3 w-full" />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title={<Skeleton className="h-6 w-36" />}
                  description={<Skeleton className="h-4 w-48 max-w-full" />}
                >
                  <LoadingQueueRows />
                </SectionCard>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export function MessagesLoadingState() {
  return (
    <div
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="messages-loading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <PageHeader
          dataTour="messages-loading-header"
          title={<Skeleton className="h-10 w-44" />}
          meta={<Skeleton className="h-8 w-20 rounded-full" />}
          description={
            <div className="space-y-3">
              <Skeleton className="h-4 w-[28rem] max-w-full" />
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          }
          footer={
            <div className="space-y-3">
              <div className="rounded-2xl border app-surface-card app-panel-padding-compact">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Skeleton className="h-11 flex-1 rounded-xl" />
                  <Skeleton className="h-11 w-28 rounded-xl" />
                  <Skeleton className="h-11 w-28 rounded-xl" />
                  <Skeleton className="h-11 w-20 rounded-xl" />
                </div>
              </div>
            </div>
          }
        />

        <div className="space-y-3 pb-6">
          <PrimaryActionBar
            leading={
              <>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </>
            }
            trailing={
              <>
                <Skeleton className="h-10 flex-1 rounded-xl md:w-28 md:flex-none" />
                <Skeleton className="h-10 flex-1 rounded-xl md:w-28 md:flex-none" />
                <Skeleton className="h-10 flex-1 rounded-xl md:w-28 md:flex-none" />
              </>
            }
          />

          <div className="flex flex-col gap-2 md:gap-0 md:overflow-hidden md:rounded-3xl md:border md:border-[var(--app-border-soft)] md:bg-[var(--app-surface-card)]">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={[
                  "app-panel-padding grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center",
                  index > 0 ? "md:border-t md:border-[var(--app-border-soft)]" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationLoadingState() {
  return (
    <div
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="conversation-loading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="sticky top-16 z-30 -mx-4 border-b app-shell-header px-4 pt-3 backdrop-blur md:top-0 md:mx-0 md:px-0 md:pt-4">
          <div className="flex flex-col gap-4 pb-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-24" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Skeleton className="h-11 w-56 max-w-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-[26rem] max-w-full" />
            </div>
            <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
              <Skeleton className="h-11 w-28 rounded-xl" />
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 py-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <SectionCard
            title={<Skeleton className="h-6 w-40" />}
            description={<Skeleton className="h-4 w-64 max-w-full" />}
            bodyClassName="space-y-4"
          >
            <div className="rounded-2xl border app-surface-muted p-4">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                  >
                    <div className="max-w-[85%] rounded-2xl border bg-white p-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
                      <Skeleton className="mt-2 h-4 w-56 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border app-surface-card app-panel-padding">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard
              title={<Skeleton className="h-6 w-32" />}
              description={<Skeleton className="h-4 w-40 max-w-full" />}
            >
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </SectionCard>

            <SectionCard
              title={<Skeleton className="h-6 w-28" />}
              description={<Skeleton className="h-4 w-36 max-w-full" />}
            >
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApprovalsLoadingState() {
  return (
    <div
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="approvals-loading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <PageHeader
          title={<Skeleton className="h-10 w-56" />}
          meta={<Skeleton className="h-8 w-24 rounded-full" />}
          description={<Skeleton className="h-4 w-[30rem] max-w-full" />}
        />
        <div className="grid gap-4 pb-6 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
          <SectionCard
            title={<Skeleton className="h-6 w-32" />}
            description={<Skeleton className="h-4 w-44 max-w-full" />}
          >
            <LoadingQueueRows count={5} />
          </SectionCard>
          <SectionCard
            title={<Skeleton className="h-6 w-36" />}
            description={<Skeleton className="h-4 w-56 max-w-full" />}
            bodyClassName="space-y-4"
          >
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-14 w-full rounded-2xl" />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
