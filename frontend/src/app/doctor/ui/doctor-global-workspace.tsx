"use client";

type DoctorGlobalWorkspaceProps = {
  userName: string;
  globalMessages: { sender: string; text: string; createdAt: Date }[];
  globalText: string;
  onGlobalTextChange: (value: string) => void;
  onSend: () => void;
};

export function DoctorGlobalWorkspace({
  userName,
  globalMessages,
  globalText,
  onGlobalTextChange,
  onSend,
}: DoctorGlobalWorkspaceProps) {
  return (
    <div className="denty-dashboard-card overflow-hidden p-6 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="denty-kicker">Shared space</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            Global chat
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            One public space for broader conversation across the platform.
          </p>
        </div>
        <span className="denty-pill">{userName || "Doctor"}</span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="denty-dashboard-card-soft max-h-[28rem] space-y-3 overflow-y-auto p-5">
          {globalMessages.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Start the conversation with everyone.
            </p>
          ) : null}
          {globalMessages.map((message, index) => (
            <div
              key={`${message.createdAt.toISOString()}-${index}`}
              className="denty-list-row px-4 py-3"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
                <span>{message.sender || "User"}</span>
                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                  {message.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                {message.text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={globalText}
            onChange={(event) => onGlobalTextChange(event.target.value)}
            placeholder="Message everyone..."
            className="denty-field flex-1 text-sm"
          />
          <button onClick={onSend} className="denty-button-primary px-5 py-3 text-sm">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
