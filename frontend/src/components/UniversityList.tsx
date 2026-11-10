import { UNIVERSITIES } from "@/lib/universities";

export function UniversityList({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-1.5 ${className}`}>
      {UNIVERSITIES.map((u) => (
        <li key={u.domain} className="flex flex-wrap justify-between gap-x-3">
          <span>{u.name}</span>
          <span className="font-medium text-mint-dark">@{u.domain}</span>
        </li>
      ))}
    </ul>
  );
}
