import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <div className="mx-16 grid grid-cols-1 gap-1 lg:grid-cols-2 lg:items-cente max-w-6xl gap-10 py-8 px-5">
        {/* LEFT */}
        <div className="w-full max-w-xl">{children}</div>

        {/* RIGHT IMAGE */}
        <div className="hidden w-full items-center justify-end md:flex">
          <div className="relative h-[520px] w-[520px] flex items-center justify-end">
            {/* Background shape */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[660px] w-[420px] rounded-full bg-[#F7E7D8] z-0" />

            {/* Student Image */}
            <Image
              src="/student.png"
              alt="student"
              width={420}
              height={520}
              className="relative z-10 object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}