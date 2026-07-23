import { BooleanInput } from './inputs/BooleanInput';
import { CounterInput } from './inputs/CounterInput';
import { DurationInput } from './inputs/DurationInput';

export function TrackingRenderer({ item, value, onChange }) {
  const type = item.inputType?.toLowerCase() || 'boolean';

  switch (type) {
    case 'count':
      return <CounterInput item={item} value={value} onChange={onChange} />;
    case 'duration':
    case 'timer':
      return <DurationInput item={item} value={value} onChange={onChange} />;
    case 'boolean':
    default:
      return <BooleanInput item={item} value={value} onChange={onChange} />;
  }
}
