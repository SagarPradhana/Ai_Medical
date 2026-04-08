import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarPlus,
  FaCommentDots,
  FaMicrophone,
  FaPaperPlane,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

function LiveSessionPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canCreate = canPerform(user?.role, "session", "create");
  const canUpdate = canPerform(user?.role, "session", "update");

  const loadData = async () => {
    try {
      setError("");
      const [sessionRes, appointmentsRes] = await Promise.all([
        apiFetch("/live-sessions"),
        apiFetch("/appointments")
      ]);
      const nextSessions = sessionRes.data || [];
      setSessions(nextSessions);
      setAppointments(appointmentsRes.data || []);

      if (!selectedId && nextSessions.length > 0) {
        setSelectedId(nextSessions[0].id);
      } else if (selectedId && !nextSessions.some((item) => item.id === selectedId)) {
        setSelectedId(nextSessions[0]?.id || null);
      }
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === selectedId) || null,
    [sessions, selectedId]
  );

  const eligibleAppointments = useMemo(() => {
    const used = new Set(
      sessions
        .filter((item) => item.status !== "Ended")
        .map((item) => item.appointmentId)
    );
    return appointments.filter((item) => !used.has(item.id));
  }, [appointments, sessions]);

  const sendMessage = async () => {
    if (!selectedSession || !messageInput.trim()) return;
    try {
      setError("");
      setInfo("");
      await apiFetch(`/live-sessions/${selectedSession.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: messageInput })
      });
      setMessageInput("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const endSession = async () => {
    if (!selectedSession) return;
    try {
      setError("");
      setInfo("");
      await apiFetch(`/live-sessions/${selectedSession.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Ended" })
      });
      setInfo("Session ended successfully.");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const createSession = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setInfo("");
      const response = await apiFetch("/live-sessions", {
        method: "POST",
        body: JSON.stringify({ appointmentId })
      });

      if (response?.data?.id) {
        setSelectedId(response.data.id);
      }
      setInfo(response?.message || "Live session created successfully.");
      setCreateOpen(false);
      setAppointmentId("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Live Video & Chat Session"
        subtitle="Real-time consultation workspace for doctor and patient communication."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      {info ? <p className="rounded-[12px] border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">{info}</p> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Sessions</h3>
            {canCreate ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1 rounded-[10px] border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700"
              >
                <FaCalendarPlus /> New
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            {sessions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-[12px] border p-3 text-left transition ${selectedId === item.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
              >
                <p className="text-sm font-semibold text-slate-800">{item.patientName} • {item.doctorName}</p>
                <p className="text-xs text-slate-500">Room: {item.roomCode}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {item.status}
                </span>
              </button>
            ))}
            {sessions.length === 0 ? <p className="text-sm text-slate-500">No sessions yet.</p> : null}
          </div>
        </aside>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Video Consultation</h3>
              <span className="text-xs font-semibold text-slate-500">{selectedSession?.roomCode || "No room"}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex h-44 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-900 text-slate-100">
                {cameraOn ? <FaVideo className="text-xl" /> : <FaVideoSlash className="text-xl" />}
                <span className="ml-2 text-sm">You</span>
              </div>
              <div className="flex h-44 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-800 text-slate-100">
                <FaVideo className="text-xl" />
                <span className="ml-2 text-sm">Remote</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCameraOn((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                {cameraOn ? <FaVideo /> : <FaVideoSlash />} {cameraOn ? "Camera On" : "Camera Off"}
              </button>
              <button
                type="button"
                onClick={() => setMicOn((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <FaMicrophone /> {micOn ? "Mic On" : "Mic Off"}
              </button>
              {canUpdate && selectedSession?.status === "Active" ? (
                <button
                  type="button"
                  onClick={endSession}
                  className="inline-flex items-center gap-1 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                >
                  <FaPhoneSlash /> End Session
                </button>
              ) : null}
            </div>
          </article>

          <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <FaCommentDots /> Live Chat
            </h3>

            <div className="h-64 space-y-2 overflow-y-auto rounded-[12px] border border-slate-200 bg-slate-50 p-3">
              {selectedSession?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] rounded-[10px] px-3 py-2 text-sm ${msg.senderRole === user?.role ? "ml-auto bg-cyan-600 text-white" : "bg-white text-slate-700"}`}
                >
                  <p className="text-[11px] font-semibold opacity-80">{msg.senderName}</p>
                  <p>{msg.text}</p>
                </div>
              ))}
              {!selectedSession ? <p className="text-sm text-slate-500">Select a session to start chat.</p> : null}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Type message..."
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!selectedSession || selectedSession.status !== "Active"}
                className="inline-flex items-center gap-1 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <FaPaperPlane /> Send
              </button>
            </div>
          </article>
        </div>
      </div>

      <FuturisticModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Live Session"
        subtitle="Start doctor-patient video and chat consultation from an appointment."
        icon={FaCalendarPlus}
        size="sm"
      >
        <form onSubmit={createSession} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Appointment</span>
            <select
              required
              value={appointmentId}
              onChange={(event) => setAppointmentId(event.target.value)}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              <option value="">Select appointment</option>
              {eligibleAppointments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} • {item.patientName} with {item.doctorName} • {item.date} {item.time}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <FaVideo /> Start Session
          </button>
        </form>
      </FuturisticModal>
    </section>
  );
}

export default LiveSessionPage;
