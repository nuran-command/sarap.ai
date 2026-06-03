import { FilterBar } from "@/components/FilterBar";
import { ReviewCard } from "@/components/ReviewCard";
import { CsvUploadButton } from "@/components/CsvUploadButton";
import { listOrganizations, listBranches, listReviews } from "@/lib/api";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;

  const organizations = await listOrganizations().catch(() => null);
  
  if (!organizations || organizations.length === 0) {
    // Cannot load dashboard data without an org
    return (
      <div className="flex-1 p-8 text-center text-stone-500">
        <p>No organization found. Please contact support.</p>
      </div>
    );
  }

  const organization = organizations[0];
  
  // Fetch branches and reviews in parallel
  const [branches, reviews] = await Promise.all([
    listBranches(organization.id).catch(() => []),
    listReviews(organization.id, resolvedParams).catch(() => []),
  ]);

  return (
    <div className="flex-1 overflow-auto bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <a href="/" className="text-sm font-medium text-mint hover:underline inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
              </a>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">Review Feed</h1>
            <p className="text-sm text-stone-500">Manage and respond to customer feedback</p>
          </div>
          <div className="flex items-center gap-3">
            <CsvUploadButton organizationId={organization.id} />
          </div>
        </header>

        <section>
          <FilterBar branches={branches} />
        </section>

        <section className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-xl bg-white">
              <svg className="mx-auto h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-ink">No reviews found</h3>
              <p className="mt-1 text-sm text-stone-500">
                Adjust your filters or upload a CSV to get started.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
