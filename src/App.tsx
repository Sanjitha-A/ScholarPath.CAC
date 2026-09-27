import confetti from "canvas-confetti";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const heroImage =
  "https://images.unsplash.com/photo-1758270705317-3ef6142d306f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400";

const stories = [
  {
    image:
      "https://images.unsplash.com/photo-1623461487986-9400110de28e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=700",
    quote:
      "I found three scholarships that actually fit my goals. One application changed everything.",
    name: "Maya, Class of 2027",
  },
  {
    image:
      "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=700",
    quote:
      "The deadline reminders and financial aid guide made the whole process feel manageable.",
    name: "Jordan, First-generation student",
  },
];

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function EagleBuddy({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg
      aria-label="Liberty, the ScholarPath eagle buddy"
      className={className}
      role="img"
      viewBox="0 0 96 96"
    >
      <circle cx="48" cy="48" r="45" fill="#EAF5FF" stroke="#0878C9" strokeWidth="3" />
      <path d="M25 58C16 57 11 51 10 42c8 0 15 3 20 9l-5 7Z" fill="#9BBAD4" />
      <path d="M71 58c9-1 14-7 15-16-8 0-15 3-20 9l5 7Z" fill="#9BBAD4" />
      <path d="M27 40c0-17 9-27 21-27s21 10 21 27v19c0 15-9 25-21 25S27 74 27 59V40Z" fill="#0B4779" />
      <path
        d="M29 40c2-16 9-25 19-25s17 9 19 25l-7-5-5 5-7-5-7 5-5-5-7 5Z"
        fill="#FFFFFF"
      />
      <path d="M28 43c2-5 7-8 12-8h16c5 0 10 3 12 8v12c-3 8-10 12-20 12S31 63 28 55V43Z" fill="#FFFFFF" />
      <circle cx="40" cy="47" r="4.5" fill="#07345E" />
      <circle cx="56" cy="47" r="4.5" fill="#07345E" />
      <circle cx="41.5" cy="45.5" r="1.2" fill="#FFFFFF" />
      <circle cx="57.5" cy="45.5" r="1.2" fill="#FFFFFF" />
      <path d="m48 49 10 5-10 8-10-8 10-5Z" fill="#F2B84B" stroke="#D9951E" strokeWidth="1.5" />
      <path d="M30 64h36v12c-4 6-10 9-18 9s-14-3-18-9V64Z" fill="#FFFFFF" />
      <path d="M31 70h34v4H31z" fill="#D83A4A" />
      <path d="M45 64h6v21h-6z" fill="#A9C7DF" />
      <path d="M20 38c0-11 6-18 14-18M76 38c0-11-6-18-14-18" fill="none" stroke="#5F86A7" strokeWidth="4" strokeLinecap="round" />
      <rect x="17" y="36" width="9" height="15" rx="4.5" fill="#5F86A7" />
      <rect x="70" y="36" width="9" height="15" rx="4.5" fill="#5F86A7" />
      <path d="M77 49c5 2 6 6 3 10h-7" fill="none" stroke="#5F86A7" strokeWidth="3" strokeLinecap="round" />
      <circle cx="71" cy="59" r="3" fill="#D83A4A" />
    </svg>
  );
}

