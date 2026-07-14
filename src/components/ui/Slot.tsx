import { cloneElement, isValidElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SlotProps = React.ComponentProps<'button'> & {
  children: ReactNode;
};

function Slot({ children, className, ...props }: SlotProps) {
  if (isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children, {
      ...props,
      ...childProps,
      className: cn(className, childProps.className as string),
    } as Record<string, unknown>);
  }
  return null;
}

export { Slot };
