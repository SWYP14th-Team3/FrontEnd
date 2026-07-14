import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-heading-xl',
        'text-heading-lg',
        'text-heading-md',
        'text-heading-sm',
        'text-heading-xs',
        'text-heading-xxs',
        'text-body-lg',
        'text-body-md',
        'text-body-sm',
        'text-body-xs',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
