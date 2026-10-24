export type GradeLevel = "9" | "10" | "11" | "12" | "graduated" | "";
export type ApplicationStatus = "exploring" | "preparing" | "applying" | "accepted" | "";
export type FAFSAStatus = "not started" | "in progress" | "submitted" | "unsure" | "";
export type RoadmapTaskStatus = "Not Started" | "In Progress" | "Completed";

export type RoadmapProfile = {
  gradeLevel: GradeLevel;
  intendedEnrollment: string;
  school: string;
  major: string;
  applicationStatus: ApplicationStatus;
  fafsaStatus: FAFSAStatus;
  preferredState: string;
  scholarshipPreferences: string;
};

export type RoadmapTask = {
  id: string;
  title: string;
  explanation: string;
  why: string;
  nextAction: string;
  resource: string;
  resourceLabel: string;
  deadline: string;
  status: RoadmapTaskStatus;
  priority: number;
};

export type LearningGuide = {
  id: string;
  title: string;
  summary: string;
  whatThisMeans: string;
  nextSteps: string[];
  sources: Array<{ label: string; href: string }>;
  lastReviewed: string;
};

export const roadmapProfileDefaults: RoadmapProfile = {
  gradeLevel: "",
  intendedEnrollment: "",
  school: "",
  major: "",
  applicationStatus: "",
  fafsaStatus: "",
  preferredState: "",
  scholarshipPreferences: "",
};

const officialResources = {
  fafsa: "https://studentaid.gov/h/apply-for-aid/fafsa",
  fafsaSteps: "https://studentaid.gov/articles/fafsa-student-steps/",
  federalAid: "https://studentaid.gov/",
  texasHigherEd: "https://www.highered.texas.gov/",
};

