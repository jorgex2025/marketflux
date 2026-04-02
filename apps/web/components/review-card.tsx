interface ReviewCardProps {
  rating: number;
  title: string;
  body: string;
  author?: string;
  date?: string;
  sellerReply?: string | null;
  helpfulCount?: number;
  onHelpful?: () => void;
}

export function ReviewCard({
  rating,
  title,
  body,
  author,
  date,
  sellerReply,
  helpfulCount = 0,
  onHelpful,
}: ReviewCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-yellow-500 text-lg">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
        <span className="font-semibold">{title}</span>
        {date && (
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(date).toLocaleDateString('es-CO')}
          </span>
        )}
      </div>
      {author && <p className="text-xs text-muted-foreground">por {author}</p>}
      <p className="text-sm">{body}</p>
      {sellerReply && (
        <div className="bg-muted rounded p-3 text-sm border-l-4 border-primary">
          <span className="font-semibold text-xs uppercase tracking-wide">Respuesta del vendedor: </span>
          {sellerReply}
        </div>
      )}
      <button
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        onClick={onHelpful}
      >
        👍 Útil ({helpfulCount})
      </button>
    </div>
  );
}
