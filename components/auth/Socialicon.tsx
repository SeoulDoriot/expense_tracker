import Image from "next/image";

export default function SocialIcon({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50">
      <Image src={src} alt={alt} width={18} height={18} />
    </button>
  );
}