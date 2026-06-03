import type { Review } from "@/types/api";

type ReviewCardProps = {
  review: Review;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-tomato text-white";
      case "high":
        return "bg-gold text-white";
      case "medium":
        return "bg-stone-200 text-ink";
      default:
        return "bg-mint/10 text-mint";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "negative":
        return "text-tomato border-tomato/30 bg-tomato/10";
      case "positive":
        return "text-mint border-mint/30 bg-mint/10";
      case "neutral":
      default:
        return "text-stone-600 border-stone-300 bg-field";
    }
  };

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-5 h-5 ${i < review.rating ? "text-gold" : "text-stone-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-stone-700">{review.reviewer_name || "Anonymous"}</span>
          <span className="text-xs text-stone-400">{review.review_date}</span>
        </div>
        <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide">
          {review.is_answered ? (
            <span className="rounded-md border border-mint/30 bg-mint/5 px-2 py-1 text-mint">Answered</span>
          ) : (
            <span className="rounded-md border border-tomato/30 bg-tomato/5 px-2 py-1 text-tomato">Unanswered</span>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-ink">{review.text}</p>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className={`px-2 py-1 text-xs font-medium border rounded-md ${getSentimentColor(review.sentiment)}`}>
          {review.sentiment}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-md ${getUrgencyColor(review.urgency)}`}>
          {review.urgency}
        </span>
        <span className="px-2 py-1 text-xs font-medium border border-stone-200 rounded-md bg-stone-50 text-stone-600">
          {review.category}
        </span>
        <span className="px-2 py-1 text-xs font-medium border border-stone-200 rounded-md bg-stone-50 text-stone-600">
          Source: {review.source}
        </span>
      </div>
    </article>
  );
}
