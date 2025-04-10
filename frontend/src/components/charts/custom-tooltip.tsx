// Custom tooltip component with better styling
export const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded shadow-sm">
        <p className="font-bold">{label}</p>
        {payload.map((entry: any, index: number) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name, entry.payload)
            : `${entry.value?.toFixed(2) || 0}`;

          return (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};
