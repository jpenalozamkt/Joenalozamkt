"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBrand } from "@/app/(hub)/actions";

type Opt = { group: string; items: { slug: string; name: string }[] };

export function BrandPicker({ groups, selected, allLabel }: { groups: Opt[]; selected: string; allLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="picker">
      <label className="eyebrow" htmlFor="brand-sel">Marca</label>
      <select
        id="brand-sel"
        className="input"
        value={selected}
        disabled={pending}
        onChange={(e) => start(async () => { await setBrand(e.target.value); router.refresh(); })}
      >
        <option value="todas">{allLabel}</option>
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
