interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: number) => void;
}

const sizeClass = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

export function StarRating({ value, max = 5, size = 'md', onChange }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`${sizeClass[size]} ${
            i < value ? 'text-yellow-500' : 'text-gray-300'
          } ${onChange ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(i + 1)}
          role={onChange ? 'button' : undefined}
          aria-label={`${i + 1} estrellas`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
