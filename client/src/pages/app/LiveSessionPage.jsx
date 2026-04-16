import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCalendarPlus,
  FaCommentDots,
  FaMicrophone,
  FaPaperPlane,
  FaPhoneSlash,
  FaTrash,
  FaVideo,
  FaVideoSlash
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { apiFetch, getWsUrl } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

const rtcConfig = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
};

function LiveSessionPage() {
  const { user, token } = useAuth();
  const { notifySuccess, notifyError, notifyInfo } = useNotifications();

  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [appointmentId, setAppointmentId] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [remoteConnected, setRemoteConnected] = useState(false);

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const selectedSessionRef = useRef(null);

  const canCreate = canPerform(user?.role, "session", "create");
  const canUpdate = canPerform(user?.role, "session", "update");
  const canDelete = canPerform(user?.role, "session", "delete");

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
      notifyError(fetchError.message, "Session load failed");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === selectedId) || null,
    [sessions, selectedId]
  );

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  const eligibleAppointments = useMemo(() => {
    const used = new Set(
      sessions
        .filter((item) => item.status !== "Ended")
        .map((item) => item.appointmentId)
    );
    return appointments.filter((item) => !used.has(item.id));
  }, [appointments, sessions]);

  const stopTracks = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  };

  const closePeer = () => {
    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      } catch (_error) {
        // no-op
      }
      pcRef.current = null;
    }
    setRemoteConnected(false);
  };

  const closeRealtime = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_error) {
        // no-op
      }
      wsRef.current = null;
    }
    closePeer();
    stopTracks(localStreamRef.current);
    stopTracks(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setWsStatus("disconnected");
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const sendWs = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    wsRef.current.send(JSON.stringify(payload));
    return true;
  };

  const ensurePeer = async () => {
    if (pcRef.current) {
      return pcRef.current;
    }

    const localStream = await ensureLocalStream();
    const pc = new RTCPeerConnection(rtcConfig);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      setRemoteConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !selectedSessionRef.current) return;
      sendWs({
        type: "signal",
        sessionId: selectedSessionRef.current.id,
        signalType: "ice",
        payload: event.candidate
      });
    };

    pcRef.current = pc;
    return pc;
  };

  const createAndSendOffer = async () => {
    const session = selectedSessionRef.current;
    if (!session) return;

    try {
      const pc = await ensurePeer();
      if (pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendWs({
        type: "signal",
        sessionId: session.id,
        signalType: "offer",
        payload: offer
      });
    } catch (offerError) {
      notifyError(offerError.message || "Failed to create WebRTC offer", "Call setup failed");
    }
  };

  const handleSignal = async (event) => {
    const session = selectedSessionRef.current;
    if (!session || event.sessionId !== session.id) return;

    try {
      const pc = await ensurePeer();
      if (event.signalType === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(event.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWs({
          type: "signal",
          sessionId: session.id,
          signalType: "answer",
          payload: answer
        });
      } else if (event.signalType === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(event.payload));
      } else if (event.signalType === "ice" && event.payload) {
        await pc.addIceCandidate(new RTCIceCandidate(event.payload));
      }
    } catch (signalError) {
      notifyError(signalError.message || "WebRTC signaling error", "Call signaling failed");
    }
  };

  const handleWsMessage = async (event) => {
    let payload = null;
    try {
      payload = JSON.parse(event.data);
    } catch (_error) {
      return;
    }

    if (payload.type === "error") {
      notifyError(payload.message || "Socket error", "Realtime failed");
      return;
    }

    if (payload.type === "joined") {
      if (payload.participants > 1 && user?.role === "doctor") {
        await createAndSendOffer();
      }
      return;
    }

    if (payload.type === "presence") {
      if (payload.sessionId === selectedSessionRef.current?.id) {
        notifyInfo(`${payload.user?.name || "Participant"} joined the call.`, "Presence");
        if (payload.participants > 1 && user?.role === "doctor") {
          await createAndSendOffer();
        }
      }
      return;
    }

    if (payload.type === "chat") {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== payload.sessionId) return session;
          const exists = (session.messages || []).some((msg) => msg.id === payload.message?.id);
          if (exists) return session;
          return { ...session, messages: [...(session.messages || []), payload.message] };
        })
      );
      return;
    }

    if (payload.type === "session.updated") {
      setSessions((prev) => prev.map((session) => (session.id === payload.session.id ? payload.session : session)));
      if (payload.session.status === "Ended") {
        closePeer();
      }
      return;
    }

    if (payload.type === "session.created") {
      setSessions((prev) => {
        if (prev.some((item) => item.id === payload.session.id)) return prev;
        return [payload.session, ...prev];
      });
      return;
    }

    if (payload.type === "session.deleted") {
      setSessions((prev) => prev.filter((session) => session.id !== payload.sessionId));
      if (selectedSessionRef.current?.id === payload.sessionId) {
        closeRealtime();
        setSelectedId(null);
      }
      return;
    }

    if (payload.type === "signal") {
      await handleSignal(payload);
    }
  };

  useEffect(() => {
    const session = selectedSession;
    if (!session || !token) {
      closeRealtime();
      return undefined;
    }

    let cancelled = false;
    const ws = new WebSocket(getWsUrl(token));
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = async () => {
      if (cancelled) return;
      setWsStatus("connected");
      try {
        await ensureLocalStream();
      } catch (mediaError) {
        notifyError(mediaError.message || "Camera/mic access is required", "Media permission failed");
      }
      sendWs({ type: "join", sessionId: session.id });
    };

    ws.onmessage = (event) => {
      handleWsMessage(event);
    };

    ws.onerror = () => {
      setWsStatus("error");
    };

    ws.onclose = () => {
      if (!cancelled) {
        setWsStatus("disconnected");
      }
    };

    return () => {
      cancelled = true;
      if (wsRef.current) {
        sendWs({ type: "leave", sessionId: session.id });
      }
      closeRealtime();
    };
  }, [selectedSession?.id, token]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = cameraOn;
    });
  }, [cameraOn]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });
  }, [micOn]);

  useEffect(() => () => closeRealtime(), []);

  const sendMessage = async () => {
    if (!selectedSession || !messageInput.trim()) return;
    const text = messageInput.trim();

    if (sendWs({ type: "chat", sessionId: selectedSession.id, text })) {
      setMessageInput("");
      return;
    }

    try {
      await apiFetch(`/live-sessions/${selectedSession.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text })
      });
      setMessageInput("");
      await loadData();
      notifyInfo("Message sent.", "Live chat");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Message failed");
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
      closePeer();
      await loadData();
      notifySuccess("Live session ended successfully.", "Live session");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "End session failed");
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
      notifySuccess(response?.message || "Live session created successfully.", "Live session");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Create session failed");
    }
  };

  const removeSession = async () => {
    if (!deleteTarget) return;
    try {
      setError("");
      setInfo("");
      await apiFetch(`/live-sessions/${deleteTarget.id}`, { method: "DELETE" });
      if (selectedSession?.id === deleteTarget.id) {
        closeRealtime();
      }
      setDeleteTarget(null);
      setInfo("Session deleted successfully.");
      await loadData();
      notifySuccess("Live session deleted successfully.", "Live session");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Delete session failed");
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Live Video & Chat Session"
        subtitle="Real-time consultation with WebSocket messaging and WebRTC video call."
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

          <div className="mb-3 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Socket: {wsStatus} {remoteConnected ? "• peer connected" : "• waiting peer"}
          </div>

          <div className="space-y-2">
            {sessions.map((item) => (
              <div
                key={item.id}
                className={`rounded-[12px] border p-3 transition ${selectedId === item.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-semibold text-slate-800">{item.patientName} • {item.doctorName}</p>
                  <p className="text-xs text-slate-500">Room: {item.roomCode}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {item.status}
                  </span>
                </button>
                {canDelete ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 rounded-[10px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                ) : null}
              </div>
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
              <div className="h-44 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-900">
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              </div>
              <div className="h-44 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-800">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
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
              {canDelete && selectedSession ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedSession)}
                  className="inline-flex items-center gap-1 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                >
                  <FaTrash /> Delete Session
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

      <FuturisticModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Live Session"
        subtitle="This action permanently removes the selected session."
        icon={FaTrash}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={removeSession}
              className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Delete live session <strong>{deleteTarget?.roomCode || deleteTarget?.id}</strong>?
        </p>
      </FuturisticModal>
    </section>
  );
}

export default LiveSessionPage;
