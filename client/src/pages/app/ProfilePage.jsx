import { useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";

function ProfilePage() {
  const { user } = useAuth();

  const profileDetails = useMemo(
    () => [
      { label: "Full Name", value: user?.name || "-" },
      { label: "Email", value: user?.email || "-" },
      { label: "Role", value: user?.role || "-" },
      { label: "Position", value: user?.position || user?.role || "-" },
      { label: "Organization", value: "AI Medical Health Network" },
      { label: "Status", value: "Active" }
    ],
    [user]
  );

  const recentActions = [
    "Updated communication preference",
    "Viewed 6 patient records today",
    "Exported weekly operational report"
  ];

  return (
    <section className="page-grid">
      <PageHeader
        title="Profile"
        subtitle="Manage your account details and role metadata."
      />
      <div className="two-col-grid">
        <div className="content-card profile-card fade-in-up">
          <h3>Account Details</h3>
          {profileDetails.map((detail) => (
            <div key={detail.label} className="profile-row">
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </div>
          ))}
        </div>
        <div className="content-card fade-in-up delayed-1">
          <h3>Recent Activity</h3>
          <ul className="simple-list">
            {recentActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
