import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                bg-surface border border-border rounded-[2px] p-6 relative
                ${hover ? 'cursor-pointer transition-colors hover:border-accent' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <h3 className={`text-xl font-semibold text-text-primary mb-2 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <p className={`text-text-secondary text-sm leading-relaxed ${className}`}>{children}</p>;
}
