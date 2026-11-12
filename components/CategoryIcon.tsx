import {
    CakeSlice,
    CupSoda,
    Drumstick,
    Droplet,
    Pizza,
    Utensils,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
    "Пиццы": Pizza,
    "Напитки": CupSoda,
    "Закуски": Drumstick,
    "Десерты": CakeSlice,
    "Соусы": Droplet,
};

export default function CategoryIcon({
                                         name,
                                         size = 20,
                                     }: {
    name: string;
    size?: number;
}) {
    const Icon = icons[name] ?? Utensils;

    return (
        <Icon
            size={size}
            strokeWidth={2.2}
            aria-hidden="true"
        />
    );
}