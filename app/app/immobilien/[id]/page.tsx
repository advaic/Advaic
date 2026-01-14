import PropertyDetailClient from "@/components/PropertyDetailClient";

type PageProps = {
  // Next.js can provide params as a Promise (sync dynamic APIs)
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PropertyDetailClient propertyId={id} />;
}