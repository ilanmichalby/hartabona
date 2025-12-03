import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarDisplayProps {
    seed: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    seed,
    size = 'md',
    className
}) => {
    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <div className={cn(
            'relative overflow-hidden rounded-full border-4 border-white/20 bg-white/10 shadow-xl',
            sizeClasses[size],
            className
        )}>
            <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
            />
        </div>
    );
};
