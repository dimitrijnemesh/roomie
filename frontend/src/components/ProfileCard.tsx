import { DEGREE_LABEL, findFaculty } from "@/lib/academics";
import type { Profile } from "@/lib/api";
import { CLEAN_OPTIONS, GUESTS_OPTIONS, HOUSING_OPTIONS, ROOMMATE_OPTIONS, SLEEP_OPTIONS } from "@/lib/profile";

const label = <T,>(opts: readonly { value: T; label: string }[], v: T | undefined) => opts.find((o) => o.value === v)?.label;

/** A profile card the way other students see it in the feed. */
export function ProfileCard({ profile, className = "" }: { profile: Profile; className?: string }) {
  const h = profile.habits ?? {};
  const l = profile.looking ?? {};
  const chips = [
    label(SLEEP_OPTIONS, h.sleep),
    h.clean !== undefined && `Чистота: ${CLEAN_OPTIONS.find((o) => o.value === h.clean)?.hint.toLowerCase()}`,
    h.smoking !== undefined && (h.smoking ? "Курю" : "Не курю"),
    h.guests && `Гості: ${label(GUESTS_OPTIONS, h.guests)?.toLowerCase()}`,
  ].filter((c): c is string => !!c);

  return (
    <article className={`w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-float ${className}`}>
      <div className="relative aspect-[4/5] bg-mint-tint">
        {profile.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads from the API host
          <img src={profile.photos[0].url} alt={`Фото ${profile.name}`} className="size-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-5 pt-16 text-white">
          <h2 className="font-display text-2xl font-bold">
            {profile.name}
            {profile.age !== null && `, ${profile.age}`}
          </h2>
          {profile.specialty && (
            <p className="text-on-dark-2">
              {profile.specialty}
              {profile.course && ` · ${profile.course} курс`}
              {profile.degree && `, ${DEGREE_LABEL[profile.degree]}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {profile.faculty && (
          <p className="text-sm text-muted">
            {findFaculty(profile.university, profile.faculty)?.short ?? profile.faculty}
            {profile.specialization ? ` · ${profile.specialization}` : ""}
          </p>
        )}
        {profile.bio && <p className="text-body">{profile.bio}</p>}
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c} className="rounded-full bg-mint-tint px-3 py-1 text-sm text-ink">
                {c}
              </li>
            ))}
          </ul>
        )}
        {l.roommateGender && (
          <p className="text-sm text-muted">
            Шукаю: {label(ROOMMATE_OPTIONS, l.roommateGender)?.toLowerCase()} · {label(HOUSING_OPTIONS, l.housing)?.toLowerCase()}
            {l.budget && ` · ${l.budget[0]}–${l.budget[1]} грн`}
            {l.district ? ` · ${l.district}` : ""}
          </p>
        )}
      </div>
    </article>
  );
}
