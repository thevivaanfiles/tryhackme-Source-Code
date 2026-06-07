// Shows a user's uploaded avatar, or gradient initials as a fallback.
// `avatar` is the stored filename; it's used as a cache-busting version token so
// the image refreshes when the user uploads a new one.
export function Avatar({
  userId,
  name,
  avatar,
  size = 56,
  className = "",
}: {
  userId: string;
  name: string;
  avatar: string | null;
  size?: number;
  className?: string;
}) {
  const dimension = `${size}px`;
  const initials = name.slice(0, 2).toUpperCase();

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatars/${userId}?v=${encodeURIComponent(avatar)}`}
        alt={name}
        width={size}
        height={size}
        style={{ width: dimension, height: dimension }}
        className={`shrink-0 rounded-2xl border border-white/10 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: dimension, height: dimension, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 font-bold text-slate-950 ${className}`}
    >
      {initials}
    </div>
  );
}
