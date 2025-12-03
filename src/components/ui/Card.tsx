import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-xl p-6 shadow-xl',
                className
            )}
            {...props}
        />
    )
);
Card.displayName = 'Card';
