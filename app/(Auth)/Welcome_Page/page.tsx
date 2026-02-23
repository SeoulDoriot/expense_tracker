export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 px-10">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 md:px-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-900" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">Smart</div>
              <div className="text-sm font-semibold text-slate-600">Expense</div>
            </div>  
          </div>

          {/* Nav */}
          <nav className="hidden items-center gap-10 text-sm text-slate-600 md:flex">
            <a className="hover:text-slate-900" href="Welcome_Page/page.tsx">
              Dashboard
            </a>
            <a className="hover:text-slate-900" href="Log_in/page.tsx">
              Log in
            </a>
            <a className="hover:text-slate-900" href="Sign_in/page.tsx">
              Register
            </a>
            <a className="hover:text-slate-900" href="Support/page.tsx">
              Support
            </a>
          </nav>

          {/* Mobile menu placeholder */}
          <div className="md:hidden">
            <div className="h-9 w-9 rounded-lg border border-slate-200" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-90 -top-0 h-[740px] w-[740px] rounded-full bg-slate-900/10" />

        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-10 md:py-24">
          {/* Left text */}
          <div className="relative z-10 flex flex-col justify-center">
            <h1 className="max-w-xl text-[44px] font-semibold leading-[1.1] tracking-tight md:text-[56px]">
              <span className="font-normal text-slate-700">The smart way to</span>
              <br />
              <span className="font-extrabold text-slate-900">
                take control of your
                <br />
                money into shape
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-[15px] leading-7 text-slate-600">
              Track expenses, manage bills, and grow your savings — all in one powerful platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#"
                className="inline-flex h-19 w-50 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm hover:bg-slate-50"
              >
                <img
                  src="google-download.png"
                  alt="Google Play"
                  className="w-80"
                />
              </a>

              <a
                href="#"
                className="inline-flex h-19 w-50 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm hover:bg-slate-50"
              >
                <img src="appstore-download.png" alt="App Store" className=" w-54" />
              </a>
            </div>
          </div>

          {/* Right image */}
          <div className="relative z-10 flex items-center justify-center md:justify-end">
            <div className="w-full max-w-[640px]">
              <img
                src="device.png"
                alt="Devices preview"
                className="w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-[1440px] px-10 py-14 md:px-10 md:py-20">
        <div>
          <div className="relative">
          </div>
        </div>
        <div className="flex w-full items-center justify-center gap-4 text-center">
          <h2 className="text-5xl font-semibold ">Feature</h2>
          <p className="text-5xl text-slate-400">Our user love</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <FeatureCard
            title="Have perfect control"
            desc="Manage all your cash, bank accounts, E-wallets, and crypto in one secure place. Track every expense clearly and stay fully in control of your money."
          />
          <FeatureCard
            title="Get a quick overview"
            desc="See your income and expenses at a glance with simple dashboards and smart insights. Understand your financial situation instantly, anytime."
          />
          <FeatureCard
            title="Use our smart budgets"
            desc="Set spending limits, track progress, and save for your goals. Stay on budget while building a better financial future.                       "
          />
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-[1440px] px-6 pb-24 md:px-10">

        <StepRow
          step="Step 1"
          title="Track your cash flow"
          desc={[
            "Connect your bank account and all your transactions will get automatically imported to Smart Expense Tracker.",
            "Connect your bank card or E-wallet for complete overview of your cash flow.",
            "Add your cash expense manually.",
          ]}
          image="/cashflow-image.png"
          imageAlt="Cashflow card"
          reverse={false}
        />

        {/* Space */}
        <div className="h-20" />  

          {/* Step2 */}
        <StepRow
          step="Step 2"
          title="Understand your financial habits"
          desc={[
            "Analyze your finance with beautiful, simple charts to understand patterns — no complicated excel sheets needed.",
            "See where your money goes and where they come from every month.",
            "See whether you spend less than you earn in one place on tab 1.",
          ]}
          image="Graph.png"
          imageAlt="Habits chart"
          reverse={false}
        />

        <div className="h-14" />

          {/* Step3 */}
        <StepRow
          step="Step 3"
          title="Understand your financial habits"
          desc={[
            "Analyze your finance with beautiful, simple lists and budget cards.",
            "Know your top categories and keep your spending under control.",
          ]}
          image="spendgoal.png"
          imageAlt="Budget list"
          reverse={true}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-10 text-sm text-slate-500 md:px-10">
          <p>© {new Date().getFullYear()} Smart Expense</p>
          <p>Designed for your MacBook 16” frame</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="relative">
      
      {/* Small square layer (background shape) */}
      <div className="absolute -top-3 -left- h-16 w-16 rounded-xl bg-slate-100 z-0"></div>
      {/* Main Card */}
      <div className="relative z-10 rounded-2xl border border-slate-200 w-90 h-50 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <h3 className="text-[16px] font-semibold">{title}</h3>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">{desc}</p>
      </div>
    </div>
  );
}   

function StepRow({
  step,
  title,
  desc,
  image,
  imageAlt,
  reverse,
}: {
  step: string;
  title: string;
  desc: string[];
  image: string;
  imageAlt: string;
  reverse: boolean;
}) {
  const stepNumber = step.replace("Step ", "");

  return (
    <div
      className={`grid grid-cols-1 items-center gap-16 md:grid-cols-2 ${
        reverse ? "md:[&>div:first-child]:order-2" : ""
      }`}
    >
      {/* Text block with overlay number on the left */}
      <div className="relative">
        {/* Big faded number */}
        <div className="pointer-events-none absolute -left-24 left-[-50] top-[-250] hidden select-none md:block">
          <span className="text-[420px] font-extrabold  text-slate-300 opacity-20">
            {stepNumber}
          </span>
        </div>

        {/* Content shifted right so it doesn't sit on the number */}
        <div className="md:pl-28">
          <div className="text-xs font-semibold text-blue-600">{step}</div>
          <h3 className="mt-2 text-[44px] font-extrabold leading-tight tracking-tight">
            {title}
          </h3>

          <div className="mt-6 space-y-4 text-[16px] leading-8 text-slate-600">
            {desc.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative z-10 flex items-center justify-center md:justify-end">
            <div className="w-full max-w-[640px]">
              <img
                src={image}
                alt={imageAlt}
                className="w-full object-contain drop-shadow-[0_40px_60px_rgba(15,23,42,0.25)]"
              />
            </div>
          </div>
    </div>
  );
}