const baseTasks: Array<Omit<RoadmapTask, "status"> & { relevant: (profile: RoadmapProfile) => boolean }> = [
  {
    id: "college-costs",
    title: "Explore college costs and financial aid basics",
    explanation: "Start with the total cost of attendance and the difference between sticker price and net cost so the rest of the plan makes sense.",
    why: "Understanding the real cost of college helps you compare schools and avoid surprises before you apply.",
    nextAction: "Look up each college’s cost of attendance and estimate your tuition, housing, and fees before comparing offers.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 100,
    relevant: (profile) => profile.gradeLevel !== "" && profile.gradeLevel !== "graduated",
  },
  {
    id: "aid-types",
    title: "Learn how aid types differ",
    explanation: "Grants, scholarships, work-study, and loans are not the same. Knowing the differences helps you compare offers more clearly.",
    why: "This keeps you from confusing aid that does not have to be repaid with borrowing that does.",
    nextAction: "Review a simple comparison of grants, scholarships, work-study, and loans before you rank schools or accept awards.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid aid types",
    deadline: "Check official deadline",
    priority: 92,
    relevant: (profile) => profile.gradeLevel !== "" && profile.gradeLevel !== "graduated",
  },
  {
    id: "fafsa-prep",
    title: "Prepare for FAFSA and the right application year",
    explanation: "FAFSA is the main federal application for grants, work-study, and some loans. Students typically complete the form for the academic year they plan to attend.",
    why: "This is the main application step for students preparing to apply, and getting organized early helps you avoid missed deadlines and missing documentation.",
    nextAction: "Gather the needed student and contributor information and confirm the correct FAFSA year for your enrollment plan.",
    resource: officialResources.fafsaSteps,
    resourceLabel: "FAFSA student steps",
    deadline: "Check official deadline",
    priority: 98,
    relevant: (profile) => profile.applicationStatus === "preparing" || profile.applicationStatus === "applying" || profile.fafsaStatus !== "submitted",
  },
  {
    id: "fafsa-account",
    title: "Create a StudentAid.gov account when ready",
    explanation: "A StudentAid.gov account lets you start the FAFSA, review your aid status, and manage your aid records.",
    why: "This is the first official step for students who are close to submitting the FAFSA or checking next steps.",
    nextAction: "Set up your StudentAid.gov account and keep your username and password in a safe place before filing.",
    resource: officialResources.fafsa,
    resourceLabel: "FAFSA application",
    deadline: "Check official deadline",
    priority: 90,
    relevant: (profile) => profile.fafsaStatus === "not started" || profile.fafsaStatus === "in progress" || profile.applicationStatus === "applying",
  },
  {
    id: "contributor-review",
    title: "Check whether a parent or contributor needs to complete FAFSA information",
    explanation: "Some students need a parent or other contributor to provide information on the FAFSA. This can affect filing timing and required documents.",
    why: "If a contributor is required, it can delay submission if you do not identify the need early.",
    nextAction: "Review the FAFSA instructions and determine whether a parent or other contributor must provide information for your application.",
    resource: officialResources.fafsa,
    resourceLabel: "FAFSA instructions",
    deadline: "Check official deadline",
    priority: 87,
    relevant: (profile) => profile.applicationStatus === "preparing" || profile.applicationStatus === "applying" || profile.fafsaStatus === "in progress",
  },
  {
    id: "school-deadlines",
    title: "Review state and college financial aid deadlines",
    explanation: "Each school and state has different aid deadlines, and some deadlines arrive earlier than the federal FAFSA deadline.",
    why: "Missing a priority deadline can limit institutional grants, state aid, and scholarship eligibility.",
    nextAction: "Check your state aid page and each college’s financial aid page for priority deadlines and required forms.",
    resource: officialResources.texasHigherEd,
    resourceLabel: "Texas higher education resources",
    deadline: "Check official deadline",
    priority: 86,
    relevant: (profile) => profile.applicationStatus !== "accepted" || profile.gradeLevel === "12",
  },
  {
    id: "grant-research",
    title: "Research grants and institutional aid",
    explanation: "Schools often offer institutional grants and restricted aid that are separate from FAFSA-based federal aid.",
    why: "Institutional funding can reduce your cost even if you do not qualify for the largest federal awards.",
    nextAction: "Review one college’s admissions and financial aid page for automatic scholarships, merit aid, and grant programs.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 82,
    relevant: (profile) => profile.applicationStatus === "preparing" || profile.applicationStatus === "applying" || profile.applicationStatus === "accepted",
  },
  {
    id: "scholarship-discovery",
    title: "Discover and apply for relevant scholarships",
    explanation: "Scholarships are usually best chosen by fit, deadline, and requirements rather than by the total number of applications.",
    why: "A targeted approach helps you spend time on awards that match your interests, background, and academic profile.",
    nextAction: "Review your saved matches, shortlist the best-fit scholarships, and check each application deadline and requirement list.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid scholarship overview",
    deadline: "Check official deadline",
    priority: 80,
    relevant: (profile) => profile.gradeLevel === "10" || profile.gradeLevel === "11" || profile.gradeLevel === "12" || profile.applicationStatus !== "exploring",
  },
  {
    id: "scholarship-tracking",
    title: "Track scholarship requirements and deadlines",
    explanation: "Keeping applications organized helps you avoid missing essays, transcripts, recommendations, or portal submissions.",
    why: "Tracking each requirement reduces the chance of missing an important step after you start applying.",
    nextAction: "Create a simple list of each scholarship, deadline, required materials, and your status in the application process.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 75,
    relevant: (profile) => profile.applicationStatus === "applying" || profile.applicationStatus === "accepted" || profile.gradeLevel === "12" || profile.gradeLevel === "11",
  },
  {
    id: "review-aid-offers",
    title: "Review financial aid offers after you receive them",
    explanation: "Aid packages can combine grants, scholarships, work-study, and loans with different costs and terms.",
    why: "Comparing offers helps you understand the actual net cost and avoid borrowing more than necessary.",
    nextAction: "Compare each school’s grants, scholarships, work-study, and loan amounts before accepting any aid.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 69,
    relevant: (profile) => profile.applicationStatus === "accepted" || profile.gradeLevel === "graduated",
  },
  {
    id: "compare-aid-types",
    title: "Compare grants, scholarships, work-study, and loans separately",
    explanation: "These funding sources work differently. Grants and scholarships are usually the most helpful non-repayable options, while loans must be repaid.",
    why: "Separating each aid type helps you understand what you owe, what you may receive, and what may need to be repaid later.",
    nextAction: "Read your aid offer line by line and compare grant amounts, scholarship totals, work-study, and loan offers side by side.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 66,
    relevant: (profile) => profile.applicationStatus === "accepted" || profile.fafsaStatus === "submitted",
  },
  {
    id: "contact-financial-aid",
    title: "Contact a school’s financial aid office when you need guidance",
    explanation: "Financial aid offices can explain deadlines, unique forms, and verification requirements that are specific to each campus.",
    why: "This is especially helpful when your circumstances are unusual or you need a personal explanation of your aid package.",
    nextAction: "Email or call the financial aid office with your questions after reviewing the school’s aid page and application timeline.",
    resource: officialResources.federalAid,
    resourceLabel: "Federal Student Aid",
    deadline: "Check official deadline",
    priority: 58,
    relevant: (profile) => profile.applicationStatus === "accepted" || profile.applicationStatus === "applying" || profile.fafsaStatus === "submitted",
  },
];

