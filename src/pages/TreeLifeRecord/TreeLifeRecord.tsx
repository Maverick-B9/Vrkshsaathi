import { useParams, Link } from "react-router-dom";
import { useTreeHistory } from "./useTreeHistory";
import { TimelineNode } from "./TimelineNode";
import { Spinner, EmptyState, Button } from "../../components/ui";

export default function TreeLifeRecord() {
  const { treeId } = useParams<{ treeId: string }>();
  const { events, treeInfo, loading, error } = useTreeHistory(treeId || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-field-parchment flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !treeInfo) {
    return (
      <div className="min-h-screen bg-field-parchment flex flex-col items-center justify-center p-6">
        <EmptyState 
          icon="📵" 
          title="Tree Not Found" 
          description="We couldn't load the history for this tree. It may not exist."
        />
        <Link to="/">
          <Button variant="secondary" className="mt-4">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-field-parchment">
      {/* Header */}
      <header className="bg-white border-b border-field-parchment-dark sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-ink-bark">{treeInfo.species || "Unknown Species"}</h1>
            <p className="font-sans text-sm text-slate-bark mt-1 tracking-wide">
              ID: {treeId} • {treeInfo.ward}
            </p>
          </div>
          <Link to={`/tree/${treeId}`}>
            <Button variant="secondary" size="sm">View Tree</Button>
          </Link>
        </div>
      </header>

      {/* Timeline */}
      <main className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-display text-xl text-ink-bark mb-8">Life Record</h2>
        
        {events.length === 0 ? (
          <EmptyState 
            icon="🌱" 
            title="No History Yet" 
            description="This tree has just been planted and has no recorded events yet." 
          />
        ) : (
          <div className="flex flex-col">
            {events.map((event, index) => (
              <TimelineNode 
                key={event.id} 
                event={event} 
                isLast={index === events.length - 1} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
