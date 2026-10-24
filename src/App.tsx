import confetti from "canvas-confetti";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  clearLegacyAuthData,
  normalizeStudentProfile,
  profileDefaults,
  StoredUser,
  StudentProfile,
} from "./lib/auth";
import { demoApiRequest } from "./lib/demoDatabase";
import {
  buildRoadmapTasks,
  calculateEstimatedFundingGap,
  getNextBestStep,
  roadmapLearningGuides,
  roadmapProfileDefaults,
  type RoadmapProfile,
  type RoadmapTask,
  type RoadmapTaskStatus,
} from "./lib/fundingRoadmap";
import { getEligibilityAssessment, getProfileRecommendations, getRecommendationReasons } from "./lib/recommendations";
const heroImage =
  "https://images.unsplash.com/photo-1758270705317-3ef6142d306f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400";

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

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
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80",
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

function AppModal({
  mode,
  onClose,
  onRegister,
  onLogin,
  onModeChange,
  onForgotPassword,
  onResetPassword,
  resetToken,
  errorMessage,
  helperMessage,
}: {
  mode: "register" | "login" | "forgot" | "reset";
  onClose: () => void;
  onRegister: (details: { fullName: string; username: string; email: string; password: string }) => void;
  onLogin: (details: { username: string; password: string }) => void;
  onModeChange: (mode: "login" | "forgot") => void;
  onForgotPassword: (email: string) => void;
  onResetPassword: (token: string, password: string) => void;
  resetToken: string;
  errorMessage?: string;
  helperMessage?: string;
}) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      const email = form.email.trim();

      if (!fullName || !username || !email || !password) {
        setError("Full name, username, email, and password are required.");
        return;
      }
      if (password.length < 12) {
        setError("Choose a password with at least 12 characters.");
        return;
      }

      onRegister({ fullName, username, email, password });
      return;
    }

    if (mode === "forgot") {
      const email = form.email.trim();
      if (!email) {
        setError("Enter the email address associated with your account.");
        return;
      }
      onForgotPassword(email);
      return;
    }

    if (mode === "reset") {
      const password = form.password.trim();
      if (!resetToken) {
        setError("This password reset link is invalid or has expired. Request a new one.");
        return;
      }
      if (password.length < 12) {
        setError("Choose a password with at least 12 characters.");
        return;
      }
      if (password !== form.confirmPassword) {
        setError("The passwords do not match.");
        return;
      }
      onResetPassword(resetToken, password);
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
      aria-label={mode === "register" ? "Create an account" : mode === "login" ? "Sign in" : mode === "forgot" ? "Reset your password" : "Choose a new password"}
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
          {mode === "register" ? "Create your profile" : mode === "login" ? "Welcome back" : mode === "forgot" ? "Forgot your password?" : "Reset your password"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "register"
            ? "Tell us a little about yourself to unlock personalized matches."
            : mode === "login"
              ? "Sign in to continue your scholarship journey."
              : mode === "forgot"
                ? "Enter your account email and we’ll send you a secure reset link."
                : "Choose a new password to complete your account recovery."}
        </p>

        {mode !== "forgot" && mode !== "reset" && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
            {import.meta.env.VITE_API_URL
              ? "Account and profile data are stored on the ScholarPath server. Do not enter sensitive information."
              : "Account and profile data stay in this browser only and are not synced across devices. Do not enter sensitive information."}
          </p>
        )}

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

          {(mode === "register" || mode === "login") && (
            <label className="block text-sm font-bold text-slate-700">
              Username
              <input
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder={mode === "register" ? "Pick a username" : "Your username"}
              />
            </label>
          )}

          {(mode === "register" || mode === "forgot") && (
            <label className="block text-sm font-bold text-slate-700">
              Email address
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder={mode === "register" ? "you@example.com" : "Account email address"}
              />
            </label>
          )}

          {(mode === "register" || mode === "login" || mode === "reset") && (
            <label className="block text-sm font-bold text-slate-700">
              {mode === "reset" ? "New password" : "Password"}
              <input
                name="password"
                required
                minLength={mode === "register" || mode === "reset" ? 12 : undefined}
                type="password"
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder={mode === "login" ? "Your password" : "At least 12 characters"}
              />
            </label>
          )}

          {mode === "reset" && (
            <label className="block text-sm font-bold text-slate-700">
              Confirm new password
              <input
                name="confirmPassword"
                required
                minLength={12}
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                placeholder="Enter the new password again"
              />
            </label>
          )}

          {(error || errorMessage) && (
            <p className="text-sm font-medium text-[#cf334a]">{error || errorMessage}</p>
          )}

          <button className="w-full rounded-xl bg-[#0878c9] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#066ab2]">
            {mode === "register" ? "Create free account" : mode === "login" ? "Sign in" : mode === "forgot" ? "Send reset link" : "Reset password"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              className="w-full text-sm font-bold text-[#0878c9] transition hover:text-[#066ab2]"
              onClick={() => {
                setError("");
                setForm((current) => ({ ...current, password: "" }));
                onModeChange("forgot");
              }}
            >
              Forgot password?
            </button>
          )}
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
  keywords: readonly string[];
};

