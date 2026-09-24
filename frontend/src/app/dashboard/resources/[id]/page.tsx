import { ResourceDetail } from "@/components/Discovery";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceDetail id={id} />;
}
