"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export default function SortSelect({ options }: { options: Option[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const current = params.get("sort") ?? options[0].value;

    function onChange(value: string) {
        const next = new URLSearchParams(params.toString());
        next.set("sort", value);
        router.push(`${pathname}?${next.toString()}`);
    }

    return (
        <label className="sort-select">
            Сортировка
            <select className="select" value={current} onChange={(e) => onChange(e.target.value)}>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}