export const roadmapLearningGuides: LearningGuide[] = [
  {
    id: "what-is-financial-aid",
    title: "What financial aid is",
    summary: "Financial aid is money that helps pay for college or other education costs. It can come from the federal government, states, schools, and private groups.",
    whatThisMeans: "You may see money in the form of grants, scholarships, work-study, or loans, and each type works differently.",
    nextSteps: [
      "Review the main aid types before comparing college offers.",
      "Use the official FAFSA and college pages to confirm what is available.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "fafsa-explained",
    title: "FAFSA explained in plain English",
    summary: "The FAFSA is the main form used to apply for federal aid and to determine whether you may qualify for college support based on the school year you plan to attend.",
    whatThisMeans: "It is not a loan application by itself. It is a form that can help identify grants, work-study, and federal loan eligibility.",
    nextSteps: [
      "Create a StudentAid.gov account before you file.",
      "Check the correct FAFSA year before starting the form.",
    ],
    sources: [
      { label: "FAFSA student steps", href: "https://studentaid.gov/articles/fafsa-student-steps/" },
      { label: "FAFSA application", href: "https://studentaid.gov/h/apply-for-aid/fafsa" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "aid-types-guide",
    title: "Federal versus state versus institutional aid",
    summary: "Federal aid comes from the U.S. Department of Education, state aid comes from state agencies, and institutional aid comes directly from a college or university.",
    whatThisMeans: "A school can offer grant money, scholarships, and work-study opportunities that are separate from the FAFSA process and may have earlier deadlines.",
    nextSteps: [
      "Review each school’s aid page for institutional grants.",
      "Check your state aid office for state-specific deadlines.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
      { label: "Texas Higher Education Coordinating Board", href: "https://www.highered.texas.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "sai-explained",
    title: "What a Student Aid Index (SAI) is",
    summary: "The Student Aid Index is a measure used by schools to assess a student’s financial need when reviewing aid eligibility. It is not the same as an award amount.",
    whatThisMeans: "Your SAI helps schools estimate how much support you may need, but it does not guarantee a specific grant or loan amount. Actual awards depend on school cost and funding.",
    nextSteps: [
      "Use the FAFSA to check whether you need to submit information for a school review.",
      "Ask the college financial aid office to clarify if you want more detail about aid estimates.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "after-fafsa",
    title: "What to do after submitting FAFSA",
    summary: "After you submit the FAFSA, schools may ask for more information and may send you a financial aid offer once they review your file.",
    whatThisMeans: "Submitting the form is an important step, but it is not the final award decision. You still need to monitor your school account and follow up if requested.",
    nextSteps: [
      "Check your StudentAid.gov account for updates.",
      "Review your school emails and portal messages for follow-up requests.",
    ],
    sources: [
      { label: "FAFSA student steps", href: "https://studentaid.gov/articles/fafsa-student-steps/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "compare-offers",
    title: "How to review and compare aid offers",
    summary: "College aid letters often include a mix of grants, scholarships, work-study, and loans. It is easier to compare them when you look at the full cost after aid.",
    whatThisMeans: "A school with a larger sticker price may still be more affordable if its grant package is stronger. Compare the net cost, not just the tuition number.",
    nextSteps: [
      "List each school’s grant and scholarship totals.",
      "Separate loans from grants before you decide which offer is more affordable.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "scholarship-organization",
    title: "How to find scholarships and organize applications",
    summary: "Use scholarships that match your field, school, community involvement, or interests, and keep deadlines and materials organized so you can apply on time.",
    whatThisMeans: "The best scholarships are often the ones that are a strong fit for your goals and which you can complete before the deadline.",
    nextSteps: [
      "Make a spreadsheet or checklist of deadlines and requirements.",
      "Open the official application link for every scholarship you plan to apply for.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
  {
    id: "fraud-scholarships",
    title: "How to identify potentially fraudulent scholarship offers",
    summary: "Be cautious with scholarships that ask for large upfront fees, promise guaranteed awards, or request sensitive personal information before you verify the source.",
    whatThisMeans: "Official scholarship programs usually share clear eligibility criteria and public application instructions. If it feels urgent or suspicious, verify it directly.",
    nextSteps: [
      "Always use the official website and application link.",
      "Do not pay a fee for a scholarship that has not been verified.",
    ],
    sources: [
      { label: "Federal Student Aid", href: "https://studentaid.gov/" },
    ],
    lastReviewed: "2026-10-11",
  },
];

export function buildRoadmapTasks(
  profile: RoadmapProfile,
  taskStatuses: Partial<Record<string, RoadmapTaskStatus>> = {},
): RoadmapTask[] {
  return baseTasks
    .filter((task) => task.relevant(profile))
    .map((task) => ({
      ...task,
      status: taskStatuses[task.id] ?? "Not Started",
    }))
    .sort((left, right) => right.priority - left.priority);
}

export function getNextBestStep(profile: RoadmapProfile, tasks: RoadmapTask[]): RoadmapTask | null {
  const incomplete = tasks.filter((task) => task.status !== "Completed").sort((left, right) => right.priority - left.priority);

  if (profile.fafsaStatus === "not started" && (profile.applicationStatus === "preparing" || profile.applicationStatus === "applying")) {
    const fafsaTask = incomplete.find((task) => task.id === "fafsa-prep" || task.id === "fafsa-account");
    if (fafsaTask) return fafsaTask;
  }

  if (profile.applicationStatus === "exploring") {
    const introTask = incomplete.find((task) => task.id === "college-costs" || task.id === "aid-types");
    if (introTask) return introTask;
  }

  if (profile.fafsaStatus === "submitted") {
    const followUp = incomplete.find((task) => task.id === "review-aid-offers" || task.id === "compare-aid-types" || task.id === "contact-financial-aid");
    if (followUp) return followUp;
  }

  if (profile.applicationStatus === "accepted") {
    const offerTask = incomplete.find((task) => task.id === "review-aid-offers" || task.id === "compare-aid-types");
    if (offerTask) return offerTask;
  }

  return incomplete[0] ?? null;
}

export function calculateEstimatedFundingGap(input: {
  tuitionAndFees?: number | string;
  housingFood?: number | string;
  otherExpenses?: number | string;
  grants?: number | string;
  scholarships?: number | string;
  otherAssistance?: number | string;
}) {
  const parseValue = (value: number | string | undefined) => {
    if (value === undefined || value === "" || value === null) return 0;
    const number = Number(String(value).replace(/[$,\s]/g, ""));
    return Number.isFinite(number) ? number : 0;
  };

  const tuitionAndFees = parseValue(input.tuitionAndFees);
  const housingFood = parseValue(input.housingFood);
  const otherExpenses = parseValue(input.otherExpenses);
  const grants = parseValue(input.grants);
  const scholarships = parseValue(input.scholarships);
  const otherAssistance = parseValue(input.otherAssistance);

  const annualCost = tuitionAndFees + housingFood + otherExpenses;
  const remainingCost = annualCost - grants - scholarships - otherAssistance;

  const note =
    remainingCost < 0
      ? "This is a preliminary estimate only. Actual aid disbursement, cost-of-attendance rules, and school policy may change the final amount."
      : "This is a preliminary estimate only and is not an official financial-aid award calculation.";

  return {
    annualCost,
    remainingCost,
    note,
  };
}
