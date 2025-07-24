import { ThreadView } from "@/components/thread-view";

export default function ThreadPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <ThreadView threadId={params.id} />
    </div>
  );
}
