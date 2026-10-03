import confetti from "canvas-confetti";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  clearLegacyAuthData,
  normalizeStudentProfile,
  profileDefaults,
  StoredUser,
  StudentProfile,
} from "./lib/auth";
import { demoApiRequest } from "./lib/demoDatabase";
import { getProfileRecommendations } from "./lib/recommendations";
import scholarPathLogo from "./imports/scholarpath-logo.png";

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
  onRegister,
  onLogin,
  errorMessage,
  helperMessage,
}: {
  mode: "register" | "login";
  onClose: () => void;
  onRegister: (details: { fullName: string; username: string; password: string }) => void;
  onLogin: (details: { username: string; password: string }) => void;
  errorMessage?: string;
  helperMessage?: string;
}) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      const username = form.username.trim();
      const password = form.password.trim();
      const fullName = form.fullName.trim();

      if (!fullName || !username || !password) {
        setError("Full name, username, and password are required.");
        return;
      }
      if (password.length < 12) {
        setError("Choose a password with at least 12 characters.");
        return;
      }

      onRegister({ fullName, username, password });
      return;
    }

    const username = form.username.trim();
    const password = form.password.trim();

    if (!username || !password) {
      setError("Enter both your username and password to continue.");
      return;
    }

    onLogin({ username, password });
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

        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#cf334a]">ScholarPath</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#07345e]">
          {mode === "register" ? "Create your profile" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "register"
            ? "Tell us a little about yourself to unlock personalized matches."
            : "Sign in to continue your scholarship journey."}
        </p>

        {helperMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {helperMessage}
          </div>
        )}

        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode === "register" && (
            <label className="block text-sm font-bold text-slate-700">
              Full name
              <input
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder="Your full name"
              />
            </label>
          )}

          <label className="block text-sm font-bold text-slate-700">
            Username
            <input
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
              placeholder="Pick a username"
            />
          </label>

          {mode === "register" && (
            <label className="block text-sm font-bold text-slate-700">
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder="you@example.com"
              />
            </label>
          )}

          <label className="block text-sm font-bold text-slate-700">
            Password
            <input
              name="password"
              required
              minLength={mode === "register" ? 12 : undefined}
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
              placeholder={mode === "register" ? "At least 12 characters" : "Your password"}
            />
          </label>

          {(error || errorMessage) && (
            <p className="text-sm font-medium text-[#cf334a]">{error || errorMessage}</p>
          )}

          <button className="w-full rounded-xl bg-[#0878c9] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#066ab2]">
            {mode === "register" ? "Create free account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

type Opportunity = {
  title: string;
  type: "Scholarship" | "Financial aid";
  amount: string;
  match: number;
  description: string;
  forWho: string;
  process: string;
  deadline: string;
  link: string;
  source: string;
};

async function apiRequest(path: string, options: RequestInit = {}) {
  return demoApiRequest(path, options);
}

const scholarshipPool = [
  {
    title: "The Gates Scholarship",
    type: "Scholarship" as const,
    amount: "Full cost of attendance",
    description: "A highly selective scholarship that covers the cost of education for exceptional students with outstanding academic achievement and leadership potential.",
    forWho: "High-achieving students, especially those demonstrating leadership, community impact, and financial need.",
    process: "Apply through the official Gates Scholarship portal and submit academic records, essays, and financial information when prompted.",
    deadline: "Annual cycle",
    link: "https://www.thegatesscholarship.org/",
    source: "The Gates Scholarship",
    keywords: ["leadership", "community", "academic", "gpa", "need", "service", "first-generation", "minority"],
  },
  {
    title: "Dell Scholars Program",
    type: "Scholarship" as const,
    amount: "$20,000",
    description: "A scholarship program designed to support students who show initiative, resilience, and academic promise in their college journey.",
    forWho: "Students with strong academic records, leadership, and a demonstrated need for support to complete college.",
    process: "Apply online through the Dell Scholars application, including academic information, essays, and proof of college enrollment or eligibility.",
    deadline: "Annual cycle",
    link: "https://www.dellscholars.org/",
    source: "Dell Scholars",
    keywords: ["need", "leadership", "academic", "first-generation", "community", "gpa"],
  },
  {
    title: "Coca-Cola Scholars Program",
    type: "Scholarship" as const,
    amount: "$20,000",
    description: "A prestigious scholarship recognizing students who demonstrate leadership, service, and academic excellence in their communities.",
    forWho: "Students with strong academics and a history of service, leadership, and campus or community involvement.",
    process: "Create an account through the Coca-Cola Scholars Foundation site and submit a complete application, essays, and recommendations.",
    deadline: "Annual cycle",
    link: "https://www.coca-colascholarsfoundation.org/",
    source: "Coca-Cola Scholars Foundation",
    keywords: ["leadership", "service", "community", "academic", "gpa", "stem", "volunteer"],
  },
  {
    title: "BHW Scholarship",
    type: "Scholarship" as const,
    amount: "$3,000",
    description: "A scholarship opportunity for students pursuing careers in healthcare, business, technology, and related fields.",
    forWho: "Students entering or continuing higher education in healthcare, business, technology, and adjacent fields.",
    process: "Submit your application through the official BHW Scholarship portal and provide academic, career, and personal background details.",
    deadline: "Varies by cycle",
    link: "https://www.bhwscholarships.com/",
    source: "BHW Scholarship",
    keywords: ["health", "business", "technology", "stem", "healthcare", "college", "career"],
  },
  {
    title: "Fastweb Scholarship Search",
    type: "Scholarship" as const,
    amount: "Varies",
    description: "A scholarship portal that matches students to national, local, and niche scholarship opportunities based on profile details.",
    forWho: "Students seeking a wide range of scholarships, including need-, merit-, and interest-based awards.",
    process: "Create a Fastweb profile, answer matching questions, and review scholarship recommendations on the site.",
    deadline: "Ongoing",
    link: "https://www.fastweb.com/",
    source: "Fastweb",
    keywords: ["scholarship", "all", "general", "college", "aid", "financial", "major"],
  },
  {
    title: "Horatio Alger Scholarship",
    type: "Scholarship" as const,
    amount: "$10,000+",
    description: "A scholarship program for students who have overcome adversity and demonstrated perseverance, leadership, and academic promise.",
    forWho: "Students facing significant personal or financial obstacles who have shown resilience and leadership.",
    process: "Apply by submitting academic records, financial information, and a personal statement describing your perseverance and goals.",
    deadline: "Annual cycle",
    link: "https://horatioalger.org/scholarships/",
    source: "Horatio Alger Association",
    keywords: ["resilience", "leadership", "need", "community", "service", "first-generation"],
  },
  {
    title: "UNCF Scholarships",
    type: "Scholarship" as const,
    amount: "$500 to $10,000+",
    description: "A collection of scholarships designed to support students from historically Black colleges and universities and underserved communities.",
    forWho: "Students pursuing higher education with a focus on academic achievement, leadership, and community contribution.",
    process: "Apply through the UNCF scholarship portal and provide school, academic, and financial information as required.",
    deadline: "Varies by program",
    link: "https://uncf.org/",
    source: "UNCF",
    keywords: ["minority", "community", "service", "academic", "need", "leadership"],
  },
  {
    title: "QuestBridge National College Match",
    type: "Scholarship" as const,
    amount: "Full or partial aid packages",
    description: "A college admission and scholarship match program connecting high-achieving, low-income students with selective colleges and financial support.",
    forWho: "High-achieving low-income students who want access to affordable college options and support.",
    process: "Complete the QuestBridge application, share academic and financial information, and match with participating schools.",
    deadline: "Annual cycle",
    link: "https://www.questbridge.org/",
    source: "QuestBridge",
    keywords: ["low-income", "need", "academic", "college", "financial", "first-generation"],
  },
] as const;

const financialAidPool = [
  {
    title: "FAFSA",
    type: "Financial aid" as const,
    amount: "Varies by aid package",
    description: "The official federal aid application used to determine eligibility for grants, loans, and work-study funding.",
    forWho: "Any student seeking federal financial aid for college, including need-based grants and federal support.",
    process: "Complete the FAFSA online at StudentAid.gov and submit your financial and household information for review.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/",
    source: "Federal Student Aid",
    keywords: ["need", "financial", "aid", "college", "all", "federal", "income"],
  },
  {
    title: "Federal Pell Grant",
    type: "Financial aid" as const,
    amount: "Up to $7,395 (annual)",
    description: "A federal grant for students with significant financial need; it does not require repayment.",
    forWho: "Students demonstrating high financial need who are enrolled in eligible programs and institutions.",
    process: "Apply by filing the FAFSA, then confirm your award package through your school’s financial aid office.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/understand-aid/types/grants/pell",
    source: "Federal Student Aid",
    keywords: ["need", "grant", "financial", "income", "low-income", "first-generation"],
  },
  {
    title: "FSEOG Grant",
    type: "Financial aid" as const,
    amount: "Up to $4,000",
    description: "A federal grant for students with exceptional financial need, usually distributed by the school’s financial aid office.",
    forWho: "Students with exceptional need who qualify after submitting the FAFSA and meeting their school’s timeline.",
    process: "Complete the FAFSA and check with your college financial aid office to confirm whether you qualify for FSEOG funding.",
    deadline: "School-specific",
    link: "https://studentaid.gov/understand-aid/types/grants/fseog",
    source: "Federal Student Aid",
    keywords: ["need", "grant", "financial", "low-income", "federal"],
  },
  {
    title: "Federal Work-Study",
    type: "Financial aid" as const,
    amount: "Hourly wages",
    description: "A federal program that helps students earn money through part-time campus or community employment while enrolled in school.",
    forWho: "Students with financial need who can balance part-time work with classes and campus responsibilities.",
    process: "Submit the FAFSA and ask your school’s aid office if you qualify for a work-study award.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/understand-aid/types/work-study",
    source: "Federal Student Aid",
    keywords: ["need", "work", "part-time", "income", "financial"],
  },
  {
    title: "Federal Direct Subsidized Loans",
    type: "Financial aid" as const,
    amount: "Varies by year",
    description: "Government-backed loans where the federal government pays interest while the student is in school at least half-time.",
    forWho: "Undergraduate students with demonstrated financial need who need additional funding beyond grants.",
    process: "File the FAFSA, then accept the offered loan through your school’s financial aid office or student portal.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/understand-aid/types/loans/subsidized-unsubsidized",
    source: "Federal Student Aid",
    keywords: ["loan", "need", "financial", "college", "aid", "federal"],
  },
  {
    title: "Federal Direct Unsubsidized Loans",
    type: "Financial aid" as const,
    amount: "Varies by year",
    description: "Federal loans available to students regardless of financial need, with interest accruing while in school.",
    forWho: "Students who need additional funding for college and may not qualify for need-based grants alone.",
    process: "Submit the FAFSA and accept the offered amount after reviewing your cost of attendance and aid package.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/understand-aid/types/loans/subsidized-unsubsidized",
    source: "Federal Student Aid",
    keywords: ["loan", "financial", "aid", "college", "federal", "income"],
  },
  {
    title: "TEACH Grant",
    type: "Financial aid" as const,
    amount: "Up to $4,000",
    description: "A federal grant for students who agree to teach in a high-need field at a low-income school after graduating.",
    forWho: "Students pursuing teaching careers in high-need subjects or low-income schools.",
    process: "Complete the FAFSA and meet the program requirements, then commit to the service obligation after graduation.",
    deadline: "Annual cycle",
    link: "https://studentaid.gov/understand-aid/types/grants/teach",
    source: "Federal Student Aid",
    keywords: ["teacher", "grant", "education", "financial", "aid", "need"],
  },
  {
    title: "State Grant Programs",
    type: "Financial aid" as const,
    amount: "Varies by state",
    description: "State-based award programs that provide need-based and merit-based assistance to in-state and out-of-state students.",
    forWho: "Students attending college in or outside their home state, depending on the program’s requirements.",
    process: "Check with your state higher education agency and fill out any required state aid application forms.",
    deadline: "State-specific",
    link: "https://www.ed.gov/",
    source: "U.S. Department of Education",
    keywords: ["state", "grant", "financial", "aid", "college", "need"],
  },
] as const;

export default function App() {
  const [modal, setModal] = useState<"register" | "login" | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    {
      role: "bot",
      text: "Hi! I’m Liberty. Ask me how ScholarPath works, how to use it, or how to improve your profile.",
    },
  ]);
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "newsletter" | "scholarships" | "financialAid">("profile");
  const [newsletters, setNewsletters] = useState<Array<{ id: number; title: string; summary: string; category: string; created_at: string; created_by: string }>>([]);
  const [adminNewsletters, setAdminNewsletters] = useState<any[]>([]);
  const [adminDraft, setAdminDraft] = useState({ title: "", summary: "", category: "General" });
  const [draftProfile, setDraftProfile] = useState<StudentProfile>(currentUser?.profile ?? profileDefaults);
  const [statusMessage, setStatusMessage] = useState("");
  const welcomed = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  async function loadNewsletters() {
    try {
      const response = await apiRequest("/newsletters");
      setNewsletters(response.newsletters ?? []);
    } catch {
      setNewsletters([]);
    }
  }

  useEffect(() => {
    clearLegacyAuthData();
    loadNewsletters();

    apiRequest("/me")
      .then((response) => {
        const user = response.user;
        setCurrentUser(user);
        setIsAdminMode(Boolean(user.isAdmin));
        setDraftProfile(normalizeStudentProfile(user.profile));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) {
      setDraftProfile(normalizeStudentProfile(currentUser.profile));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!chatOpen || !chatScrollRef.current) return;

    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, chatOpen]);

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

  async function handleRegister({ fullName, username, password }: { fullName: string; username: string; password: string }) {
    try {
      await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          username,
          password,
          profile: {
            ...profileDefaults,
            school: "",
            major: "",
            interests: `New student profile for ${fullName}`,
          },
        }),
      });

      setAuthError("");
      setStatusMessage("Account created successfully. Please sign in to finish your profile.");
      setModal("login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to register.";
      setAuthError(message);
    }
  }

  async function handleLogin({ username, password }: { username: string; password: string }) {
    try {
      const response = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const user = response.user;
      setCurrentUser(user);
      setDraftProfile(normalizeStudentProfile(user.profile));
      setIsAdminMode(Boolean(user.isAdmin));

      if (user.isAdmin) {
        let adminNewslettersList: any[] = [];
        try {
          const adminResponse = await apiRequest("/newsletters");
          adminNewslettersList = adminResponse.newsletters ?? [];
        } catch {
          adminNewslettersList = [];
        }

        setAdminNewsletters(adminNewslettersList);
      }

      setAuthError("");
      setStatusMessage(user.isAdmin ? "Admin access granted." : `Welcome back, ${user.username}!`);
      setModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login.";
      setAuthError(message);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!currentUser) return;

    try {
      const payload = {
        username: currentUser.username,
        profile: {
          ...draftProfile,
          newsletters: draftProfile.newsletters ?? [],
        },
        newsletters: draftProfile.newsletters ?? [],
      };

      const response = await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const user = response.user;
      const profile = normalizeStudentProfile(user.profile);
      setCurrentUser({ ...user, profile });
      setDraftProfile(profile);
      setStatusMessage("Profile saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile save failed.";
      setStatusMessage(message);
    }
  }

  async function handleCreateNewsletter(event: FormEvent) {
    event.preventDefault();
    if (!adminDraft.title.trim() || !adminDraft.summary.trim()) {
      setStatusMessage("Add a title and summary before publishing a newsletter.");
      return;
    }

    try {
      await apiRequest("/admin/newsletters", {
        method: "POST",
        body: JSON.stringify({
          title: adminDraft.title,
          summary: adminDraft.summary,
          category: adminDraft.category,
        }),
      });

      setAdminDraft({ title: "", summary: "", category: "General" });
      const response = await apiRequest("/newsletters");
      setNewsletters(response.newsletters ?? []);
      setAdminNewsletters(response.newsletters ?? []);
      setStatusMessage("Newsletter published successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Newsletter could not be created.";
      setStatusMessage(message);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // Clear local UI state even if the server is unavailable.
    }
    setCurrentUser(null);
    setIsAdminMode(false);
    setAdminNewsletters([]);
    setDraftProfile(profileDefaults);
    setStatusMessage("You have been logged out.");
  }

  function handleProfileChange(field: keyof StudentProfile, value: string | string[]) {
    setDraftProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getRecommendations(profile: StudentProfile): Opportunity[] {
    return getProfileRecommendations(profile, scholarshipPool, financialAidPool).map((item) => ({
      title: item.title,
      type: item.type,
      amount: item.amount,
      match: item.match,
      description: item.description,
      forWho: item.forWho,
      process: item.process,
      deadline: item.deadline,
      link: item.link,
      source: item.source,
    }));
  }

  function getLibertyResponse(input: string) {
    const query = input.trim().toLowerCase();

    if (!query) {
      return "I can help with how ScholarPath works, how to use it, or how to improve your profile.";
    }

    if (query.includes("how does this work") || query.includes("how this works") || query.includes("what is this")) {
      return "ScholarPath helps students discover scholarships, track deadlines, and build a profile that matches their academic background, interests, and goals. You can create an account, fill out your profile, and explore scholarships that fit you.";
    }

    if (query.includes("how to use") || query.includes("use this app") || query.includes("how do i use")) {
      return "Start by creating an account, then sign in and complete your student profile. Add your GPA, AP classes, ethnicity, gender, school, and goals. Once saved, the app will help you explore scholarship matches and keep your information organized.";
    }

    if (query.includes("scholarship") || query.includes("find scholarships") || query.includes("matching")) {
      return "The app is built to surface scholarship opportunities based on your profile details, like GPA, interests, and academic background. The better your profile is filled out, the stronger the recommendations become.";
    }

    if (query.includes("profile") || query.includes("edit my profile") || query.includes("update profile")) {
      return "You can update your profile after logging in. Fill in details like ethnicity, gender, age, GPA, AP count, school, major, graduation year, and interests to keep your scholarship matches accurate.";
    }

    if (query.includes("gpa") || query.includes("ap")) {
      return "Your GPA and AP count are important for scholarship matching. Enter them accurately in your profile so you can get more relevant opportunities and a stronger student snapshot.";
    }

    if (query.includes("register") || query.includes("sign up") || query.includes("create account")) {
      return "To register, click 'Get started', create a username and password, and complete your profile details. After that, you can log in anytime to update your academic information.";
    }

    if (query.includes("login") || query.includes("log in") || query.includes("sign in")) {
      return "Just use the username and password you created during registration. Once you’re signed in, your profile and saved information become available for editing.";
    }

    if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
      return "Hi! I’m Liberty, your ScholarPath guide. Ask me anything about how to use the app or how to improve your scholarship profile.";
    }

    return "I can help with how ScholarPath works, how to use the app, scholarship matching, or editing your profile. Try one of the suggested questions or ask me in your own words.";
  }

  function handleChatSubmit(customInput?: string) {
    const text = (customInput ?? chatInput).trim();

    if (!text) {
      return;
    }

    setChatMessages((current) => [...current, { role: "user", text }]);
    setChatInput("");

    const reply = getLibertyResponse(text);
    setChatMessages((current) => [...current, { role: "bot", text: reply }]);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="ScholarPath home">
            <img
              src={scholarPathLogo}
              alt="ScholarPath logo"
              className="h-12 w-12 rounded-xl object-cover shadow-md shadow-blue-200"
            />
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

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <span className="hidden rounded-full bg-blue-50 px-3 py-2 text-sm font-extrabold text-[#07345e] sm:inline-flex">
                  {currentUser.username}
                </span>
                <button
                  className="rounded-xl bg-[#cf334a] px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:bg-[#b7283f] sm:px-5"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  className="rounded-lg px-3 py-2 text-sm font-extrabold text-[#07345e] transition hover:text-[#0878c9] sm:px-4"
                  onClick={() => {
                    setAuthError("");
                    setModal("login");
                  }}
                >
                  Log in
                </button>
                <button
                  className="rounded-xl bg-[#cf334a] px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:bg-[#b7283f] sm:px-5"
                  onClick={() => {
                    setAuthError("");
                    setModal("register");
                  }}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900">
        DEMO ONLY · Use sample information; data is stored only in this browser.
      </div>

      {isAdminMode ? (
        <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="mb-6 rounded-[1.75rem] border border-red-100 bg-red-50 p-5 shadow-lg shadow-red-100/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Admin panel</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Newsletter manager</h1>
              </div>
              <button
                type="button"
                className="rounded-xl bg-[#07345e] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#052c4a]"
                onClick={handleLogout}
              >
                Log out admin
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)]" onSubmit={handleCreateNewsletter}>
              <h2 className="text-2xl font-black text-[#07345e]">Create newsletter</h2>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-bold text-slate-700">
                  Title
                  <input
                    value={adminDraft.title}
                    onChange={(event) => setAdminDraft((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                    placeholder="Scholarship and aid updates"
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Category
                  <select
                    value={adminDraft.category}
                    onChange={(event) => setAdminDraft((current) => ({ ...current, category: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="General">General</option>
                    <option value="Scholarships">Scholarships</option>
                    <option value="Financial Aid">Financial Aid</option>
                    <option value="Campus Updates">Campus Updates</option>
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Summary
                  <textarea
                    rows={6}
                    value={adminDraft.summary}
                    onChange={(event) => setAdminDraft((current) => ({ ...current, summary: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                    placeholder="Share a short update about new opportunities, deadlines, or tips."
                  />
                </label>
                <button type="submit" className="w-full rounded-xl bg-[#cf334a] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-red-200 transition hover:bg-[#b7283f]">
                  Publish newsletter
                </button>
              </div>
            </form>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_65px_rgba(5,52,94,0.08)]">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-xl font-black text-[#07345e]">Published newsletters</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {adminNewsletters.length === 0 ? (
                  <div className="px-5 py-10 text-center text-slate-500">No newsletters published yet.</div>
                ) : (
                  adminNewsletters.map((item) => (
                    <article key={item.id || item.title} className="px-5 py-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">
                          {item.category || "General"}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-black text-[#07345e]">{item.title}</h3>
                      <p className="mt-2 leading-7 text-slate-600">{item.summary}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      ) : currentUser ? (
        <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          {selectedOpportunity && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-[#062b4f]/65 px-5 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={selectedOpportunity.title}
              onMouseDown={(event) => event.target === event.currentTarget && setSelectedOpportunity(null)}
            >
              <div className="relative w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl sm:p-8">
                <button
                  aria-label="Close opportunity"
                  className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  onClick={() => setSelectedOpportunity(null)}
                >
                  <Icon className="h-4 w-4">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </Icon>
                </button>

                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0878c9]">
                    {selectedOpportunity.type}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                    {selectedOpportunity.match}% match
                  </span>
                </div>

                <h3 className="mt-5 text-3xl font-black tracking-tight text-[#07345e]">
                  {selectedOpportunity.title}
                </h3>
                <p className="mt-2 text-lg font-extrabold text-[#cf334a]">{selectedOpportunity.amount}</p>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-slate-400">
                  {selectedOpportunity.deadline}
                </p>

                <div className="mt-6 space-y-5 text-slate-600">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      Overview
                    </p>
                    <p className="mt-2 leading-7">{selectedOpportunity.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      Who it is for
                    </p>
                    <p className="mt-2 leading-7">{selectedOpportunity.forWho}</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      How to apply
                    </p>
                    <p className="mt-2 leading-7">{selectedOpportunity.process}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#07345e]">Official source</p>
                    <p className="mt-2 text-sm font-bold text-[#0878c9]">{selectedOpportunity.source}</p>
                    <a
                      href={selectedOpportunity.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center rounded-xl bg-[#0878c9] px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-blue-200 transition hover:bg-[#066ab2]"
                    >
                      Visit official website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-[1.75rem] border border-blue-100 bg-[#eff8ff] p-5 shadow-lg shadow-blue-100/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">
                  Welcome back
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">
                  {currentUser.username}&apos;s profile
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-extrabold ${activeTab === "profile" ? "bg-[#07345e] text-white" : "bg-white text-[#07345e]"}`}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-extrabold ${activeTab === "scholarships" ? "bg-[#0878c9] text-white" : "bg-white text-[#07345e]"}`}
                  onClick={() => setActiveTab("scholarships")}
                >
                  Scholarships
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-extrabold ${activeTab === "financialAid" ? "bg-[#cf334a] text-white" : "bg-white text-[#07345e]"}`}
                  onClick={() => setActiveTab("financialAid")}
                >
                  Financial aid
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-extrabold ${activeTab === "newsletter" ? "bg-[#cf334a] text-white" : "bg-white text-[#07345e]"}`}
                  onClick={() => setActiveTab("newsletter")}
                >
                  Newsletter
                </button>
              </div>
            </div>
            {statusMessage && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                {statusMessage}
              </div>
            )}
          </div>

          {activeTab === "profile" ? (
            <>
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <aside className="rounded-[2rem] bg-[#07345e] p-6 text-white shadow-2xl shadow-blue-900/10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#bfe7ff]">
                      <Icon className="h-6 w-6">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      </Icon>
                    </div>
                    <div>
                      <p className="text-sm text-blue-100">Student snapshot</p>
                      <h2 className="text-2xl font-black">{currentUser.username}</h2>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">GPA</p>
                      <p className="mt-2 text-3xl font-black">{draftProfile.gpa || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">AP courses</p>
                      <p className="mt-2 text-3xl font-black">{draftProfile.apCount || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">Ethnicity</p>
                      <p className="mt-2 text-xl font-bold">{draftProfile.ethnicity || "Not set"}</p>
                    </div>
                  </div>
                </aside>

                <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_24px_65px_rgba(5,52,94,0.08)] sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">
                        Your details
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">
                        Academic profile
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#07345e] transition hover:border-blue-200 hover:bg-blue-50"
                      onClick={() => setDraftProfile(profileDefaults)}
                    >
                      Reset
                    </button>
                  </div>

                  <form className="mt-8 space-y-5" onSubmit={handleSaveProfile}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block text-sm font-bold text-slate-700">
                        Ethnicity
                        <select
                          value={draftProfile.ethnicity}
                          onChange={(event) => handleProfileChange("ethnicity", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select</option>
                          <option value="African American/Black">African American/Black</option>
                          <option value="Asian">Asian</option>
                          <option value="Hispanic/Latino">Hispanic/Latino</option>
                          <option value="Native American/Indigenous">Native American/Indigenous</option>
                          <option value="White/Caucasian">White/Caucasian</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Gender
                        <select
                          value={draftProfile.gender}
                          onChange={(event) => handleProfileChange("gender", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select</option>
                          <option value="Woman">Woman</option>
                          <option value="Man">Man</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Age
                        <input
                          type="number"
                          min="13"
                          max="100"
                          value={draftProfile.age}
                          onChange={(event) => handleProfileChange("age", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="18"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        GPA
                        <input
                          type="number"
                          min="0"
                          max="4"
                          step="0.1"
                          value={draftProfile.gpa}
                          onChange={(event) => handleProfileChange("gpa", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="3.9"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        # of AP classes
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={draftProfile.apCount}
                          onChange={(event) => handleProfileChange("apCount", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="6"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Graduation year
                        <input
                          type="number"
                          min="2025"
                          max="2035"
                          value={draftProfile.graduationYear ?? ""}
                          onChange={(event) => handleProfileChange("graduationYear", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="2028"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700 md:col-span-2">
                        School
                        <input
                          value={draftProfile.school ?? ""}
                          onChange={(event) => handleProfileChange("school", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="Northside High School"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700 md:col-span-2">
                        Intended major
                        <input
                          value={draftProfile.major ?? ""}
                          onChange={(event) => handleProfileChange("major", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="Computer Science"
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700 md:col-span-2">
                        Interests / future goals
                        <textarea
                          rows={4}
                          value={draftProfile.interests ?? ""}
                          onChange={(event) => handleProfileChange("interests", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="I want to study engineering and pursue community leadership roles..."
                        />
                      </label>

                      <label className="block text-sm font-bold text-slate-700 md:col-span-2">
                        Newsletters
                        <textarea
                          rows={3}
                          value={(draftProfile.newsletters ?? []).join(", ")}
                          onChange={(event) =>
                            handleProfileChange(
                              "newsletters",
                              event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="Scholarship alerts, STEM updates, first-gen resources"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-[#0878c9] px-6 py-3.5 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#066ab2]"
                    >
                      Save profile
                    </button>
                  </form>
                </section>
              </div>
            </>
          ) : activeTab === "scholarships" ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Scholarships</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Opportunities matched for you</h2>
                  <p className="mt-2 text-sm text-slate-500">Demo estimates from your academic profile and the built-in catalog. Confirm eligibility and deadlines with each provider.</p>
                </div>
                <button type="button" onClick={() => setActiveTab("profile")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#07345e]">
                  Back to profile
                </button>
              </div>

              <div className="space-y-4">
                {getRecommendations(draftProfile).filter((item) => item.type === "Scholarship").length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Add your GPA, AP count, intended major, or interests in your profile to see relevant matches.</p>
                ) : getRecommendations(draftProfile)
                  .filter((item) => item.type === "Scholarship")
                  .map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setSelectedOpportunity(item)}
                      className="w-full rounded-[1.5rem] border border-blue-100 bg-[#f9fbff] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0878c9] hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold text-[#07345e]">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.deadline}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">{item.match}% profile fit</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#cf334a]">{item.amount}</span>
                        <span className="text-sm font-bold text-[#0878c9]">View details</span>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          ) : activeTab === "financialAid" ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Financial aid</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Support options for you</h2>
                  <p className="mt-2 text-sm text-slate-500">Demo estimates from your academic profile and the built-in catalog. Confirm eligibility and deadlines with each provider.</p>
                </div>
                <button type="button" onClick={() => setActiveTab("profile")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#07345e]">
                  Back to profile
                </button>
              </div>

              <div className="space-y-4">
                {getRecommendations(draftProfile).filter((item) => item.type === "Financial aid").length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Add your GPA, AP count, intended major, or interests in your profile to see relevant options.</p>
                ) : getRecommendations(draftProfile)
                  .filter((item) => item.type === "Financial aid")
                  .map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setSelectedOpportunity(item)}
                      className="w-full rounded-[1.5rem] border border-red-100 bg-[#fff9f9] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#cf334a] hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold text-[#07345e]">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.deadline}</p>
                        </div>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-extrabold text-[#cf334a]">{item.match}% profile fit</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#cf334a]">{item.amount}</span>
                        <span className="text-sm font-bold text-[#0878c9]">View details</span>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">ScholarPath updates</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Newsletter</h2>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {newsletters.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                      No newsletters are available right now. Check back soon for new opportunities and updates.
                    </div>
                  ) : (
                    newsletters.map((item) => (
                      <article key={item.id || item.title} className="rounded-[1.5rem] border border-slate-200 bg-[#f8fbff] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">
                            {item.category || "General"}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-black text-[#07345e]">{item.title}</h3>
                        <p className="mt-3 leading-7 text-slate-600">{item.summary}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

        </main>
      ) : (
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
                  Your future is bright. <span className="text-[#0878c9]">Let&apos;s fund it.</span>
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
      )}

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

      <div className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5">
        {chatOpen && (
          <div className="mb-3 w-[min(390px,calc(100vw-24px))] rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-[#07345e]">ScholarPath guide</p>
                <p className="mt-1 text-sm text-slate-500">Your free eagle buddy</p>
              </div>
              <button
                aria-label="Close chat"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                onClick={() => setChatOpen(false)}
              >
                <Icon className="h-4 w-4">
                  <path d="m6 6 12 12M18 6 6 18" />
                </Icon>
              </button>
            </div>

            <div ref={chatScrollRef} className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1 sm:max-h-72">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "bot" && <EagleBuddy className="mr-2 h-9 w-9 shrink-0" />}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-6 ${
                      message.role === "bot"
                        ? "rounded-tl-sm bg-blue-50 text-slate-700"
                        : "bg-[#07345e] text-white"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "How does this work?",
                "How do I use this app?",
                "How do I find scholarships?",
                "How do I edit my profile?",
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleChatSubmit(question)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#07345e] transition hover:bg-blue-100"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                aria-label="Chat message"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleChatSubmit();
                  }
                }}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                placeholder="Ask a question..."
              />
              <button
                aria-label="Send message"
                onClick={() => handleChatSubmit()}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[#0878c9] text-white"
              >
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
          aria-label="Toggle Liberty AI helper"
        >
          <Icon className="h-5 w-5">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </Icon>
          Ask Liberty
        </button>
      </div>

      {modal && (
        <AppModal
          mode={modal}
          onClose={() => {
            setModal(null);
            setAuthError("");
          }}
          onRegister={handleRegister}
          onLogin={handleLogin}
          errorMessage={authError}
          helperMessage={statusMessage}
        />
      )}
    </div>
  );
}
