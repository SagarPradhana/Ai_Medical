import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import PortalLoader from "../../components/common/PortalLoader";

function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setShowLoading(true);
    setError("");
    setIsSubmitting(true);
    try {
      const response = await changePassword(form);
      setMessage(response.message || "Password changed successfully.");
      setForm({ oldPassword: "", newPassword: "" });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setShowLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader title="Change Password" subtitle="Update your account credentials securely." />

      {showLoading ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <PortalLoader title="Changing Password" subtitle="Changing your password..." />
        </div>
      ) : null}

      <div className="max-w-2xl rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Current Password</span>
            <input
              type="password"
              required
              value={form.oldPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">New Password</span>
            <input
              type="password"
              required
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChangePasswordPage;
