export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-emerald-600 font-medium text-[15px] mb-4 tracking-tight">Before the Call</p>
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">
          What We&apos;ll Show You On The Call
        </h1>
        <p className="text-[18px] text-gray-600 tracking-tight leading-relaxed mb-10">
          Most service businesses are losing jobs from missed calls, slow follow-up, and weak
          intake without realizing how much revenue is slipping away.
        </p>

        <section className="mb-10">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-gray-900 tracking-tight leading-[1.2] mb-4">
            On the call, we&apos;ll break down:
          </h2>
          <ul className="space-y-3 text-[17px] text-gray-700 tracking-tight leading-relaxed">
            <li>- Where you&apos;re currently losing calls and leads</li>
            <li>- How much revenue that may actually be costing you</li>
            <li>- What a fixed system looks like for your business</li>
            <li>- Whether this makes sense to implement right now</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-gray-900 tracking-tight leading-[1.2] mb-4">
            What to expect
          </h2>
          <div className="space-y-4 text-[17px] text-gray-700 tracking-tight leading-relaxed">
            <p>This is not a high-pressure sales call.</p>
            <p>
              If we can help, I&apos;ll show you exactly how.
              <br />
              If we can&apos;t, you&apos;ll still leave with a clearer picture of what&apos;s broken.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-gray-900 tracking-tight leading-[1.2] mb-4">
            Before we talk
          </h2>
          <ul className="space-y-3 text-[17px] text-gray-700 tracking-tight leading-relaxed">
            <li>- Be near your phone at the scheduled time</li>
            <li>- Have a rough idea of your average job value</li>
            <li>
              - Be ready to describe what currently happens when a call gets missed
            </li>
          </ul>
        </section>

        <p className="text-[17px] text-gray-900 font-medium tracking-tight leading-relaxed">
          I&apos;ll call you directly at the scheduled time.
        </p>
      </div>
    </main>
  );
}
