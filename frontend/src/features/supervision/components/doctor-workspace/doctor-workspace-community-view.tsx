"use client";

import type { Dispatch, SetStateAction } from "react";
import type { DoctorWorkspaceData } from "../../types";

type Props = {
  workspace: DoctorWorkspaceData | null;
  postForm: {
    title: string;
    body: string;
  };
  setPostForm: Dispatch<SetStateAction<{ title: string; body: string }>>;
  createPost: () => Promise<void>;
};

export function DoctorWorkspaceCommunityView({
  workspace,
  postForm,
  setPostForm,
  createPost,
}: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="denty-panel-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">Group identity</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Group overview</h3>
          </div>
          {workspace?.groupMembership?.group ? (
            <span className="denty-pill">{workspace.groupMembership.group.members.length} students</span>
          ) : null}
        </div>
        {workspace?.groupMembership?.group ? (
          <div className="mt-5 space-y-4">
            <div className="denty-dashboard-card p-5">
              <p className="text-2xl font-semibold text-[var(--foreground)]">{workspace.groupMembership.group.name}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{workspace.groupMembership.group.semesterLabel}</p>
              {workspace.groupMembership.group.description ? (
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{workspace.groupMembership.group.description}</p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workspace.groupMembership.group.members.map((member) => (
                <div key={member.doctor.id} className="denty-dashboard-card-soft p-4">
                  <p className="text-lg font-semibold text-[var(--foreground)]">{member.doctor.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">@{member.doctor.username}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 denty-placeholder p-5">
            <p className="denty-kicker">Group</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Join a group to unlock the student feed and partner workflow.</p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {workspace?.groupMembership?.group ? (
          <div className="denty-panel-strong p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="denty-kicker">Publishing lane</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Share to the group feed</h3>
              </div>
              <span className="denty-pill">Social feed</span>
            </div>
            <div className="mt-5 rounded-[30px] border border-white/12 bg-white/34 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,22,40,0.08)] text-lg font-semibold text-[var(--foreground)]">
                  {(workspace.doctor.name || "D").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{workspace.doctor.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">Posting to {workspace.groupMembership.group.name}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="denty-field text-sm"
                  placeholder="Headline or case update title"
                />
                <textarea
                  value={postForm.body}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, body: e.target.value }))}
                  className="denty-field min-h-[150px] text-sm"
                  placeholder="Share what happened in clinic, what your pair handled, or what the group should know next."
                />
                <button onClick={createPost} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                  Publish post
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="denty-panel-strong p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Feed</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Student posts</h3>
            </div>
            <span className="denty-pill">{workspace?.feed.length || 0} posts</span>
          </div>
          <div className="mt-5 space-y-4">
            {workspace?.feed.map((post) => (
              <article key={post.id} className="denty-dashboard-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,22,40,0.08)] text-base font-semibold text-[var(--foreground)]">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--foreground)]">{post.author.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                      {post.group?.name || "Group feed"} - {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    {post.title ? <h4 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{post.title}</h4> : null}
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{post.body}</p>
                  </div>
                </div>
              </article>
            ))}
            {workspace && workspace.feed.length === 0 ? (
              <div className="denty-placeholder p-5">
                <p className="denty-kicker">Feed</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">No group posts yet.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
