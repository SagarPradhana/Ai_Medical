import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaDownload,
  FaMicrophone,
  FaMicrophoneSlash,
  FaMoon,
  FaNotesMedical,
  FaPaperPlane,
  FaPlus,
  FaRobot,
  FaRotateLeft,
  FaSun,
  FaSyringe,
  FaTriangleExclamation,
  FaUser
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import { apiFetch } from "../../utils/api";

const quickSymptoms = [
  "I have fever and cough for 2 days",
  "Headache, nausea, and sensitivity to light",
  "I feel chest pain and shortness of breath",
  "Stomach pain, vomiting, and diarrhea",
  "Sneezing, sore throat, and runny nose"
];

const initialBotMessage = {
  id: "boot-msg",
  role: "bot",
  text: "Describe symptoms and I will generate a preliminary medical assessment. This is not a final diagnosis.",
  timestamp: new Date().toISOString()
};

function createSession() {
  const now = new Date();
  return {
    id: `conv-${now.getTime()}-${Math.floor(Math.random() * 1000)}`,
    title: "New Consultation",
    createdAt: now.toISOString(),
    severity: "medium",
    duration: "2 days",
    notes: "",
    messages: [initialBotMessage]
  };
}

function formatTime(timestamp) {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return "--:--";
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function riskClass(risk = "Unknown") {
  if (risk === "High") return "bg-rose-100 text-rose-700 border-rose-200";
  if (risk === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
  if (risk === "Low") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function DiagnosisChatPage() {
  const [sessions, setSessions] = useState([createSession()]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef(null);
  const feedRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  const messages = activeSession?.messages || [initialBotMessage];

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const updateActiveSession = (updater) => {
    setSessions((prev) =>
      prev.map((item) => (item.id === activeSessionId ? updater(item) : item))
    );
  };

  useEffect(() => {
    const speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!speech) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new speech();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setInput((prev) => `${prev}${prev ? " " : ""}${transcript}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isLoading]);

  const pushUserMessage = (session, text) => {
    const trimmed = text.trim();
    if (!trimmed) return session;

    const nextTitle =
      session.title === "New Consultation" ? trimmed.slice(0, 45) : session.title;

    return {
      ...session,
      title: nextTitle,
      messages: [
        ...session.messages,
        {
          id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          role: "user",
          text: trimmed,
          timestamp: new Date().toISOString()
        }
      ]
    };
  };

  const submitMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const rawText = messageText.trim();
    const enrichedMessage = `${rawText} Severity: ${activeSession.severity}. Duration: ${activeSession.duration}. Additional notes: ${activeSession.notes || "none"}.`;

    updateActiveSession((session) => pushUserMessage(session, rawText));
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message: enrichedMessage })
      });

      updateActiveSession((session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
            id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            role: "bot",
            text: data.reply,
            prediction: data.prediction,
            symptoms: data.extractedSymptoms,
            timestamp: data.timestamp || new Date().toISOString()
          }
        ]
      }));
    } catch (_error) {
      updateActiveSession((session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
            id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            role: "bot",
            text: "Unable to process request right now. Please retry.",
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await submitMessage(input);
  };

  const clearConversation = () => {
    updateActiveSession((session) => ({
      ...session,
      title: "New Consultation",
      messages: [{ ...initialBotMessage, id: `boot-${Date.now()}`, timestamp: new Date().toISOString() }]
    }));
    setInput("");
  };

  const newConversation = () => {
    const next = createSession();
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    setInput("");
  };

  const exportConversation = () => {
    const text = messages
      .map((item) => `${item.role.toUpperCase()} [${formatTime(item.timestamp)}]: ${item.text}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${activeSession.title.replace(/\s+/g, "-").toLowerCase() || "diagnosis-chat"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.start();
    setIsListening(true);
  };

  const predictionTrail = useMemo(
    () => messages.filter((item) => item.role === "bot" && item.prediction),
    [messages]
  );

  const confidencePoints = predictionTrail.map((entry) => entry.prediction.confidence || 0);
  const latestPrediction = predictionTrail[predictionTrail.length - 1]?.prediction;
  const latestSymptoms = predictionTrail[predictionTrail.length - 1]?.symptoms || [];

  const rootTone = isDarkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-800";
  const panelTone = isDarkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";
  const mutedTone = isDarkMode ? "text-slate-300" : "text-slate-600";

  return (
    <section className={`rounded-[12px] p-3 md:p-4 ${rootTone}`}>
      <PageHeader
        title="AI Diagnosis Chat"
        subtitle="Intelligent healthcare assistant for symptom analysis and triage support."
      />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_330px]">
        <aside className={`rounded-[12px] border p-4 shadow-soft ${panelTone}`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Conversation History</h3>
            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-1 rounded-[10px] border border-cyan-300 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700"
            >
              <FaPlus /> New
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full rounded-[12px] border px-3 py-2 text-left transition ${session.id === activeSessionId ? "border-cyan-300 bg-cyan-50 text-slate-900" : isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
              >
                <p className="truncate text-sm font-semibold">{session.title}</p>
                <p className={`text-xs ${mutedTone}`}>{formatTime(session.createdAt)}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className={`rounded-[12px] border shadow-soft ${panelTone}`}>
          <section className="border-b border-slate-200/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-base font-semibold">
                <FaNotesMedical /> Clinical Intake
              </h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsDarkMode((prev) => !prev)} className="inline-flex items-center gap-1 rounded-[10px] border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {isDarkMode ? <FaSun /> : <FaMoon />} {isDarkMode ? "Light" : "Dark"}
                </button>
                <button type="button" onClick={() => setIsIntakeOpen((prev) => !prev)} className="inline-flex items-center gap-1 rounded-[10px] border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {isIntakeOpen ? <FaChevronUp /> : <FaChevronDown />} {isIntakeOpen ? "Hide" : "Show"}
                </button>
                <button type="button" onClick={clearConversation} className="inline-flex items-center gap-1 rounded-[10px] border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <FaRotateLeft /> Reset
                </button>
                <button type="button" onClick={exportConversation} className="inline-flex items-center gap-1 rounded-[10px] border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            {isIntakeOpen ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedTone}`}>Severity</span>
                  <select
                    value={activeSession.severity}
                    onChange={(event) => updateActiveSession((session) => ({ ...session, severity: event.target.value }))}
                    className="w-full rounded-[12px] border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="block">
                  <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedTone}`}>Duration</span>
                  <input
                    value={activeSession.duration}
                    onChange={(event) => updateActiveSession((session) => ({ ...session, duration: event.target.value }))}
                    className="w-full rounded-[12px] border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                    placeholder="e.g., 3 days"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedTone}`}>Clinical Notes</span>
                  <input
                    value={activeSession.notes}
                    onChange={(event) => updateActiveSession((session) => ({ ...session, notes: event.target.value }))}
                    className="w-full rounded-[12px] border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                    placeholder="age, chronic conditions, medication"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section ref={feedRef} className={`h-[430px] space-y-4 overflow-y-auto p-4 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
            {messages.map((message) => (
              <article key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${message.role === "user" ? "bg-cyan-600 text-white" : "bg-emerald-600 text-white"}`}>
                      {message.role === "user" ? <FaUser /> : <FaRobot />}
                    </span>
                    <span>{message.role === "user" ? "You" : "AI Assistant"}</span>
                    <span className="inline-flex items-center gap-1"><FaClock /> {formatTime(message.timestamp)}</span>
                  </div>

                  <div className={`rounded-[12px] px-4 py-3 shadow-soft ${message.role === "user" ? "bg-cyan-600 text-white" : isDarkMode ? "border border-slate-700 bg-slate-900 text-slate-100" : "border border-slate-200 bg-white text-slate-800"}`}>
                    <p className="text-sm leading-6">{message.text}</p>

                    {message.prediction ? (
                      <div className={`mt-3 rounded-[12px] border p-3 ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="inline-flex items-center gap-1 text-sm font-semibold">
                            <FaSyringe /> AI Response Card
                          </h4>
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskClass(message.prediction.risk)}`}>
                            {message.prediction.risk}
                          </span>
                        </div>

                        <p className="text-sm font-semibold">{message.prediction.disease}</p>
                        <p className={`mt-1 text-xs ${mutedTone}`}>{message.prediction.recommendation}</p>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span>Confidence</span>
                            <span>{message.prediction.confidence}%</span>
                          </div>
                          <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${message.prediction.confidence}%` }} />
                          </div>
                        </div>

                        {message.symptoms?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.symptoms.map((symptom) => (
                              <span key={symptom} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                                {symptom}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}

            {isLoading ? (
              <article className="flex justify-start">
                <div className={`max-w-[75%] rounded-[12px] border px-4 py-3 text-sm shadow-soft ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
                  Analyzing symptoms...
                </div>
              </article>
            ) : null}
          </section>

          <section className="border-t border-slate-200/40 p-4">
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {quickSymptoms.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => submitMessage(sample)}
                  disabled={isLoading}
                  className={`rounded-[12px] border px-3 py-2 text-left text-xs font-medium transition ${isDarkMode ? "border-slate-700 bg-slate-900 hover:bg-slate-800" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {sample}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Describe patient symptoms in natural language..."
                className="w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!voiceSupported}
                  className={`inline-flex items-center gap-1 rounded-[12px] border px-3 py-2.5 text-sm font-semibold ${isListening ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-slate-100 text-slate-700"}`}
                >
                  {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />} Voice
                </button>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex items-center gap-1 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <FaPaperPlane /> Send
                </button>
              </div>
            </form>
          </section>
        </main>

        <aside className="space-y-4">
          <div className={`rounded-[12px] border p-4 shadow-soft ${panelTone}`}>
            <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <FaTriangleExclamation /> Risk Timeline
            </h3>
            <div className="space-y-2">
              {predictionTrail.slice(-6).reverse().map((entry) => (
                <div key={entry.id} className={`rounded-[10px] border px-3 py-2 ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{entry.prediction.disease}</p>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${riskClass(entry.prediction.risk)}`}>
                      {entry.prediction.risk}
                    </span>
                  </div>
                  <p className={`mt-1 text-[11px] ${mutedTone}`}>{formatTime(entry.timestamp)}</p>
                </div>
              ))}
              {predictionTrail.length === 0 ? <p className={`text-xs ${mutedTone}`}>No risk events yet.</p> : null}
            </div>
          </div>

          <div className={`rounded-[12px] border p-4 shadow-soft ${panelTone}`}>
            <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <FaChartLine /> Confidence Chart
            </h3>
            <div className="flex h-28 items-end gap-2">
              {confidencePoints.length ? (
                confidencePoints.slice(-10).map((point, index) => (
                  <div key={`${point}-${index}`} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-emerald-500" style={{ height: `${Math.max(8, point)}%` }} />
                    <span className={`text-[10px] ${mutedTone}`}>{point}%</span>
                  </div>
                ))
              ) : (
                <p className={`text-xs ${mutedTone}`}>No confidence data yet.</p>
              )}
            </div>
          </div>

          <div className={`rounded-[12px] border p-4 shadow-soft ${panelTone}`}>
            <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <FaNotesMedical /> Patient Summary
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>Severity:</strong> {activeSession.severity}</p>
              <p><strong>Duration:</strong> {activeSession.duration}</p>
              <p><strong>Notes:</strong> {activeSession.notes || "None"}</p>
              <p><strong>Latest Condition:</strong> {latestPrediction?.disease || "Not available"}</p>
              <p><strong>Latest Confidence:</strong> {latestPrediction ? `${latestPrediction.confidence}%` : "-"}</p>
              <div className="pt-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Extracted Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {latestSymptoms.length ? latestSymptoms.map((symptom) => (
                    <span key={symptom} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                      {symptom}
                    </span>
                  )) : <span className={`text-xs ${mutedTone}`}>No symptom extraction yet.</span>}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[12px] border p-4 shadow-soft ${panelTone}`}>
            <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <FaSyringe /> Assistant Hints
            </h3>
            <div className="grid gap-2">
              <article className={`rounded-[10px] border p-3 ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-xs font-semibold">Capture timeline clearly</p>
                <p className={`mt-1 text-xs ${mutedTone}`}>Duration and progression improve model confidence.</p>
              </article>
              <article className={`rounded-[10px] border p-3 ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-xs font-semibold">Watch red flags</p>
                <p className={`mt-1 text-xs ${mutedTone}`}>Escalate chest pain or breathing distress immediately.</p>
              </article>
              <article className={`rounded-[10px] border p-3 ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-xs font-semibold">Use as triage support</p>
                <p className={`mt-1 text-xs ${mutedTone}`}>AI output supports early assessment, not final diagnosis.</p>
              </article>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DiagnosisChatPage;
