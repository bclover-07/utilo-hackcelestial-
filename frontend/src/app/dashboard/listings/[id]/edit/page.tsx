import { ListingEditor } from "@/components/Inventory";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingEditor id={id} />;
}
