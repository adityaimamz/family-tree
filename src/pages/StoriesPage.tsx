import { motion } from "framer-motion";
import { BookOpen, FileText, Plus, ScrollText, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { apiErrorMessage, spaceFetch } from "../lib/api";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { SourceNote, SourceNoteType, Story, StoryStatus } from "../types/family";
import { memberById } from "../utils/family";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);

const statusTone = (status: StoryStatus) => {
  if (status === "approved") return "sage";
  if (status === "in_review") return "gold";
  return "muted";
};

const statusLabel = (status: StoryStatus) => {
  if (status === "in_review") return "in review";
  return status;
};

const noteTypeOptions: SourceNoteType[] = ["note", "photo_context", "interview", "document", "chat"];

export const StoriesPage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { members, canEdit, addToast } = useSpaceStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [sourceNotes, setSourceNotes] = useState<SourceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [storyForm, setStoryForm] = useState({
    title: "",
    content: "",
    status: "draft" as StoryStatus,
    relatedMemberIds: [] as string[],
    sourceNoteIds: [] as string[],
  });
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    type: "note" as SourceNoteType,
    relatedMemberIds: [] as string[],
    storyIds: [] as string[],
  });

  const membersMap = useMemo(() => memberById(members), [members]);

  const loadStories = async () => {
    if (!spaceSlug) return;
    setIsLoading(true);
    setError("");
    try {
      const [storiesResponse, notesResponse] = await Promise.all([
        spaceFetch(spaceSlug, "/stories"),
        spaceFetch(spaceSlug, "/source-notes"),
      ]);

      if (!storiesResponse.ok) throw new Error(await apiErrorMessage(storiesResponse, "Failed to load stories."));
      if (!notesResponse.ok) throw new Error(await apiErrorMessage(notesResponse, "Failed to load source notes."));

      setStories(await storiesResponse.json());
      setSourceNotes(await notesResponse.json());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load stories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
  }, [spaceSlug]);

  const toggleStoryMember = (memberId: string) => {
    setStoryForm((current) => ({
      ...current,
      relatedMemberIds: current.relatedMemberIds.includes(memberId)
        ? current.relatedMemberIds.filter((id) => id !== memberId)
        : [...current.relatedMemberIds, memberId],
    }));
  };

  const toggleStoryNote = (noteId: string) => {
    setStoryForm((current) => ({
      ...current,
      sourceNoteIds: current.sourceNoteIds.includes(noteId)
        ? current.sourceNoteIds.filter((id) => id !== noteId)
        : [...current.sourceNoteIds, noteId],
    }));
  };

  const toggleNoteStory = (storyId: string) => {
    setNoteForm((current) => ({
      ...current,
      storyIds: current.storyIds.includes(storyId)
        ? current.storyIds.filter((id) => id !== storyId)
        : [...current.storyIds, storyId],
    }));
  };

  const toggleNoteMember = (memberId: string) => {
    setNoteForm((current) => ({
      ...current,
      relatedMemberIds: current.relatedMemberIds.includes(memberId)
        ? current.relatedMemberIds.filter((id) => id !== memberId)
        : [...current.relatedMemberIds, memberId],
    }));
  };

  const createStory = async () => {
    if (!spaceSlug || !storyForm.title.trim()) return;
    const id = slugify(storyForm.title) || `story-${Date.now()}`;
    const response = await spaceFetch(spaceSlug, "/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...storyForm, id }),
    });

    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to create story"), "error");
      return;
    }

    const created = (await response.json()) as Story;
    setStories((current) => [created, ...current]);
    setStoryForm({ title: "", content: "", status: "draft", relatedMemberIds: [], sourceNoteIds: [] });
    addToast("Story saved successfully");
  };

  const createSourceNote = async () => {
    if (!spaceSlug || !noteForm.title.trim()) return;
    const id = slugify(noteForm.title) || `source-note-${Date.now()}`;
    const response = await spaceFetch(spaceSlug, "/source-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...noteForm, id }),
    });

    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to create source note"), "error");
      return;
    }

    const created = (await response.json()) as SourceNote;
    setSourceNotes((current) => [created, ...current]);
    setNoteForm({ title: "", content: "", type: "note", relatedMemberIds: [], storyIds: [] });
    addToast("Source note saved successfully");
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Memory"
          title="Stories"
          description="Draft family narratives, connect them to relatives, and keep source notes close to the story they support."
          action={
            !canEdit() ? (
              <span className="rounded-2xl border border-sage-green/20 bg-sage-green/10 px-4 py-3 text-sm font-bold text-dark-green">
                Read-only
              </span>
            ) : null
          }
        />

        {error && (
          <div className="mb-6 rounded-[1.35rem] border border-warning/25 bg-warning/10 p-4 text-sm font-semibold text-warning">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <BookOpen className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">{stories.length}</p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Stories</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <FileText className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">{sourceNotes.length}</p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Source notes</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <Users className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">{members.length}</p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Related members available</p>
          </div>
        </section>

        {canEdit() && (
          <section className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.8fr)]">
            <div className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-text-primary">
                <Plus className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                Create story
              </h2>
              <div className="mt-5 grid gap-4">
                <input
                  className={inputClass}
                  value={storyForm.title}
                  placeholder="Story title"
                  onChange={(event) => setStoryForm((current) => ({ ...current, title: event.target.value }))}
                />
                <textarea
                  className={`${inputClass} min-h-36 resize-y`}
                  value={storyForm.content}
                  placeholder="Write the family story draft"
                  onChange={(event) => setStoryForm((current) => ({ ...current, content: event.target.value }))}
                />
                <select
                  className={inputClass}
                  value={storyForm.status}
                  onChange={(event) => setStoryForm((current) => ({ ...current, status: event.target.value as StoryStatus }))}
                >
                  <option value="draft">draft</option>
                  <option value="in_review">in review</option>
                  <option value="approved">approved</option>
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-bold text-text-primary">Related members</p>
                    <div className="max-h-52 overflow-y-auto rounded-2xl border border-border-soft bg-background p-2">
                      {members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:translate-y-[1px] ${
                            storyForm.relatedMemberIds.includes(member.id)
                              ? "bg-dark-green text-white"
                              : "text-text-primary hover:bg-surface-soft"
                          }`}
                          onClick={() => toggleStoryMember(member.id)}
                        >
                          {member.displayName || member.fullName}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-text-primary">Source notes</p>
                    <div className="max-h-52 overflow-y-auto rounded-2xl border border-border-soft bg-background p-2">
                      {sourceNotes.length ? (
                        sourceNotes.map((note) => (
                          <button
                            key={note.id}
                            type="button"
                            className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:translate-y-[1px] ${
                              storyForm.sourceNoteIds.includes(note.id)
                                ? "bg-dark-green text-white"
                                : "text-text-primary hover:bg-surface-soft"
                            }`}
                            onClick={() => toggleStoryNote(note.id)}
                          >
                            {note.title}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm font-semibold text-text-muted">No notes yet.</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                  onClick={() => void createStory()}
                >
                  Save story
                </button>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-text-primary">
                <ScrollText className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                Add source note
              </h2>
              <div className="mt-5 grid gap-4">
                <input
                  className={inputClass}
                  value={noteForm.title}
                  placeholder="Source note title"
                  onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))}
                />
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  value={noteForm.content}
                  placeholder="Interview details, document context, or photo notes"
                  onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
                />
                <select
                  className={inputClass}
                  value={noteForm.type}
                  onChange={(event) => setNoteForm((current) => ({ ...current, type: event.target.value as SourceNoteType }))}
                >
                  {noteTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <div>
                  <p className="mb-2 text-sm font-bold text-text-primary">Attach to stories</p>
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-border-soft bg-background p-2">
                    {stories.length ? (
                      stories.map((story) => (
                        <button
                          key={story.id}
                          type="button"
                          className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:translate-y-[1px] ${
                            noteForm.storyIds.includes(story.id) ? "bg-dark-green text-white" : "text-text-primary hover:bg-surface-soft"
                          }`}
                          onClick={() => toggleNoteStory(story.id)}
                        >
                          {story.title}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm font-semibold text-text-muted">No stories yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-text-primary">Related members</p>
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-border-soft bg-background p-2">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:translate-y-[1px] ${
                          noteForm.relatedMemberIds.includes(member.id) ? "bg-dark-green text-white" : "text-text-primary hover:bg-surface-soft"
                        }`}
                        onClick={() => toggleNoteMember(member.id)}
                      >
                        {member.displayName || member.fullName}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                  onClick={() => void createSourceNote()}
                >
                  Save source note
                </button>
              </div>
            </div>
          </section>
        )}

        {isLoading ? (
          <LoadingState />
        ) : stories.length ? (
          <section className="grid gap-5">
            {stories.map((story) => {
              const relatedMembers = story.relatedMemberIds.map((id) => membersMap[id]).filter(Boolean);
              const linkedNotes = sourceNotes.filter((note) => story.sourceNoteIds.includes(note.id) || note.storyIds.includes(story.id));
              return (
                <article key={story.id} className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Badge tone={statusTone(story.status)}>{statusLabel(story.status)}</Badge>
                      <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-text-primary">{story.title}</h2>
                      <p className="mt-3 max-w-[76ch] whitespace-pre-line text-sm leading-7 text-text-muted">
                        {story.content || "No story draft has been written yet."}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-text-muted">
                      Updated {new Date(story.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-border-soft/70 pt-5 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">Related members</p>
                      <div className="flex flex-wrap gap-2">
                        {relatedMembers.length ? (
                          relatedMembers.map((member) => (
                            <span key={member.id} className="rounded-full border border-sage-green/20 bg-sage-green/10 px-3 py-1.5 text-xs font-bold text-dark-green">
                              {member.displayName || member.fullName}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-text-muted">No members linked.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">Source notes</p>
                      <div className="grid gap-2">
                        {linkedNotes.length ? (
                          linkedNotes.map((note) => (
                            <div key={note.id} className="rounded-2xl border border-border-soft bg-background px-4 py-3">
                              <p className="text-sm font-bold text-text-primary">{note.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-text-muted">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-text-muted">No source notes linked.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <EmptyState
            title="No stories yet"
            description={canEdit() ? "Create the first story draft and connect it to members or source notes." : "Owners and admins have not published family stories yet."}
          />
        )}
      </PageShell>
    </motion.div>
  );
};
