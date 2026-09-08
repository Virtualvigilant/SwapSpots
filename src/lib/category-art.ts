/**
 * Category artwork.
 *
 * These are design assets, not data — they ship with the app rather than
 * living in a column, because an admin adding a category should not have to
 * source a photograph before the category works. Anything without art here
 * falls back to its lucide icon, which is what `categories.icon` is for.
 */
const ART: Record<string, string> = {
  "food-snacks": "/images/c-food.jpg",
  "hostel-room": "/images/c-hostel.jpg",
  "fashion-thrift": "/images/c-fashion.jpg",
  "electronics-phones": "/images/c-electronics.jpg",
  "books-stationery": "/images/c-books.jpg",
  services: "/images/c-services.jpg",
  rentals: "/images/c-rentals.jpg",
  others: "/images/c-others.jpg",
};

export function categoryArt(slug: string): string | null {
  return ART[slug] ?? null;
}
