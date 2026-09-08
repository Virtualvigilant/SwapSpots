import { Rating } from "./rating";

/**
 * Buyer and seller scores side by side, never blended. A single averaged star
 * rating destroys the signal that someone is a reliable buyer and a bad seller
 * (§3.1 / §5.4).
 */
export function Reputation({
  sellerRating,
  sellerRatingCount,
  buyerRating,
  buyerRatingCount,
}: {
  sellerRating: number;
  sellerRatingCount: number;
  buyerRating: number;
  buyerRatingCount: number;
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
      <Score label="As a seller" value={sellerRating} count={sellerRatingCount} />
      <Score label="As a buyer" value={buyerRating} count={buyerRatingCount} />
    </div>
  );
}

function Score({ label, value, count }: { label: string; value: number; count: number }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-[11.5px] font-medium text-ink-500">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-[24px] font-extrabold tracking-[-0.03em] text-ink">
          {count > 0 ? value.toFixed(1) : "—"}
        </span>
        <span className="text-[11.5px] text-ink-400">
          {count > 0 ? `from ${count} reviews` : "no reviews yet"}
        </span>
      </div>
      {count > 0 && (
        <div className="mt-2">
          <Rating value={value} count={count} />
        </div>
      )}
    </div>
  );
}
