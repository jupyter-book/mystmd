import { ExclamationIcon } from '@heroicons/react/outline';

interface Props {
  value: string;
  message?: string;
}

export function InlineError({ value, message }: Props) {
  return (
    <span className="text-yellow-600" title={message || value}>
      <ExclamationIcon className="inline h-[1em] mr-1" />
      {value}
    </span>
  );
}
