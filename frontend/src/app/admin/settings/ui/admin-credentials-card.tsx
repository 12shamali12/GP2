"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { authHeaders } from "@/lib/api/auth";
import { useToast } from "@/features/ui/components/toast-provider";

type StoredUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
};

const readStoredUser = (): StoredUser => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("currentUser");
    if (!raw) return {};
    return JSON.parse(raw) as StoredUser;
  } catch {
    return {};
  }
};

const writeStoredUser = (next: StoredUser) => {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem("currentUser");
    const merged = raw ? { ...JSON.parse(raw), ...next } : next;
    sessionStorage.setItem("currentUser", JSON.stringify(merged));
  } catch {
    /* ignore */
  }
};

const PHONE_PATTERN = /^07\d{8}$/;

export function AdminCredentialsCard() {
  const { pushToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [stored, setStored] = useState<StoredUser>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    setStored(user);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setUsername(user.username ?? "");
    setPhone(user.phone ?? "");
  }, []);

  const identifier = useMemo(
    () => stored.email || stored.username || stored.phone || stored.id || "",
    [stored],
  );

  const dirty =
    name !== (stored.name ?? "") ||
    email !== (stored.email ?? "") ||
    username !== (stored.username ?? "") ||
    phone !== (stored.phone ?? "");

  const reset = () => {
    setName(stored.name ?? "");
    setEmail(stored.email ?? "");
    setUsername(stored.username ?? "");
    setPhone(stored.phone ?? "");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier) {
      pushToast({
        kind: "error",
        title: "Edit credentials",
        description: "We could not identify the current account. Sign in again.",
      });
      return;
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      pushToast({
        kind: "error",
        title: "Edit credentials",
        description: "Phone must start with 07 and be 10 digits.",
      });
      return;
    }

    // Only send what actually changed so the backend can no-op the rest and
    // surface friendlier collision messages tied to specific fields.
    const body: Record<string, string> = { identifier };
    if (name && name !== (stored.name ?? "")) body.name = name;
    if (email && email !== (stored.email ?? "")) body.email = email;
    if (username && username !== (stored.username ?? "")) body.username = username;
    if (phone && phone !== (stored.phone ?? "")) body.phone = phone;

    if (Object.keys(body).length === 1) {
      pushToast({
        kind: "info",
        title: "Edit credentials",
        description: "Nothing has changed yet.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/auth/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data === "object" && "message" in data
            ? String((data as { message: unknown }).message)
            : null) || "Could not update credentials.";
        pushToast({
          kind: "error",
          title: "Edit credentials",
          description: message,
        });
        return;
      }

      const updated =
        data && typeof data === "object" && "user" in data
          ? ((data as { user?: StoredUser }).user ?? null)
          : null;
      if (updated) {
        writeStoredUser(updated);
        setStored(updated);
        setName(updated.name ?? "");
        setEmail(updated.email ?? "");
        setUsername(updated.username ?? "");
        setPhone(updated.phone ?? "");
      }
      pushToast({
        kind: "success",
        title: "Credentials updated",
        description:
          "Use the new login details next time you sign in. Your current session stays active.",
      });
    } catch {
      pushToast({
        kind: "error",
        title: "Edit credentials",
        description: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="denty-panel-strong p-4 sm:p-6">
      <div className="space-y-2">
        <p className="denty-kicker">Account</p>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Edit credentials
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Update the email, phone, username or display name used to sign in to the
          admin console. The session token stays valid until you sign out.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Name
            </span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="denty-input w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Username
            </span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="denty-input w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="denty-input w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Phone
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="denty-input w-full"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={!dirty || submitting}
            className="denty-button-primary px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty || submitting}
            className="denty-button-secondary px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
