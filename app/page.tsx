import Image from "next/image";

const BRAND_IMAGES = {
  hero: "https://github.com/user-attachments/assets/95e5303d-c419-4828-be8b-08b11825953c",
  solution: "https://github.com/user-attachments/assets/59cbe952-83ff-4d87-b56d-7975a4ffd49b",
  features: "https://github.com/user-attachments/assets/5c8a9265-3a6f-4d82-b431-4e441d165aed",
  problem: "https://github.com/user-attachments/assets/f83e79c3-4578-465d-9c6c-86f862ca5bc1",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--navy)" }}>
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(10,22,40,0.95)", borderBottom: "1px solid var(--navy-light)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-extrabold tracking-widest"
            style={{ color: "var(--gold)", letterSpacing: "0.15em" }}
          >
            PHI
          </span>
          <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--foreground)", opacity: 0.7 }}>
            Prince Haul Intelligence
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#problem" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
            The Problem
          </a>
          <a href="#solution" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
            Solution
          </a>
          <a href="#features" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
            Features
          </a>
          <a
            href="#cta"
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--navy)" }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden"
        style={{ background: "linear-gradient(180deg, var(--navy-mid) 0%, var(--navy) 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(212,160,23,0.3) 40px,rgba(212,160,23,0.3) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(212,160,23,0.3) 40px,rgba(212,160,23,0.3) 41px)",
          }}
        />
        <p
          className="mb-4 text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: "var(--gold)" }}
        >
          AI-Powered Trucking Platform
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 max-w-4xl leading-tight" style={{ color: "var(--foreground)" }}>
          Smarter Loads.{" "}
          <span style={{ color: "var(--gold)" }}>Less Hassle.</span>
          <br />More Money.
        </h1>
        <p className="text-lg sm:text-xl mb-10 max-w-2xl" style={{ color: "var(--foreground)", opacity: 0.75 }}>
          PHI connects truckers and dispatchers with AI-driven load matching, automated paperwork, and real-time freight intelligence — so you spend less time searching and more time hauling.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-14">
          <a
            href="#cta"
            className="px-8 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg"
            style={{ background: "var(--gold)", color: "var(--navy)" }}
          >
            Start for Free
          </a>
          <a
            href="#problem"
            className="px-8 py-4 rounded-xl text-base font-bold border-2 transition-all hover:opacity-80"
            style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
          >
            See the Problem
          </a>
        </div>
        <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--navy-light)" }}>
          <Image
            src={BRAND_IMAGES.hero}
            alt="Prince Haul Intelligence – AI Trucking Platform"
            width={1200}
            height={675}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </section>

      {/* The Problem Section */}
      <section
        id="problem"
        className="py-20 px-6"
        style={{ background: "var(--navy-mid)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="mb-3 text-xs font-bold tracking-[0.3em] uppercase"
              style={{ color: "var(--gold)" }}
            >
              Why PHI Exists
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--foreground)" }}>
              The Problem with Trucking Today
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              Truckers and dispatchers waste hours every day fighting outdated systems, chasing loads, and drowning in paperwork.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--navy-light)" }}>
            <Image
              src={BRAND_IMAGES.problem}
              alt="The Problem – No Loads Found, paperwork overload, and frustrated truckers"
              width={1200}
              height={800}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            {[
              {
                icon: "🚛",
                title: "No Loads Found",
                desc: "Drivers idle for hours refreshing load boards with no results that match their route or rate.",
              },
              {
                icon: "💸",
                title: "Money Left on the Table",
                desc: "Without real-time rate intelligence, truckers accept low-paying loads and miss higher-value freight.",
              },
              {
                icon: "📄",
                title: "Paperwork Overload",
                desc: "Hours lost to BOLs, rate confirmations, and compliance docs that should take minutes.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border"
                style={{ background: "var(--navy)", borderColor: "var(--navy-light)" }}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--gold)" }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.75 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section
        id="solution"
        className="py-20 px-6"
        style={{ background: "var(--navy)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <p
              className="mb-3 text-xs font-bold tracking-[0.3em] uppercase"
              style={{ color: "var(--gold)" }}
            >
              The PHI Difference
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6" style={{ color: "var(--foreground)" }}>
              AI That Works as Hard as You Do
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--foreground)", opacity: 0.75 }}>
              PHI uses advanced AI to match truckers with the best available loads in real time, automate documentation, and give dispatchers a unified command center — all in one platform.
            </p>
            <ul className="space-y-4">
              {[
                "Instant load matching based on location, equipment, and preferred rates",
                "AI-generated paperwork: BOLs, rate cons, and compliance docs in seconds",
                "Real-time freight rate intelligence and market analytics",
                "Dispatcher dashboard with full fleet visibility",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--gold)", color: "var(--navy)" }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "var(--foreground)", opacity: 0.85 }}>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--navy-light)" }}>
            <Image
              src={BRAND_IMAGES.solution}
              alt="PHI Solution – AI-powered load matching and dispatch"
              width={700}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6"
        style={{ background: "var(--navy-mid)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="mb-3 text-xs font-bold tracking-[0.3em] uppercase"
              style={{ color: "var(--gold)" }}
            >
              Platform Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--foreground)" }}>
              Everything You Need to Haul Smarter
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--navy-light)" }}>
              <Image
                src={BRAND_IMAGES.features}
                alt="PHI Features – Trucking platform dashboard and tools"
                width={700}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: "🤖", title: "AI Load Matching", desc: "Get matched with loads that fit your truck, route, and rate goals automatically." },
                { icon: "📊", title: "Market Analytics", desc: "See live freight rates, lane trends, and demand forecasts before you book." },
                { icon: "📱", title: "Mobile-First", desc: "Manage loads, docs, and communications from the cab on any device." },
                { icon: "🗂️", title: "Smart Documents", desc: "Auto-generate and manage BOLs, rate confirmations, and compliance paperwork." },
                { icon: "🗺️", title: "Route Optimization", desc: "Find the most profitable multi-stop routes with AI-powered planning." },
                { icon: "💬", title: "Dispatcher Hub", desc: "One dashboard for your whole fleet — drivers, loads, and earnings in one view." },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-xl border transition-all hover:border-yellow-500"
                  style={{ background: "var(--navy)", borderColor: "var(--navy-light)" }}
                >
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="text-base font-bold mb-1" style={{ color: "var(--gold)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="py-16 px-6"
        style={{ background: "var(--navy)", borderTop: "1px solid var(--navy-light)", borderBottom: "1px solid var(--navy-light)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { stat: "10,000+", label: "Loads Matched" },
            { stat: "2,500+", label: "Active Drivers" },
            { stat: "40%", label: "Less Dead Miles" },
            { stat: "3x", label: "Faster Bookings" },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--gold)" }}>
                {item.stat}
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className="py-24 px-6 text-center"
        style={{ background: "linear-gradient(180deg, var(--navy) 0%, var(--navy-mid) 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <p
            className="mb-4 text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: "var(--gold)" }}
          >
            Ready to Haul Smarter?
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6" style={{ color: "var(--foreground)" }}>
            Join PHI and Take Control of Your Freight
          </h2>
          <p className="text-lg mb-10" style={{ color: "var(--foreground)", opacity: 0.75 }}>
            Whether you&apos;re an owner-operator or running a full fleet, PHI gives you the AI edge to find better loads, cut costs, and grow faster.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 max-w-sm px-5 py-4 rounded-xl text-base outline-none border"
              style={{
                background: "var(--navy-light)",
                color: "var(--foreground)",
                borderColor: "var(--navy-light)",
              }}
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg"
              style={{ background: "var(--gold)", color: "var(--navy)" }}
            >
              Get Early Access
            </button>
          </form>
          <p className="mt-4 text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            No credit card required. Free to start.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-6"
        style={{ background: "var(--navy-mid)", borderTop: "1px solid var(--navy-light)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
              PHI
            </span>
            <span className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
              Prince Haul Intelligence
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            © {new Date().getFullYear()} Prince Haul Intelligence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
