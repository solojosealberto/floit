import { CompararClient } from "./comparar-client";

export const metadata = {
  title: "Comparar centros",
};

export default async function CompararPage(props: {
  searchParams: Promise<{ c?: string }>;
}) {
  const sp = await props.searchParams;
  const initialSlugs =
    typeof sp.c === "string"
      ? sp.c.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
      : [];
  return <CompararClient initialSlugs={initialSlugs} />;
}
