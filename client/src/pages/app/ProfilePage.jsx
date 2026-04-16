import {
  FaBuildingUser,
  FaCalendarCheck,
  FaEnvelope,
  FaIdBadge,
  FaShieldHalved,
  FaUserDoctor
} from "react-icons/fa6";
import { useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";

function ProfilePage() {
  const { user } = useAuth();
  const roleLabel = user?.position || user?.role || "guest";

  const profileDetails = useMemo(
    () => [
      { label: "Full Name", value: user?.name || "-", icon: FaIdBadge },
      { label: "Email Address", value: user?.email || "-", icon: FaEnvelope },
      { label: "Role", value: user?.role || "-", icon: FaShieldHalved },
      { label: "Position", value: user?.position || user?.role || "-", icon: FaUserDoctor },
      { label: "Organization", value: "AI Medical Health Network", icon: FaBuildingUser },
      { label: "Status", value: "Active", icon: FaCalendarCheck }
    ],
    [user]
  );

  const highlights = [
    { label: "Account Type", value: roleLabel.toUpperCase() },
    { label: "Security", value: "JWT Protected" },
    { label: "Session State", value: "Active" }
  ];

  const recentActions = [
    "Viewed operational dashboard and care modules.",
    "Checked role-protected portal access.",
    "Maintained secure authenticated session."
  ];

  return (
    <section className="space-y-4">
      <PageHeader
        title="Profile"
        subtitle="Manage your account details and role metadata."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-soft">
          <div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-emerald-600 px-5 py-6 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-xl font-bold">
                  {String(user?.name || "U")
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name || "Portal User"}</h2>
                  <p className="mt-1 text-sm text-cyan-50">{user?.email || "No email available"}</p>
                </div>
              </div>
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-base font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {recentActions.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-[12px] border border-slate-200 bg-slate-50 p-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-semibold text-slate-800">Account Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profileDetails.map((detail) => {
            const Icon = detail.icon;
            return (
              <article
                key={detail.label}
                className="rounded-[12px] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {detail.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                      {detail.value}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-cyan-100 text-cyan-700">
                    <Icon />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
