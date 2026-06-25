import { requireProfile } from "@/lib/dal";
import { getCatalogAnalytics } from "@/lib/queries";
import { isPro } from "@/lib/plans";
import { RequestUpgradeButton } from "@/components/dashboard/RequestUpgradeButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const profile = await requireProfile();

  if (!isPro(profile.plan)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Analytics
        </h1>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>See how your catalog performs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Analytics is a Pro feature. Upgrade to see catalog views and your
              most-opened items over the last 30 days.
            </p>
            <RequestUpgradeButton
              alreadyRequested={Boolean(profile.upgrade_requested_at)}
              className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              requestedClassName="text-sm font-medium text-emerald-600"
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  const { totalViews, totalOpens, viewsByDay, topItems } =
    await getCatalogAnalytics(profile.id);
  const maxDay = Math.max(1, ...viewsByDay.map((row) => row.views));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Analytics
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last 30 days</p>

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Catalog views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Item opens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalOpens}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Views by day</CardTitle>
          </CardHeader>
          <CardContent>
            {viewsByDay.length === 0 ? (
              <p className="text-sm text-gray-500">No views yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {viewsByDay.map((row) => (
                  <li key={row.day} className="flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-gray-500">
                      {row.day.slice(5)}
                    </span>
                    <span
                      className="h-3 rounded bg-blue-500"
                      style={{ width: `${(row.views / maxDay) * 100}%` }}
                    />
                    <span className="font-medium text-gray-700">
                      {row.views}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-gray-500">No item opens yet.</p>
            ) : (
              <ol className="space-y-2">
                {topItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-gray-800">
                      <span className="mr-2 text-gray-400">{index + 1}.</span>
                      {item.name}
                    </span>
                    <span className="shrink-0 font-medium text-gray-700">
                      {item.opens} open{item.opens === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