function EligibilityCriteria({
  assessment,
}: {
  assessment: ReturnType<typeof getEligibilityAssessment>;
}) {
  const groups = [
    { label: "Criteria supported by your profile", items: assessment.met, color: "text-emerald-700" },
    { label: "Needs confirmation", items: assessment.unknown, color: "text-amber-800" },
    { label: "May disqualify", items: assessment.mayDisqualify, color: "text-red-700" },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="text-sm font-extrabold text-[#07345e]">Eligibility check</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Profile fit is not an eligibility decision. Confirm every requirement with the provider.</p>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className={`text-xs font-extrabold ${group.color}`}>{group.label}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-5 text-slate-600">
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (apiUrl) {
    const response = await fetch(`${apiUrl}/api${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message ?? "The request could not be completed.");
    return result;
  }

  if (path.startsWith("/password-reset/")) {
    throw new Error("Password reset requires a connected account API and email delivery service.");
  }
  return demoApiRequest(path, options);
}

const scholarshipPool = [
  {
    title: "The Gates Scholarship",
    type: "Scholarship" as const,
    amount: "Full cost of attendance",
    description: "A highly selective scholarship that covers the cost of education for exceptional students with outstanding academic achievement and leadership potential.",
    forWho: "High school seniors with strong academics and leadership who meet the program's eligible U.S. citizenship or immigration-status requirements and qualify for a Federal Pell Grant.",
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
    forWho: "High school seniors with a minimum 2.4 GPA who qualify for a Federal Pell Grant and plan to attend an eligible four-year public college or university in Texas.",
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
    forWho: "High school seniors with at least a 3.0 unweighted GPA who meet the program's eligible U.S. citizenship or immigration-status requirements and demonstrate leadership and service.",
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
  {
    title: "Jack Kent Cooke College Scholarship",
    type: "Scholarship" as const,
    amount: "Up to $55,000 per year",
    description: "A college scholarship program supporting high-achieving students with financial need.",
    forWho: "High school seniors with at least a 3.75 cumulative unweighted GPA, financial need, and plans to attend an accredited four-year college; families with annual gross income up to $95,000 may be considered.",
    process: "Review current eligibility and apply through the Jack Kent Cooke Foundation's official scholarship portal.",
    deadline: "Annual cycle",
    link: "https://www.jkcf.org/our-scholarships/college-scholarship-program/",
    source: "Jack Kent Cooke Foundation",
    keywords: ["academic", "gpa", "merit", "need", "first-generation", "college"],
  },
  {
    title: "Elks Most Valuable Student Scholarship",
    type: "Scholarship" as const,
    amount: "Varies by award",
    description: "A national scholarship competition recognizing service, leadership, and academic achievement.",
    forWho: "Current high school seniors who are U.S. citizens and plan to enroll full-time in an accredited four-year U.S. undergraduate program; selection considers academics, leadership, community service, and financial need.",
    process: "Check current rules and submit the online application through the Elks National Foundation.",
    deadline: "Annual cycle",
    link: "https://www.elks.org/scholars/scholarships/MVS.cfm",
    source: "Elks National Foundation",
    keywords: ["leadership", "service", "community", "volunteer", "academic", "gpa"],
  },
  {
    title: "Amazon Future Engineer Scholarship",
    type: "Scholarship" as const,
    amount: "Varies by award",
    description: "Scholarship support and career opportunities for students pursuing computer science and related fields.",
    forWho: "High school seniors interested in computer science, engineering, and technology careers.",
    process: "Review the current program requirements and apply through the Amazon Future Engineer site.",
    deadline: "Annual cycle",
    link: "https://www.amazonfutureengineer.com/scholarships",
    source: "Amazon Future Engineer",
    keywords: ["computer", "science", "engineering", "technology", "stem", "academic"],
  },
  {
    title: "NIH Undergraduate Scholarship Program",
    type: "Scholarship" as const,
    amount: "Funding varies by approved educational costs",
    description: "A federal program that supports undergraduate students pursuing biomedical, behavioral, and clinical research careers.",
    forWho: "Undergraduate students in biomedical, behavioral, or clinical research fields who have financial need and academic potential.",
    process: "Review current eligibility requirements and apply through the NIH Undergraduate Scholarship Program portal.",
    deadline: "Annual cycle",
    link: "https://www.training.nih.gov/ugsp/",
    source: "National Institutes of Health",
    keywords: ["biomedical", "biology", "medical", "medicine", "health", "research", "science", "stem", "undergraduate", "clinical"],
  },
  {
    title: "Amgen Scholars",
    type: "Scholarship" as const,
    amount: "Research stipend and program support",
    description: "A competitive summer research program that supports students pursuing biomedical sciences and related research fields.",
    forWho: "Undergraduate students interested in biomedical research, laboratory science, and related STEM careers.",
    process: "Apply through the Amgen Scholars program and complete the current application, transcript, and research-interest requirements.",
    deadline: "Program-specific",
    link: "https://amgenscholars.com/",
    source: "Amgen Scholars",
    keywords: ["biomedical", "biology", "medicine", "research", "science", "lab", "stem", "health"],
  },
  {
    title: "HOSA Future Health Professionals Scholarships",
    type: "Scholarship" as const,
    amount: "Varies by scholarship",
    description: "Scholarships for students preparing for careers in health professions, healthcare leadership, and public health.",
    forWho: "Students pursuing health professions, healthcare, nursing, public health, and related career pathways.",
    process: "Review the current HOSA scholarship opportunities and apply through the HOSA Future Health Professionals platform.",
    deadline: "Annual cycle",
    link: "https://hosa.org/",
    source: "HOSA Future Health Professionals",
    keywords: ["health", "healthcare", "nursing", "medicine", "public health", "biomedical", "clinical", "professional"],
  },
  {
    title: "National Health Service Corps Scholarship",
    type: "Scholarship" as const,
    amount: "Tuition, fees, and additional support may be covered",
    description: "A federal scholarship program for eligible students in health professions who commit to serving in underserved communities.",
    forWho: "Students pursuing qualifying health professions who are willing to complete service in an underserved area.",
    process: "Check current program eligibility and apply through the National Health Service Corps scholarship portal.",
    deadline: "Annual cycle",
    link: "https://nhsc.hrsa.gov/scholarships",
    source: "Health Resources and Services Administration",
    keywords: ["health", "medicine", "healthcare", "nursing", "public health", "clinical", "service", "underserved"],
  },
  {
    title: "Burger King Scholars Program",
    type: "Scholarship" as const,
    amount: "Varies by award",
    description: "Scholarships recognizing academic achievement, work experience, and community involvement.",
    forWho: "High school seniors with academic, work, or community service achievements who meet current program criteria.",
    process: "Check the current eligibility rules and complete the application on the Burger King Scholars portal.",
    deadline: "Annual cycle",
    link: "https://bk-scholars.com/",
    source: "Burger King Foundation",
    keywords: ["academic", "gpa", "work", "leadership", "community", "service"],
  },
  {
    title: "Regeneron Science Talent Search",
    type: "Scholarship" as const,
    amount: "Awards vary",
    description: "A science and mathematics research competition for high school seniors.",
    forWho: "High school seniors completing original research in science, technology, engineering, or mathematics.",
    process: "Review current research and eligibility requirements, then submit an original research project through the Society for Science.",
    deadline: "Annual cycle",
    link: "https://www.societyforscience.org/regeneron-sts/",
    source: "Society for Science",
    keywords: ["research", "science", "math", "engineering", "technology", "stem", "academic"],
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
  {
    title: "CSS Profile Institutional Aid",
    type: "Financial aid" as const,
    amount: "Varies by college",
    description: "An application used by participating colleges to award institutional grants and scholarships.",
    forWho: "Students applying to colleges that require or accept the CSS Profile for institutional aid consideration.",
    process: "Check each college's requirements, then complete the CSS Profile through College Board.",
    deadline: "College-specific",
    link: "https://cssprofile.collegeboard.org/",
    source: "College Board",
    keywords: ["college", "institutional", "need", "financial", "aid", "grant"],
  },
  {
    title: "AmeriCorps Segal Education Award",
    type: "Financial aid" as const,
    amount: "Award amount varies by service term",
    description: "An education award that eligible AmeriCorps members can use toward qualified education costs or loans.",
    forWho: "People completing an eligible AmeriCorps term of service.",
    process: "Explore service programs and confirm current award rules through AmeriCorps.",
    deadline: "Program-specific",
    link: "https://americorps.gov/members-volunteers/segal-americorps-education-award",
    source: "AmeriCorps",
    keywords: ["service", "volunteer", "community", "education", "college", "award"],
  },
  {
    title: "Federal Direct PLUS Loans",
    type: "Financial aid" as const,
    amount: "Based on eligible education costs",
    description: "Federal loans for eligible graduate students and parents of dependent undergraduate students; loans must be repaid.",
    forWho: "Graduate or professional students and parents of dependent undergraduate students who meet current requirements.",
    process: "Compare borrowing options and current terms at StudentAid.gov before applying.",
    deadline: "School-specific",
    link: "https://studentaid.gov/understand-aid/types/loans/plus",
    source: "Federal Student Aid",
    keywords: ["graduate", "parent", "loan", "college", "financial", "aid", "federal"],
  },
  {
    title: "Education Tax Credits",
    type: "Financial aid" as const,
    amount: "Depends on tax eligibility",
    description: "Tax credits that may help eligible students or families offset qualifying higher-education costs.",
    forWho: "Eligible taxpayers paying qualifying college expenses; income and enrollment rules apply.",
    process: "Review current IRS rules or consult a qualified tax professional before claiming a credit.",
    deadline: "Tax-filing cycle",
    link: "https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-and-llc",
    source: "Internal Revenue Service",
    keywords: ["tax", "college", "education", "financial", "cost", "aid"],
  },
  {
    title: "Teacher Loan Forgiveness",
    type: "Financial aid" as const,
    amount: "Up to $17,500 for eligible borrowers",
    description: "A federal benefit that may forgive part of eligible student loans after qualifying teaching service.",
    forWho: "Eligible teachers who meet service, school, and loan requirements.",
    process: "Review current federal requirements and submit the application through your loan servicer.",
    deadline: "After qualifying service",
    link: "https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher",
    source: "Federal Student Aid",
    keywords: ["teacher", "teaching", "education", "loan", "forgiveness", "financial", "aid"],
  },
] as const;

export default function App() {
  const [modal, setModal] = useState<"register" | "login" | "forgot" | "reset" | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [expandedMatchTitle, setExpandedMatchTitle] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    {
      role: "bot",
      text: "Hi! I’m ScholarBot. Ask me how ScholarPath works, how to use it, or how to improve your profile.",
    },
  ]);
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "newsletter" | "scholarships" | "financialAid" | "roadmap">("profile");
  const [newsletters, setNewsletters] = useState<Array<{ id: number; title: string; summary: string; category: string; created_at: string; created_by: string }>>([]);
  const [adminNewsletters, setAdminNewsletters] = useState<any[]>([]);
  const [roadmapProfile, setRoadmapProfile] = useState<RoadmapProfile>(roadmapProfileDefaults);
  const [roadmapTaskStatuses, setRoadmapTaskStatuses] = useState<Partial<Record<string, RoadmapTaskStatus>>>({});
  const [savedScholarships, setSavedScholarships] = useState<
    Array<{
      id: string;
      title: string;
      amount: string;
      deadline: string;
      link: string;
      status: "Interested" | "Preparing Application" | "Ready to Submit" | "Submitted" | "Awarded" | "Not Selected";
      notes: string;
    }>
  >([]);
  const [roadmapSearch, setRoadmapSearch] = useState("");
  const [fundingEstimator, setFundingEstimator] = useState({
    tuitionAndFees: "",
    housingFood: "",
    otherExpenses: "",
    grants: "",
    scholarships: "",
    otherAssistance: "",
  });
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

    const token =
      new URLSearchParams(window.location.hash.slice(1)).get("resetToken") ??
      new URLSearchParams(window.location.search).get("resetToken");
    if (token) {
      setResetToken(token);
      setModal("reset");
    }

    apiRequest("/me")
      .then((response) => {
        const user = response.user;
        setCurrentUser(user);
        setActiveTab("profile");
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

  async function handleRegister({ fullName, username, email, password }: { fullName: string; username: string; email: string; password: string }) {
    try {
      await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          username,
          email,
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
      setActiveTab("profile");
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

  async function handleForgotPassword(email: string) {
    try {
      await apiRequest("/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setAuthError("");
      setStatusMessage("If an account exists for that email, a password reset link is on its way.");
      setModal("login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to request a password reset.");
    }
  }

  async function handleResetPassword(token: string, password: string) {
    try {
      await apiRequest("/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setAuthError("");
      setStatusMessage("Your password has been reset. Sign in with your new password.");
      setResetToken("");
      window.history.replaceState({}, "", window.location.pathname);
      setModal("login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to reset your password.");
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
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        confetti({
          particleCount: 72,
          spread: 68,
          startVelocity: 38,
          origin: { y: 0.65 },
          colors: ["#0878c9", "#ffffff", "#cf334a"],
        });
      }
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

  function handleRoadmapChange(field: keyof RoadmapProfile, value: string) {
    setRoadmapProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSaveScholarship(opportunity: Opportunity) {
    setSavedScholarships((current) => {
      const existing = current.find((item) => item.title === opportunity.title);
      if (existing) {
        return current.filter((item) => item.title !== opportunity.title);
      }

      return [
        {
          id: opportunity.title,
          title: opportunity.title,
          amount: opportunity.amount,
          deadline: opportunity.deadline,
          link: opportunity.link,
          status: "Interested",
          notes: "",
        },
        ...current,
      ];
    });
  }

  function updateSavedScholarshipStatus(title: string, status: string) {
    setSavedScholarships((current) =>
      current.map((item) => (item.title === title ? { ...item, status: status as any } : item)),
    );
  }

  function updateSavedScholarshipNotes(title: string, notes: string) {
    setSavedScholarships((current) =>
      current.map((item) => (item.title === title ? { ...item, notes } : item)),
    );
  }

  function updateRoadmapTaskStatus(taskId: string, nextStatus: RoadmapTaskStatus) {
    setRoadmapTaskStatuses((current) => ({
      ...current,
      [taskId]: nextStatus,
    }));
  }

  const recommendations = useMemo(
    () =>
      getProfileRecommendations(draftProfile, scholarshipPool, financialAidPool).map((item) => ({
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
        keywords: item.keywords,
      })),
    [draftProfile],
  );

  const scholarshipRecommendations = recommendations.filter((item) => item.type === "Scholarship");
  const financialAidRecommendations = recommendations.filter((item) => item.type === "Financial aid");
  const roadmapTasks = useMemo(() => buildRoadmapTasks(roadmapProfile, roadmapTaskStatuses), [roadmapProfile, roadmapTaskStatuses]);
  const nextBestStep = useMemo(() => getNextBestStep(roadmapProfile, roadmapTasks), [roadmapProfile, roadmapTasks]);
  const roadmapCompletion = roadmapTasks.length
    ? Math.round((roadmapTasks.filter((task) => task.status === "Completed").length / roadmapTasks.length) * 100)
    : 0;
  const estimator = useMemo(() => calculateEstimatedFundingGap(fundingEstimator), [fundingEstimator]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("scholarpath_roadmap_profile_v1", JSON.stringify(roadmapProfile));
    window.localStorage.setItem("scholarpath_roadmap_tasks_v1", JSON.stringify(roadmapTaskStatuses));
    window.localStorage.setItem("scholarpath_saved_scholarships_v1", JSON.stringify(savedScholarships));
    window.localStorage.setItem("scholarpath_estimator_v1", JSON.stringify(fundingEstimator));
  }, [roadmapProfile, roadmapTaskStatuses, savedScholarships, fundingEstimator]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedRoadmapProfile = window.localStorage.getItem("scholarpath_roadmap_profile_v1");
      const storedTasks = window.localStorage.getItem("scholarpath_roadmap_tasks_v1");
      const storedScholarships = window.localStorage.getItem("scholarpath_saved_scholarships_v1");
      const storedEstimator = window.localStorage.getItem("scholarpath_estimator_v1");

      if (storedRoadmapProfile) {
        setRoadmapProfile({ ...roadmapProfileDefaults, ...JSON.parse(storedRoadmapProfile) });
      }
      if (storedTasks) {
        setRoadmapTaskStatuses(JSON.parse(storedTasks));
      }
      if (storedScholarships) {
        setSavedScholarships(JSON.parse(storedScholarships));
      }
      if (storedEstimator) {
        setFundingEstimator({ ...fundingEstimator, ...JSON.parse(storedEstimator) });
      }
    } catch {
      // Ignore invalid localStorage values and fall back to default state.
    }
  }, []);

  function getScholarBotResponse(input: string) {
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
      return "Hi! I’m ScholarBot, your ScholarPath guide. Ask me anything about how to use the app or how to improve your scholarship profile.";
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

    const reply = getScholarBotResponse(text);
    setChatMessages((current) => [...current, { role: "bot", text: reply }]);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="ScholarPath home">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-md shadow-blue-200">
              <img src="/scholarpath-logo.png" alt="" className="h-full w-full object-contain" />
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
            {!currentUser && (
              <a className="transition hover:text-[#0878c9]" href="#funding-roadmap">
                Funding roadmap
              </a>
            )}
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
              <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0878c9]">
                      {selectedOpportunity.type}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      {selectedOpportunity.match}% profile fit
                    </span>
                  </div>
                  <button
                    aria-label="Close opportunity"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                    onClick={() => setSelectedOpportunity(null)}
                  >
                    <Icon className="h-4 w-4">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </Icon>
                  </button>
                </div>

                <h3 className="mt-4 text-2xl font-black tracking-tight text-[#07345e]">
                  {selectedOpportunity.title}
                </h3>
                <p className="mt-2 text-lg font-extrabold text-[#cf334a]">{selectedOpportunity.amount}</p>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-slate-400">
                  {selectedOpportunity.deadline}
                </p>

                <div className="mt-5 space-y-4 text-slate-600">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      Overview
                    </p>
                    <p className="mt-2 leading-6">{selectedOpportunity.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      Who it is for
                    </p>
                    <p className="mt-2 leading-6">{selectedOpportunity.forWho}</p>
                  </div>
                  <EligibilityCriteria assessment={getEligibilityAssessment(draftProfile, selectedOpportunity)} />
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#07345e]">
                      How to apply
                    </p>
                    <p className="mt-2 leading-6">{selectedOpportunity.process}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
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
                  className={`rounded-full px-4 py-2 text-sm font-extrabold ${activeTab === "roadmap" ? "bg-[#0878c9] text-white" : "bg-white text-[#07345e]"}`}
                  onClick={() => setActiveTab("roadmap")}
                >
                  Funding Roadmap
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
                      <p className="text-sm text-blue-100">Unweighted GPA / 4.0</p>
                      <p className="mt-2 text-3xl font-black">{draftProfile.gpa ? `${draftProfile.gpa} / 4.0` : "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">AP courses</p>
                      <p className="mt-2 text-3xl font-black">{draftProfile.apCount || "—"}</p>
                    </div>
                    {Number(draftProfile.apCount) > 0 && (
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-sm text-blue-100">AP exams scored 3+</p>
                        <p className="mt-2 text-2xl font-black">{draftProfile.apTests3Plus || "Not entered"}</p>
                      </div>
                    )}
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">Location</p>
                      <p className="mt-2 text-lg font-bold">
                        {draftProfile.isInUS === "yes" ? draftProfile.state || "U.S. state not set" : draftProfile.isInUS === "no" ? "Outside the U.S." : "Not set"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-sm text-blue-100">Leadership and activities</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-bold">{draftProfile.leadershipActivities || "Not added"}</p>
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
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Are you currently in the United States?
                        <select
                          value={draftProfile.isInUS}
                          onChange={(event) => handleProfileChange("isInUS", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select or skip</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>

                      {draftProfile.isInUS === "yes" && (
                        <label className="block text-sm font-bold text-slate-700">
                          State
                          <input
                            list="scholarpath-us-states"
                            value={draftProfile.state}
                            onChange={(event) => handleProfileChange("state", event.target.value)}
                            autoComplete="address-level1"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                            placeholder="Type or choose a state"
                          />
                          <datalist id="scholarpath-us-states">
                            {usStates.map((state) => <option key={state} value={state} />)}
                          </datalist>
                        </label>
                      )}

                      <label className="block text-sm font-bold text-slate-700">
                        Citizenship / immigration status <span className="font-normal text-slate-400">(optional)</span>
                        <select
                          value={draftProfile.citizenshipStatus}
                          onChange={(event) => handleProfileChange("citizenshipStatus", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select or skip</option>
                          <option value="us-citizen">U.S. citizen</option>
                          <option value="permanent-resident">Permanent resident (green card)</option>
                          <option value="eligible-noncitizen">Other eligible noncitizen status</option>
                          <option value="other-status">Another status</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Annual family income <span className="font-normal text-slate-400">(optional range)</span>
                        <select
                          value={draftProfile.familyIncomeRange}
                          onChange={(event) => handleProfileChange("familyIncomeRange", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select or skip</option>
                          <option value="under-50000">Under $50,000</option>
                          <option value="50000-74999">$50,000–$74,999</option>
                          <option value="75000-95000">$75,000–$95,000</option>
                          <option value="over-95000">Over $95,000</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">A range is optional. It can flag stated income considerations but does not determine financial need or Pell Grant eligibility.</span>
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
                        Current Grade Level
                        <select
                          value={draftProfile.grade ?? ""}
                          onChange={(event) => handleProfileChange("grade", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="">Select your grade</option>
                          <option value="9">9th Grade (Freshman)</option>
                          <option value="10">10th Grade (Sophomore)</option>
                          <option value="11">11th Grade (Junior)</option>
                          <option value="12">12th Grade (Senior)</option>
                        </select>
                      </label>

                      <label className="block text-sm font-bold text-slate-700">
                        Unweighted GPA (4.0 scale)
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
                        Number of AP classes taken
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

                      {Number(draftProfile.apCount) > 0 && (
                        <label className="block text-sm font-bold text-slate-700">
                          How many AP exams did you score 3 or higher on?
                          <input
                            type="number"
                            min="0"
                            max={draftProfile.apCount}
                            value={draftProfile.apTests3Plus}
                            onChange={(event) => handleProfileChange("apTests3Plus", event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                            placeholder="0"
                          />
                        </label>
                      )}

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
                        Leadership and activities
                        <textarea
                          rows={4}
                          value={draftProfile.leadershipActivities ?? ""}
                          onChange={(event) => handleProfileChange("leadershipActivities", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-[#0878c9] focus:ring-4 focus:ring-blue-50"
                          placeholder="Clubs, leadership roles, volunteering, sports, work, or other activities"
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
                  <p className="mt-2 text-sm text-slate-500">Preliminary estimates based on your academic profile and our catalog. Confirm eligibility and deadlines with each provider.</p>
                </div>
                <button type="button" onClick={() => setActiveTab("profile")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#07345e]">
                  Back to profile
                </button>
              </div>

              <div className="space-y-4">
                {scholarshipRecommendations.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Add your GPA, AP count, intended major, or interests in your profile to see relevant matches.</p>
                ) : scholarshipRecommendations.map((item) => {
                    const reasons = getRecommendationReasons(draftProfile, item);
                  const eligibility = getEligibilityAssessment(draftProfile, item);
                    const isExpanded = expandedMatchTitle === item.title;

                    return (
                      <article key={item.title} className="rounded-[1.5rem] border border-blue-100 bg-[#f9fbff] p-4 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedOpportunity(item)}
                          className="w-full text-left"
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
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedMatchTitle(isExpanded ? null : item.title)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-[#07345e] transition hover:border-[#0878c9] hover:text-[#0878c9]"
                          >
                            <span aria-hidden="true">🔎</span>
                            {isExpanded ? "Hide match and eligibility" : "Why this match?"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveScholarship(item)}
                            className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold transition ${savedScholarships.some((saved) => saved.title === item.title) ? "bg-emerald-100 text-emerald-700" : "bg-[#0878c9] text-white hover:bg-[#066ab2]"}`}
                          >
                            {savedScholarships.some((saved) => saved.title === item.title) ? "Saved to tracker" : "Save to tracker"}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-white p-4" aria-live="polite">
                            <p className="text-sm font-extrabold text-[#07345e]">Why this match?</p>
                            {reasons.length ? (
                              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                                {reasons.map((reason) => (
                                  <li key={reason.label}><span className="font-bold text-slate-700">{reason.label}:</span> {reason.detail}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm leading-6 text-slate-600">This opportunity is included as a broad option in the catalog. Add your intended major or interests to see a more specific explanation.</p>
                            )}
                            <EligibilityCriteria assessment={eligibility} />
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            </section>
          ) : activeTab === "financialAid" ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Financial aid</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Support options for you</h2>
                  <p className="mt-2 text-sm text-slate-500">Preliminary estimates based on your academic profile and our catalog. Confirm eligibility and deadlines with each provider.</p>
                </div>
                <button type="button" onClick={() => setActiveTab("profile")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#07345e]">
                  Back to profile
                </button>
              </div>

              <div className="space-y-4">
                {financialAidRecommendations.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Add your GPA, AP count, intended major, or interests in your profile to see relevant options.</p>
                ) : financialAidRecommendations.map((item) => {
                    const eligibility = getEligibilityAssessment(draftProfile, item);
                    const isExpanded = expandedMatchTitle === item.title;

                    return (
                      <article key={item.title} className="rounded-[1.5rem] border border-red-100 bg-[#fff9f9] p-4 shadow-sm">
                        <button type="button" onClick={() => setSelectedOpportunity(item)} className="w-full text-left">
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
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedMatchTitle(isExpanded ? null : item.title)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-[#07345e] transition hover:border-[#cf334a] hover:text-[#cf334a]"
                        >
                          {isExpanded ? "Hide eligibility check" : "Check eligibility"}
                        </button>
                        {isExpanded && <EligibilityCriteria assessment={eligibility} />}
                      </article>
                    );
                  })}
              </div>
            </section>
          ) : activeTab === "roadmap" ? (
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-blue-100 bg-[#f5fbff] p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Funding roadmap</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[#07345e]">Three simple steps to pay for college</h2>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-right shadow-sm">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Progress</div>
                    <div className="mt-1 text-2xl font-black text-[#07345e]">{roadmapCompletion}%</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {[
                    {
                      title: "1. Build your profile",
                      text: "Tell us your school, goals, and major so the roadmap fits your real situation.",
                      accent: "bg-[#0878c9]",
                    },
                    {
                      title: "2. Explore funding",
                      text: "See scholarships and aid that match your profile, interests, and timeline.",
                      accent: "bg-[#cf334a]",
                    },
                    {
                      title: "3. Track progress",
                      text: "Keep applications, deadlines, and next steps in one easy place.",
                      accent: "bg-[#0878c9]",
                    },
                  ].map((step) => (
                    <div key={step.title} className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-sm">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${step.accent} text-sm font-black text-white`}>
                        {step.title.split(".")[0]}
                      </span>
                      <h3 className="mt-4 text-xl font-black text-[#07345e]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>

                {nextBestStep ? (
                  <div className="mt-6 rounded-[1.5rem] border border-blue-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">Next best step</span>
                    </div>
                    <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-black text-[#07345e]">{nextBestStep.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{nextBestStep.explanation}</p>
                        <div className="mt-3 rounded-xl bg-[#f8fbff] p-3 text-sm leading-6 text-slate-600">
                          <span className="font-bold text-[#07345e]">Why this comes first:</span> {nextBestStep.why}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateRoadmapTaskStatus(nextBestStep.id, "In Progress")}
                          className="rounded-xl bg-[#0878c9] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#066ab2]"
                        >
                          Start this
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRoadmapTaskStatus(nextBestStep.id, "Completed")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-[#07345e] hover:border-blue-200 hover:bg-blue-50"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                    Nice work — your plan is complete. Revisit it whenever your goals or deadlines change.
                  </div>
                )}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Quick setup</p>
                      <h3 className="mt-2 text-2xl font-black text-[#07345e]">A few details to personalize your plan</h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">1 minute</span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      Grade level
                      <select value={roadmapProfile.gradeLevel} onChange={(event) => handleRoadmapChange("gradeLevel", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none">
                        <option value="">Select</option>
                        <option value="9">9th grade</option>
                        <option value="10">10th grade</option>
                        <option value="11">11th grade</option>
                        <option value="12">12th grade</option>
                        <option value="graduated">Already graduated</option>
                      </select>
                    </label>

                    <label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      School or college
                      <input value={roadmapProfile.school} onChange={(event) => handleRoadmapChange("school", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none" placeholder="School name" />
                    </label>

                    <label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 md:col-span-2">
                      Major or career goal
                      <input value={roadmapProfile.major} onChange={(event) => handleRoadmapChange("major", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none" placeholder="Computer science, nursing, business..." />
                    </label>
                  </div>

                  <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Your answers help us suggest the right next step without overwhelming you with all the details at once.
                  </p>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Saved opportunities</p>
                      <h3 className="mt-2 text-2xl font-black text-[#07345e]">Your application tracker</h3>
                    </div>
                    <span className="rounded-full bg-[#eff8ff] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">
                      {savedScholarships.length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {savedScholarships.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Save scholarships you like and we’ll keep the next steps easy to track.
                      </div>
                    ) : (
                      savedScholarships.slice(0, 3).map((scholarship) => (
                        <article key={scholarship.id} className="rounded-[1.2rem] border border-slate-200 bg-[#f9fbff] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-[#07345e]">{scholarship.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{scholarship.amount || "Amount not listed"} • {scholarship.deadline || "Check deadline"}</p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0878c9]">
                              {scholarship.status}
                            </span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(5,52,94,0.08)] sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Next actions</p>
                    <h3 className="mt-2 text-2xl font-black text-[#07345e]">What to do next</h3>
                  </div>
                  <span className="rounded-full bg-[#eff8ff] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0878c9]">Focus</span>
                </div>

                <div className="mt-5 space-y-3">
                  {roadmapTasks.slice(0, 3).map((task) => (
                    <article key={task.id} className="rounded-[1.25rem] border border-blue-100 bg-[#f9fbff] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#0878c9]" />
                            <p className="text-base font-extrabold text-[#07345e]">{task.title}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{task.explanation}</p>
                        </div>
                        <select value={task.status} onChange={(event) => updateRoadmapTaskStatus(task.id, event.target.value as RoadmapTaskStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07345e] outline-none">
                          <option>Not Started</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
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
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-7 py-4 font-extrabold text-[#b7283f] transition hover:border-red-300 hover:bg-red-50"
                    href="#funding-roadmap"
                  >
                    Explore the funding roadmap
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
                  {["Completely free", "Scholarships + financial aid", "No hidden fees—ever"].map((item) => (
                    <span className="flex items-center gap-2" key={item}>
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
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
                <div className="absolute -right-4 -top-5 h-24 w-24 rounded-[1.5rem] bg-sky-100/90" />
                <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full border-[18px] border-blue-200" />
                <div className="relative overflow-hidden rounded-[2.2rem] border-[7px] border-white bg-white shadow-2xl shadow-blue-900/15">
                  <img
                    src={heroImage}
                    alt="College students collaborating around a laptop"
                    className="hero-photo h-[420px] w-full object-cover sm:h-[510px]"
                  />
                  <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
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
                <div className="absolute -right-3 bottom-24 z-10 rounded-2xl border border-blue-100 bg-white px-4 py-2 shadow-xl sm:-right-7">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#d83a4a]">Meet ScholarBot</p>
                    <p className="text-sm font-bold text-[#07345e]">Your free aid buddy</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="funding-roadmap" className="border-y border-blue-100 bg-[#eff8ff]">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
              <div className="max-w-3xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#cf334a]">Funding roadmap</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#07345e] sm:text-4xl">
                  A clear path from planning to paying for college
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Get oriented, find funding that fits, and keep the next steps in view. Sign in for a personalized checklist, application tracker, and cost estimate.
                </p>
              </div>
              <ol className="mt-10 grid gap-x-8 gap-y-7 border-t border-blue-200 pt-7 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["01", "Understand your costs", "Estimate tuition, housing, and other expenses."],
                  ["02", "Plan for financial aid", "Review FAFSA steps and school deadlines."],
                  ["03", "Find scholarships", "Focus on opportunities that match your goals."],
                  ["04", "Track your progress", "Keep applications, follow-ups, and next steps together."],
                ].map(([number, title, description]) => (
                  <li key={number}>
                    <span className="text-sm font-extrabold text-[#cf334a]">{number}</span>
                    <h3 className="mt-2 text-lg font-extrabold text-[#07345e]">{title}</h3>
                    <p className="mt-2 leading-6 text-slate-600">{description}</p>
                  </li>
                ))}
              </ol>
              <button
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#07345e] px-6 py-3.5 font-extrabold text-white transition hover:bg-[#052c4a]"
                onClick={() => {
                  if (currentUser) {
                    setActiveTab("roadmap");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    setAuthError("");
                    setModal("register");
                  }
                }}
              >
                {currentUser ? "Open my funding roadmap" : "Build my funding roadmap"}
              </button>
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
                  text: "Track progress, understand financial aid, and ask ScholarBot for help whenever you need it.",
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
                <article className="grid overflow-hidden rounded-[1.75rem] bg-[#eff8ff] sm:h-[510px] sm:grid-cols-[.8fr_1.2fr]" key={story.name}>
                  <img className="h-64 w-full object-cover sm:h-[510px]" src={story.image} alt="" />
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
                <p className="mt-1 text-sm text-slate-500">Your free ScholarBot buddy</p>
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
          aria-label="Toggle ScholarBot AI helper"
        >
          <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 18 3 21V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7Z" />
            <path d="M8 9h8M8 13h6" />
          </svg>
          Ask ScholarBot
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
          onModeChange={setModal}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
          resetToken={resetToken}
          errorMessage={authError}
          helperMessage={statusMessage}
        />
      )}
    </div>
  );
}
