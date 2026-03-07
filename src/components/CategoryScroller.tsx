'use client';

import type { ComponentType } from 'react';
import { CATEGORIES } from '@/lib/constants';
import * as LucideIcons from 'lucide-react';

interface CategoryScrollerProps {
    onCategoryToggle: (categoryIds: string[]) => void;
    activeCategories: string[];
}

type CategoryIcon = ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
}>;

const categoryIcons = LucideIcons as unknown as Record<string, CategoryIcon>;

export function CategoryScroller({ onCategoryToggle, activeCategories }: CategoryScrollerProps) {
    const toggleCategory = (id: string) => {
        if (activeCategories.includes(id)) {
            onCategoryToggle(activeCategories.filter(cat => cat !== id));
        } else {
            onCategoryToggle([...activeCategories, id]);
        }
    };

    return (
        <div className="flex w-full flex-wrap gap-3">
            {CATEGORIES.map(category => {
                const isActive = activeCategories.includes(category.id);
                const IconComponent = categoryIcons[category.iconName];

                return (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-pressed={isActive}
                        className={`
                            inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm
                            transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2
                            ${isActive ? category.activeClass : category.inactiveClass}
                        `}
                    >
                        {IconComponent && (
                            <IconComponent
                                size={15}
                                strokeWidth={2}
                                className={isActive ? category.iconActiveClass : category.iconInactiveClass}
                            />
                        )}
                        {category.label}
                    </button>
                );
            })}
        </div>
    );
}
