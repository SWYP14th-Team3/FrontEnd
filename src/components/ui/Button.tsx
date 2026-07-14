'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

const buttonVariants = cva('flex items-center justify-center rounded-xxxl font-weight-semibold', {
  variants: {
    variant: {
      primary: 'bg-primary-40 text-gray-0 hover:bg-primary-50 cursor-pointer',
      assistive: 'bg-gray-20 text-gray-50 hover:bg-gray-30 cursor-pointer',
    },
    size: {
      lg: 'w-[424px] h-[57px] text-body-lg',
      md: 'px-6 py-3 text-body-sm',
      sm: 'px-4 py-2 text-body-xs',
    },
  },
  compoundVariants: [],
  defaultVariants: { variant: 'primary', size: 'lg' },
});

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export { Button, buttonVariants };