function AppModal({
  mode,
  onClose,
}: {
  mode: "register" | "login";
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#062b4f]/65 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "register" ? "Create an account" : "Sign in"}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl sm:p-9">
        <button
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          onClick={onClose}
        >
          <Icon className="h-4 w-4">
            <path d="m6 6 12 12M18 6 6 18" />
          </Icon>
        </button>
        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-[#0878c9]">
              <Icon className="h-7 w-7">
                <path d="m5 12 4 4L19 6" />
              </Icon>
            </div>
            <h2 className="text-2xl font-extrabold text-[#07345e]">
              {mode === "register" ? "You're on your way!" : "Welcome back!"}
            </h2>
            <p className="mt-3 text-slate-600">
              {mode === "register"
                ? "Your ScholarPath profile is ready to be completed."
                : "Your personalized scholarship dashboard is ready."}
            </p>
            <button className="mt-6 rounded-xl bg-[#0878c9] px-6 py-3 font-bold text-white" onClick={onClose}>
              Continue
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#cf334a]">
              ScholarPath
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#07345e]">
              {mode === "register" ? "Create your profile" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "register"
                ? "Tell us a little about yourself to unlock personalized matches."
                : "Sign in to continue your scholarship journey."}
            </p>
            <form className="mt-7 space-y-4" onSubmit={submit}>
              {mode === "register" && (
                <label className="block text-sm font-bold text-slate-700">
                  Full name
                  <input
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                    placeholder="Your full name"
                  />
                </label>
              )}
              <label className="block text-sm font-bold text-slate-700">
                Email address
                <input
                  required
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Password
                <input
                  required
                  minLength={6}
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                  placeholder="At least 6 characters"
                />
              </label>
              <button className="w-full rounded-xl bg-[#0878c9] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#066ab2]">
                {mode === "register" ? "Create free account" : "Sign in"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [modal, setModal] = useState<"register" | "login" | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const welcomed = useRef(false);

  useEffect(() => {
    if (welcomed.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#0878c9", "#ffffff", "#cf334a"];
    const burst = () => {
      confetti({
        particleCount: 34,
        angle: 60,
        spread: 55,
        startVelocity: 34,
        origin: { x: 0, y: 0.72 },
        colors,
        scalar: 0.8,
      });
      confetti({
        particleCount: 34,
        angle: 120,
        spread: 55,
        startVelocity: 34,
        origin: { x: 1, y: 0.72 },
        colors,
        scalar: 0.8,
      });
    };

    const timer = window.setTimeout(() => {
      welcomed.current = true;
      burst();
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="ScholarPath home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0878c9] text-white shadow-md shadow-blue-200">
              <Icon className="h-6 w-6">
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12.5V17c3 2 7 2 10 0v-4.5M21 10v6" />
              </Icon>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-[#07345e]">
              Scholar<span className="text-[#cf334a]">Path</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
            <a className="transition hover:text-[#0878c9]" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-[#0878c9]" href="#scholarships">
              Scholarships
            </a>
            <a className="transition hover:text-[#0878c9]" href="#stories">
              Student stories
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="px-3 py-2 text-sm font-extrabold text-[#07345e] transition hover:text-[#0878c9] sm:px-4"
              onClick={() => setModal("login")}
            >
              Log in
            </button>
            <button
              className="rounded-xl bg-[#cf334a] px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:bg-[#b7283f] sm:px-5"
              onClick={() => setModal("register")}
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#eff8ff]">
          <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#b7283f] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#cf334a]" />
                100% free for every student
              </div>
              <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.04] tracking-[-0.045em] text-[#07345e] sm:text-6xl lg:text-[4.5rem]">
                Your future is bright.{" "}
                <span className="text-[#0878c9]">Let&apos;s fund it.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Free scholarship and financial aid support for students who need it. Discover
                opportunities that match your story, organize every deadline, and get trusted
                guidance—all in one place.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0878c9] px-7 py-4 font-extrabold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#066ab2]"
                  onClick={() => setModal("register")}
                >
                  Find my scholarships
                  <Icon className="h-5 w-5 transition group-hover:translate-x-1">
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </Icon>
                </button>
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-7 py-4 font-extrabold text-[#07345e] transition hover:border-blue-300 hover:bg-blue-50"
                  href="#how-it-works"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
                {["Completely free", "Scholarships + financial aid", "No hidden fees—ever"].map((item) => (
                  <span className="flex items-center gap-2" key={item}>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-[#0878c9]">
                      <Icon className="h-3 w-3">
                        <path d="m5 12 4 4L19 6" />
                      </Icon>
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[570px]">
              <div className="absolute -right-4 -top-5 h-28 w-28 rounded-[2rem] bg-[#13a66f]" />
              <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full border-[18px] border-blue-200" />
              <div className="relative overflow-hidden rounded-[2.2rem] border-[7px] border-white bg-white shadow-2xl shadow-blue-900/15">
                <img
                  src={heroImage}
                  alt="College students collaborating around a laptop"
                  className="h-[420px] w-full object-cover sm:h-[510px]"
                />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-[#cf334a]">
                      <Icon className="h-6 w-6">
                        <path d="M12 3v18M17 7.5c0-2-2-3-5-3s-5 1.2-5 3 1.8 2.8 5 3.5 5 1.8 5 4-2 4-5 4-5-1.2-5-3" />
                      </Icon>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[#07345e]">$18,500 in matches found</p>
                      <p className="mt-0.5 text-sm text-slate-500">Based on your goals and profile</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-3 bottom-24 z-10 flex items-center gap-2 rounded-2xl border border-blue-100 bg-white py-2 pl-2 pr-4 shadow-xl sm:-right-7">
                <EagleBuddy className="h-12 w-12 shrink-0 opacity-90" />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#d83a4a]">Meet Liberty</p>
                  <p className="text-sm font-bold text-[#07345e]">Your free aid buddy</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">
              Scholarships and financial aid
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07345e] sm:text-5xl">
              Free support from search to submit
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              ScholarPath is completely free for students—especially those who need help making
              college possible.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                color: "bg-blue-50 text-[#0878c9]",
                title: "Tell us your story",
                text: "Create one profile with your goals, interests, achievements, and background.",
                icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
              },
              {
                number: "02",
                color: "bg-red-50 text-[#cf334a]",
                title: "Meet your matches",
                text: "See scholarships selected for you, with clear eligibility and deadline details.",
                icon: <path d="m3 12 6 6L21 6M15 6h6v6" />,
              },
              {
                number: "03",
                color: "bg-blue-50 text-[#0878c9]",
                title: "Apply with confidence",
                text: "Track progress, understand financial aid, and ask Liberty for help whenever you need it.",
                icon: <path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4" />,
              },
            ].map((step) => (
              <article
                key={step.number}
                className="group relative rounded-[1.75rem] border border-slate-100 bg-white p-7 shadow-[0_18px_55px_rgba(5,52,94,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(5,52,94,0.13)]"
              >
                <span className="absolute right-6 top-5 text-5xl font-black text-slate-100">
                  {step.number}
                </span>
                <div className={`grid h-14 w-14 place-items-center rounded-2xl ${step.color}`}>
                  <Icon className="h-7 w-7">{step.icon}</Icon>
                </div>
                <h3 className="mt-7 text-xl font-extrabold text-[#07345e]">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="scholarships" className="bg-[#07345e] px-5 py-20 text-white sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-red-200">
                Made for real students
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Scholarships and financial aid in one clear view.
              </h2>
              <p className="mt-5 text-lg leading-8 text-blue-100">
                Your free dashboard brings personalized scholarships, profile progress, and
                need-based financial aid resources together—without fees or overwhelm.
              </p>
              <button
                className="mt-8 rounded-xl bg-[#cf334a] px-6 py-3.5 font-extrabold text-white transition hover:bg-[#b7283f]"
                onClick={() => setModal("register")}
              >
                Build my free profile
              </button>
            </div>

            <div className="rounded-[2rem] bg-[#f7fbff] p-4 text-slate-800 shadow-2xl sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Good afternoon, Alex</p>
                  <h3 className="text-2xl font-black text-[#07345e]">Your scholarship matches</h3>
                </div>
                <div className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-extrabold text-[#0878c9]">
                  Profile 82% complete
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Community Leaders Award", "$5,000", "12 days left", "94% match"],
                  ["Future in STEM Scholarship", "$7,500", "18 days left", "91% match"],
                  ["First Generation Fund", "$3,000", "24 days left", "88% match"],
                ].map(([title, amount, deadline, match], index) => (
                  <div
                    className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 sm:flex-row sm:items-center"
                    key={title}
                  >
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${index === 1 ? "bg-red-50 text-[#cf334a]" : "bg-blue-100 text-[#0878c9]"}`}
                    >
                      <Icon className="h-5 w-5">
                        <path d="M12 3 3 8l9 5 9-5-9-5ZM6 10.5V16c3 2 9 2 12 0v-5.5" />
                      </Icon>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-[#07345e]">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{deadline}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                      <p className="font-black text-[#07345e]">{amount}</p>
                      <p className="text-xs font-bold text-[#cf334a]">{match}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="stories" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">
                Student stories
              </p>
              <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[#07345e] sm:text-5xl">
                Big dreams, real progress.
              </h2>
            </div>
            <p className="max-w-md leading-7 text-slate-600">
              Every path is different. We make sure every student has a fair chance to move theirs
              forward.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {stories.map((story) => (
              <article className="grid overflow-hidden rounded-[1.75rem] bg-[#eff8ff] sm:grid-cols-[.8fr_1.2fr]" key={story.name}>
                <img className="h-64 w-full object-cover sm:h-full" src={story.image} alt="" />
                <div className="flex flex-col justify-center p-7 sm:p-9">
                  <span className="text-5xl font-black leading-none text-[#cf334a]">“</span>
                  <blockquote className="-mt-3 text-xl font-bold leading-8 text-[#07345e]">
                    {story.quote}
                  </blockquote>
                  <p className="mt-5 text-sm font-extrabold text-[#0878c9]">{story.name}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] bg-[#cf334a] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10" />
            <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-blue-500/20" />
            <div className="relative">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                Your next opportunity is waiting.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-red-50">
                Create your free profile and start finding scholarships made for someone like you.
              </p>
              <button
                className="mt-8 rounded-xl bg-white px-7 py-4 font-extrabold text-[#07345e] shadow-xl transition hover:-translate-y-0.5"
                onClick={() => setModal("register")}
              >
                Get started for free
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-100 bg-[#f7fbff]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-9 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-extrabold text-[#07345e]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0878c9] text-white">
              <Icon className="h-4 w-4">
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
              </Icon>
            </span>
            ScholarPath
          </div>
          <p>Making education funding clearer, fairer, and easier to find.</p>
          <div className="flex gap-5 font-bold text-slate-600">
            <a href="#">Privacy</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-5 right-5 z-40">
        {chatOpen && (
          <div className="mb-3 w-[min(350px,calc(100vw-40px))] rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-[#07345e]">ScholarPath guide</p>
                <p className="mt-1 text-sm text-slate-500">Your free eagle buddy</p>
              </div>
              <button aria-label="Close chat" className="text-slate-400" onClick={() => setChatOpen(false)}>
                <Icon className="h-4 w-4">
                  <path d="m6 6 12 12M18 6 6 18" />
                </Icon>
              </button>
            </div>
            <div className="mt-5 flex items-start gap-3">
              <EagleBuddy className="h-14 w-14 shrink-0" />
              <div className="rounded-xl rounded-tl-sm bg-blue-50 p-3.5 text-sm leading-6 text-slate-700">
                Hi, I&apos;m Liberty! I can help you find free scholarship opportunities,
                understand financial aid, or plan your next step. What can I help with?
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                aria-label="Chat message"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                placeholder="Ask a question..."
              />
              <button aria-label="Send message" className="grid h-11 w-11 place-items-center rounded-xl bg-[#0878c9] text-white">
                <Icon className="h-5 w-5">
                  <path d="m4 4 17 8-17 8 4-8-4-8Zm4 8h13" />
                </Icon>
              </button>
            </div>
          </div>
        )}
        <button
          className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#07345e] px-5 font-extrabold text-white shadow-xl transition hover:-translate-y-0.5"
          onClick={() => setChatOpen((open) => !open)}
          aria-expanded={chatOpen}
        >
          <Icon className="h-5 w-5">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </Icon>
          Ask Liberty
        </button>
      </div>

      {modal && <AppModal mode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
