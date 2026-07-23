export function BooleanInput({ item, value, onChange }) {
  const label = item.title ?? item.name;

  return (
    <div className="flex items-center gap-2 rounded-md border p-4">
      <input
        type="checkbox"
        id={`item-${item.id}`}
        checked={value?.isCompleted || false}
        onChange={(e) => onChange({ isCompleted: e.target.checked })}
        className="w-5 h-5 text-primary rounded"
      />
      <label htmlFor={`item-${item.id}`} className="flex-1 font-medium cursor-pointer">
        {label}
      </label>
    </div>
  );
}
