export default function Input({
  rightIcon,
  ...props
}: any) {
  return (
    <div className="relative">
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-zinc-300 px-4 text-sm text-black outline-none"
      />

      {rightIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {rightIcon}
        </div>
      )}
    </div>
  );
}