"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "@/features/i18n/language-provider";
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
  const t = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="denty-panel-strong p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="denty-kicker">
              {t("supervision.community.identity_eyebrow")}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {t("supervision.community.identity_title")}
            </h3>
          </div>
          {workspace?.groupMembership?.group ? (
            <span className="denty-pill">
              {t("supervision.community.students_count", {
                count: workspace.groupMembership.group.members.length,
              })}
            </span>
          ) : null}
        </div>
        {workspace?.groupMembership?.group ? (
          <div className="mt-5 space-y-4">
            <div className="denty-dashboard-card p-4 sm:p-5">
              <p className="text-xl font-semibold text-[var(--foreground)]">{workspace.groupMembership.group.name}</p>
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
            <p className="denty-kicker">
              {t("supervision.community.group_eyebrow")}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t("supervision.community.join_to_unlock")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {workspace?.groupMembership?.group ? (
          <div className="denty-panel-strong p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="denty-kicker">
                  {t("supervision.community.publishing_eyebrow")}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                  {t("supervision.community.publishing_title")}
                </h3>
              </div>
              <span className="denty-pill">
                {t("supervision.community.social_feed")}
              </span>
            </div>
            <div className="mt-5 rounded-[22px] border border-white/12 bg-white/34 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,22,40,0.08)] text-lg font-semibold text-[var(--foreground)]">
                  {(workspace.doctor.name || "D").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{workspace.doctor.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                    {t("supervision.community.posting_to", {
                      group: workspace.groupMembership.group.name,
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="denty-field text-sm"
                  placeholder={t("supervision.community.post_title_placeholder")}
                />
                <textarea
                  value={postForm.body}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, body: e.target.value }))}
                  className="denty-field min-h-[150px] text-sm"
                  placeholder={t("supervision.community.post_body_placeholder")}
                />
                <button onClick={createPost} className="denty-button-primary px-4 py-3 text-sm font-semibold">
                  {t("supervision.community.publish_post")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="denty-panel-strong p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">
                {t("supervision.community.feed_eyebrow")}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {t("supervision.community.feed_title")}
              </h3>
            </div>
            <span className="denty-pill">
              {t("supervision.community.posts_count", {
                count: workspace?.feed.length || 0,
              })}
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {workspace?.feed.map((post) => (
              <article key={post.id} className="denty-dashboard-card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,22,40,0.08)] text-base font-semibold text-[var(--foreground)]">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--foreground)]">{post.author.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[rgba(10,22,40,0.52)]">
                      {post.group?.name ||
                        t("supervision.community.group_feed_fallback")}{" "}
                      - {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    {post.title ? <h4 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{post.title}</h4> : null}
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{post.body}</p>
                  </div>
                </div>
              </article>
            ))}
            {workspace && workspace.feed.length === 0 ? (
              <div className="denty-placeholder p-5">
                <p className="denty-kicker">
                  {t("supervision.community.feed_eyebrow")}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t("supervision.community.no_posts")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
