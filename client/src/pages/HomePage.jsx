import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaCircleCheck,
  FaClock,
  FaHeartPulse,
  FaLock,
  FaRobot,
  FaShieldHeart,
  FaStethoscope,
  FaUserDoctor,
  FaUsers,
  FaWaveSquare
} from "react-icons/fa6";

const featureCards = [
  {
    icon: FaRobot,
    title: "AI Diagnosis Assistant",
    description: "NLP-powered symptom analysis with confidence-driven triage support."
  },
  {
    icon: FaUserDoctor,
    title: "Doctor Operations",
    description: "Manage consultations, schedules, and live sessions in one workspace."
  },
  {
    icon: FaUsers,
    title: "Patient Lifecycle",
    description: "Track profiles, risk status, appointments, and care follow-ups."
  },
  {
    icon: FaChartLine,
    title: "Healthcare Analytics",
    description: "Use modern dashboards for trends, outcomes, and capacity insights."
  }
];

const reasons = [
  {
    icon: FaWaveSquare,
    title: "Designed For Clinical Speed",
    description: "Fast workflows reduce admin overhead and support quicker decisions."
  },
  {
    icon: FaShieldHeart,
    title: "Built For Healthcare Trust",
    description: "Role-based access, audit-friendly modules, and secure API architecture."
  },
  {
    icon: FaClock,
    title: "Real-Time Operations",
    description: "Live session, notifications, and analytics keep teams aligned instantly."
  }
];

const compliance = [
  "JWT authentication with role-based authorization",
  "Encrypted API traffic with secure environment configuration",
  "Operational audit-readiness through centralized workflows",
  "Scalable architecture for real-world deployment"
];

function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,#dff3ff_0%,transparent_33%),radial-gradient(circle_at_90%_20%,#dcf8ee_0%,transparent_36%),linear-gradient(165deg,#f2f8fc,#eef8f2)] px-4 py-8 sm:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-cyan-900 via-sky-800 to-emerald-700 p-6 shadow-soft sm:p-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/50 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                <FaHeartPulse /> HEALTHCARE SAAS PLATFORM
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
                Intelligent Healthcare Operations For Modern Care Teams
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-cyan-50 sm:text-base">
                A complete patient management, diagnosis support, and analytics platform built to streamline clinical workflows and accelerate care delivery.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-cyan-800 shadow-soft transition hover:-translate-y-0.5">
                  Launch Dashboard <FaArrowRight />
                </Link>
                <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-[12px] border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                  Start Free Access
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-2 rounded-[18px] bg-white/15 blur-xl" />
              <div className="relative overflow-hidden rounded-[18px] border border-white/30 bg-white/90 p-2 shadow-soft">
                <img
                  src="/dashboard-preview.svg"
                  alt="Healthcare dashboard preview"
                  className="w-full rounded-[12px]"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Core Features</h2>
            <p className="text-sm text-slate-500">Built for daily healthcare operations</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="inline-grid h-10 w-10 place-items-center rounded-[12px] bg-cyan-50 text-cyan-700">
                    <Icon />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-slate-800">{card.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-soft xl:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800">Why Choose Us</h2>
            <p className="mt-2 text-sm text-slate-600">
              Created with real healthcare workflows in mind, combining AI support with operational clarity.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {reasons.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                    <span className="inline-grid h-9 w-9 place-items-center rounded-[10px] bg-white text-cyan-700 shadow-sm">
                      <Icon />
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-slate-800">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-800">Security & Compliance</h2>
            <p className="mt-2 text-sm text-slate-600">Enterprise-minded controls for protected healthcare data.</p>
            <ul className="mt-4 space-y-2">
              {compliance.map((item) => (
                <li key={item} className="inline-flex items-start gap-2 text-sm text-slate-700">
                  <FaCircleCheck className="mt-0.5 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              <FaLock /> Security-first SaaS architecture
            </div>
          </article>
        </section>

        <section className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Preview</h2>
              <p className="mt-2 text-sm text-slate-600">
                Monitor appointments, AI confidence, department utilization, and patient risk from a unified analytics command center.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[12px] bg-slate-50 p-3">
                  <p className="text-slate-500">Live Sessions</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">24</p>
                </div>
                <div className="rounded-[12px] bg-slate-50 p-3">
                  <p className="text-slate-500">AI Accuracy</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">86%</p>
                </div>
                <div className="rounded-[12px] bg-slate-50 p-3">
                  <p className="text-slate-500">Risk Alerts</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">9</p>
                </div>
                <div className="rounded-[12px] bg-slate-50 p-3">
                  <p className="text-slate-500">Doctor Capacity</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">82%</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50 p-2">
              <img src="/dashboard-preview.svg" alt="Portal analytics preview" className="w-full rounded-[10px]" />
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-200 bg-gradient-to-r from-cyan-700 to-sky-800 p-6 text-white shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready To Modernize Healthcare Operations?</h2>
          <p className="mt-2 max-w-3xl text-sm text-cyan-100 sm:text-base">
            Launch your AI-powered healthcare workspace with secure access, intelligent workflows, and modern analytics.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-cyan-800">
              Get Started <FaArrowRight />
            </Link>
            <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-[12px] border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
              Create Team Account
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

export default HomePage;
