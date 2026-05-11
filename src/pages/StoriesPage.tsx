import { motion } from "framer-motion";
import { BookOpen, Clock3, Edit3, FileText, HelpCircle, Inbox, Plus, ScrollText, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppModal } from "../components/ui/AppModal";
import { Badge, ConfirmDialog, DropdownSelect, EmptyState, LoadingState, MultiSelectList, PageShell, SearchBar, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { apiErrorMessage, spaceFetch } from "../lib/api";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember, SourceNote, SourceNoteType, Story, StoryOrigin } from "../types/family";
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

const originTone = (origin: StoryOrigin) => {
  if (origin === "ai_biography") return "gold";
  if (origin === "ai_timeline") return "sage";
  return "muted";
};

const originLabel = (origin: StoryOrigin) => {
  if (origin === "ai_biography") return "AI-assisted biography";
  if (origin === "ai_timeline") return "AI-assisted timeline";
  return "Manual story";
};

const noteTypeLabel = (type: SourceNoteType) => type.replace("_", " ");

const noteTypeOptions: SourceNoteType[] = ["note", "photo_context", "interview", "document", "chat"];

type StoryFormState = {
  title: string;
  content: string;
  origin: StoryOrigin;
  relatedMemberIds: string[];
  sourceNoteIds: string[];
};

type SourceNoteFormState = {
  title: string;
  content: string;
  type: SourceNoteType;
  relatedMemberIds: string[];
  storyIds: string[];
};

const emptyStoryForm = (): StoryFormState => ({
  title: "",
  content: "",
  origin: "manual",
  relatedMemberIds: [],
  sourceNoteIds: [],
});

const emptyNoteForm = (): SourceNoteFormState => ({
  title: "",
  content: "",
  type: "note",
  relatedMemberIds: [],
  storyIds: [],
});

function StoryFormFields({
  form,
  members,
  sourceNotes,
  onChange,
}: {
  form: StoryFormState;
  members: FamilyMember[];
  sourceNotes: SourceNote[];
  onChange: (form: StoryFormState) => void;
}) {
  return (
    <div className="grid gap-4">
      <input
        className={inputClass}
        value={form.title}
        placeholder="Story title"
        onChange={(event) => onChange({ ...form, title: event.target.value })}
      />
      <textarea
        className={`${inputClass} min-h-36 resize-y`}
        value={form.content}
        placeholder="Write a family story, memory, or narrative"
        onChange={(event) => onChange({ ...form, content: event.target.value })}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <MultiSelectList
          label="Related members"
          values={form.relatedMemberIds}
          options={members.map((member) => ({
            value: member.id,
            label: member.displayName || member.fullName,
            description: member.relationshipToRoot || member.familyBranch,
          }))}
          onChange={(values) => onChange({ ...form, relatedMemberIds: values })}
          emptyLabel="No members available."
        />
        <MultiSelectList
          label="Memory Inbox notes"
          values={form.sourceNoteIds}
          options={sourceNotes.map((note) => ({
            value: note.id,
            label: note.title,
            description: noteTypeLabel(note.type),
          }))}
          onChange={(values) => onChange({ ...form, sourceNoteIds: values })}
          emptyLabel="No memory notes yet."
        />
      </div>
    </div>
  );
}

function SourceNoteFormFields({
  form,
  members,
  stories,
  onChange,
}: {
  form: SourceNoteFormState;
  members: FamilyMember[];
  stories: Story[];
  onChange: (form: SourceNoteFormState) => void;
}) {
  return (
    <div className="grid gap-4">
      <input
        className={inputClass}
        value={form.title}
        placeholder="Memory note title"
        onChange={(event) => onChange({ ...form, title: event.target.value })}
      />
      <textarea
        className={`${inputClass} min-h-28 resize-y`}
        value={form.content}
        placeholder="Interview details, document context, photo notes, chat snippets, or raw memories"
        onChange={(event) => onChange({ ...form, content: event.target.value })}
      />
      <DropdownSelect
        label="Note type"
        value={form.type}
        options={noteTypeOptions.map((type) => ({ value: type, label: noteTypeLabel(type) }))}
        onChange={(value) => onChange({ ...form, type: value as SourceNoteType })}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <MultiSelectList
          label="Attach to stories"
          values={form.storyIds}
          options={stories.map((story) => ({
            value: story.id,
            label: story.title,
            description: originLabel(story.origin),
          }))}
          onChange={(values) => onChange({ ...form, storyIds: values })}
          emptyLabel="No stories yet."
        />
        <MultiSelectList
          label="Related members"
          values={form.relatedMemberIds}
          options={members.map((member) => ({
            value: member.id,
            label: member.displayName || member.fullName,
            description: member.relationshipToRoot || member.familyBranch,
          }))}
          onChange={(values) => onChange({ ...form, relatedMemberIds: values })}
          emptyLabel="No members available."
        />
      </div>
    </div>
  );
}

export const StoriesPage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { members, canEdit, addToast } = useSpaceStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [sourceNotes, setSourceNotes] = useState<SourceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [storyForm, setStoryForm] = useState<StoryFormState>(() => emptyStoryForm());
  const [noteForm, setNoteForm] = useState<SourceNoteFormState>(() => emptyNoteForm());
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);
  const [editStoryForm, setEditStoryForm] = useState<StoryFormState>(() => emptyStoryForm());
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<SourceNote | null>(null);
  const [editNoteForm, setEditNoteForm] = useState<SourceNoteFormState>(() => emptyNoteForm());
  const [noteToDelete, setNoteToDelete] = useState<SourceNote | null>(null);
  const [storyQuery, setStoryQuery] = useState("");

  const membersMap = useMemo(() => memberById(members), [members]);
  const memberOptions = useMemo(
    () => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members],
  );
  const filteredStories = useMemo(() => {
    const term = storyQuery.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesQuery =
        !term ||
        [story.title, story.content]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesQuery;
    });
  }, [stories, storyQuery]);

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
    setStoryForm(emptyStoryForm());
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
    setNoteForm(emptyNoteForm());
    addToast("Source note saved successfully");
  };

  const openEditStory = (story: Story) => {
    setStoryToEdit(story);
    setEditStoryForm({
      title: story.title,
      content: story.content,
      origin: story.origin,
      relatedMemberIds: story.relatedMemberIds,
      sourceNoteIds: story.sourceNoteIds,
    });
  };

  const updateStory = async (story: Story, form: StoryFormState, message = "Story updated") => {
    if (!spaceSlug || !form.title.trim()) return null;

    const response = await spaceFetch(spaceSlug, `/stories/${story.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to update story"), "error");
      return null;
    }

    const updated = (await response.json()) as Story;
    setStories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    addToast(message);
    return updated;
  };

  const saveStoryEdit = async () => {
    if (!storyToEdit) return;
    const updated = await updateStory(storyToEdit, editStoryForm);
    if (updated) {
      setStoryToEdit(null);
      setEditStoryForm(emptyStoryForm());
      void loadStories();
    }
  };

  const deleteStory = async () => {
    if (!spaceSlug || !storyToDelete) return;

    const response = await spaceFetch(spaceSlug, `/stories/${storyToDelete.id}`, { method: "DELETE" });
    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to delete story"), "error");
      return;
    }

    const deletedId = storyToDelete.id;
    setStories((current) => current.filter((story) => story.id !== deletedId));
    setSourceNotes((current) =>
      current.map((note) => ({
        ...note,
        storyIds: note.storyIds.filter((storyId) => storyId !== deletedId),
      })),
    );
    setStoryToDelete(null);
    addToast("Story deleted");
  };

  const openEditNote = (note: SourceNote) => {
    setNoteToEdit(note);
    setEditNoteForm({
      title: note.title,
      content: note.content,
      type: note.type,
      relatedMemberIds: note.relatedMemberIds,
      storyIds: note.storyIds,
    });
  };

  const updateSourceNote = async () => {
    if (!spaceSlug || !noteToEdit || !editNoteForm.title.trim()) return;

    const response = await spaceFetch(spaceSlug, `/source-notes/${noteToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editNoteForm),
    });

    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to update source note"), "error");
      return;
    }

    const updated = (await response.json()) as SourceNote;
    setSourceNotes((current) => current.map((note) => (note.id === updated.id ? updated : note)));
    setNoteToEdit(null);
    setEditNoteForm(emptyNoteForm());
    addToast("Source note updated");
    void loadStories();
  };

  const deleteSourceNote = async () => {
    if (!spaceSlug || !noteToDelete) return;

    const response = await spaceFetch(spaceSlug, `/source-notes/${noteToDelete.id}`, { method: "DELETE" });
    if (!response.ok) {
      addToast(await apiErrorMessage(response, "Failed to delete source note"), "error");
      return;
    }

    const deletedId = noteToDelete.id;
    setSourceNotes((current) => current.filter((note) => note.id !== deletedId));
    setStories((current) =>
      current.map((story) => ({
        ...story,
        sourceNoteIds: story.sourceNoteIds.filter((noteId) => noteId !== deletedId),
      })),
    );
    setNoteToDelete(null);
    addToast("Source note deleted");
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Family stories"
          title="Family Stories"
          description="Where family memories become readable narratives."
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

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <BookOpen className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">{stories.length}</p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Stories</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <Inbox className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">{sourceNotes.length}</p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Memory Inbox</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <Clock3 className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">
              {useMemo(() => {
                const memberIds = new Set<string>();
                stories.forEach((story) => story.relatedMemberIds.forEach((id) => memberIds.add(id)));
                return memberIds.size;
              }, [stories])}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-muted">People linked</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-soft ring-1 ring-border-soft/60">
            <FileText className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
            <p className="mt-4 font-display text-3xl font-bold text-text-primary">
              {useMemo(() => {
                const noteIds = new Set<string>();
                stories.forEach((story) => story.sourceNoteIds.forEach((id) => noteIds.add(id)));
                return noteIds.size;
              }, [stories])}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-muted">Source links</p>
          </div>
        </section>

        {canEdit() && (
          <section className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.8fr)]">
            <div className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-text-primary">
                <Plus className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                Write a family story
              </h2>
              <div className="mt-5 grid gap-4">
                <StoryFormFields
                  form={storyForm}
                  members={memberOptions}
                  sourceNotes={sourceNotes}
                  onChange={setStoryForm}
                />
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
                Add to Memory Inbox
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Store raw memories first, then connect them to members and story drafts when they are ready.
              </p>
              <div className="mt-5 grid gap-4">
                <SourceNoteFormFields
                  form={noteForm}
                  members={memberOptions}
                  stories={stories}
                  onChange={setNoteForm}
                />
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                  onClick={() => void createSourceNote()}
                >
                  Save to Memory Inbox
                </button>
              </div>
            </div>
          </section>
        )}

        {!isLoading && stories.length > 0 && (
          <section className="mb-6 rounded-[1.6rem] border border-white/75 bg-surface/94 p-4 shadow-soft ring-1 ring-border-soft/60">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
              <div>
                <span className="mb-2 block text-sm font-semibold text-text-primary">Search</span>
                <SearchBar
                  value={storyQuery}
                  onChange={setStoryQuery}
                  placeholder="Search stories by title or content"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft/80 pt-4 text-sm font-semibold text-text-muted">
              <span className="rounded-full bg-sage-green/12 px-3 py-1.5 text-dark-green">
                {filteredStories.length} of {stories.length} stories
              </span>
              {storyQuery && (
                <span className="rounded-full bg-soft-gold/14 px-3 py-1.5 text-warm-brown">
                  Keyword: {storyQuery}
                </span>
              )}
            </div>
          </section>
        )}

        {isLoading ? (
          <LoadingState />
        ) : stories.length ? (
          filteredStories.length ? (
            <section className="grid gap-5">
              {filteredStories.map((story) => {
              const relatedMembers = story.relatedMemberIds.map((id) => membersMap[id]).filter(Boolean);
              const linkedNotes = sourceNotes.filter((note) => story.sourceNoteIds.includes(note.id) || note.storyIds.includes(story.id));
              return (
                <article key={story.id} className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={originTone(story.origin)}>{originLabel(story.origin)}</Badge>
                        <Badge tone="muted">{story.sourceNoteIds.length} inbox notes</Badge>
                      </div>
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
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">Memory Inbox notes</p>
                      <div className="grid gap-2">
                        {linkedNotes.length ? (
                          linkedNotes.map((note) => (
                            <div key={note.id} className="rounded-2xl border border-border-soft bg-background px-4 py-3">
                              <p className="text-sm font-bold text-text-primary">{note.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-text-muted">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-text-muted">No Memory Inbox notes linked.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canEdit() && (
                    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border-soft/70 pt-4">
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-background px-4 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                        onClick={() => openEditStory(story)}
                      >
                        <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-2 text-sm font-bold text-warning shadow-soft transition hover:-translate-y-0.5 hover:bg-warning/15 active:translate-y-[1px]"
                        onClick={() => setStoryToDelete(story)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              );
              })}
            </section>
          ) : (
            <EmptyState
              title="No stories match that filter"
              description="Try a broader keyword or switch the status filter back to all statuses."
            />
          )
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border-soft bg-surface/70 p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-sage-green" strokeWidth={iconStroke} />
            <h3 className="mt-4 text-xl font-bold text-text-primary">No stories yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
              {canEdit()
                ? "Write a story manually, or save an AI-assisted draft from the Biography Studio or Timeline page."
                : "Owners and admins have not published family stories yet."}
            </p>
            {canEdit() && spaceSlug && (
              <Link
                to={`/app/${spaceSlug}/timeline`}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
              >
                Open Timeline
              </Link>
            )}
          </div>
        )}

        {/* How this page works explainer */}
        {stories.length > 0 && canEdit() && (
          <div className="mb-8 rounded-[1.6rem] border border-sage-green/20 bg-sage-green/8 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 shrink-0 text-sage-green" strokeWidth={iconStroke} />
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-sage-green">How this page works</p>
                <ol className="mt-3 list-inside list-decimal space-y-1 text-sm font-semibold leading-6 text-text-muted">
                  <li>Save raw memories in Memory Inbox</li>
                  <li>Turn notes, AI drafts, or timeline events into stories</li>
                  <li>Link stories to family members</li>
                  <li>Update stories anytime when new details are found</li>
                </ol>
                <p className="mt-4 text-sm font-semibold text-text-muted">
                  Family stories can be edited anytime by owners and admins.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (
          <section className="mt-8 rounded-[1.8rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Memory Inbox</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Raw memories waiting to become stories.</h2>
              </div>
              <p className="max-w-md text-sm font-semibold leading-6 text-text-muted">
                Interview notes, photo context, document notes, chat snippets, and remembered fragments stay here until they are connected to a family story.
              </p>
            </div>

            {sourceNotes.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sourceNotes.map((note) => {
                  const relatedMembers = note.relatedMemberIds.map((id) => membersMap[id]).filter(Boolean);
                  const linkedStories = stories.filter((story) => note.storyIds.includes(story.id) || story.sourceNoteIds.includes(note.id));

                  return (
                    <article key={note.id} className="rounded-[1.35rem] border border-border-soft bg-background/82 p-4 shadow-soft">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge tone="blue">{noteTypeLabel(note.type)}</Badge>
                          <h3 className="mt-3 text-base font-extrabold leading-snug text-text-primary">{note.title}</h3>
                        </div>
                        <FileText className="h-5 w-5 shrink-0 text-sage-green" strokeWidth={iconStroke} />
                      </div>
                      <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-text-muted">{note.content}</p>
                      <div className="mt-4 grid gap-2 border-t border-border-soft/70 pt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                          {relatedMembers.length} members / {linkedStories.length} stories linked
                        </p>
                        {!!relatedMembers.length && (
                          <div className="flex flex-wrap gap-2">
                            {relatedMembers.slice(0, 3).map((member) => (
                              <span key={member.id} className="rounded-full bg-sage-green/10 px-3 py-1 text-xs font-bold text-dark-green">
                                {member.displayName || member.fullName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {canEdit() && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border-soft/70 pt-4">
                          <button
                            type="button"
                            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                            onClick={() => openEditNote(note)}
                          >
                            <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-3 py-2 text-sm font-bold text-warning shadow-soft transition hover:-translate-y-0.5 hover:bg-warning/15 active:translate-y-[1px]"
                            onClick={() => setNoteToDelete(note)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Memory Inbox is empty"
                description={canEdit() ? "Add an interview note, photo context, document note, chat snippet, or raw memory to begin the story pipeline." : "No raw memories have been added yet."}
              />
            )}
          </section>
        )}

        <AppModal
          open={Boolean(storyToEdit)}
          title="Edit story"
          description="Update the draft, review status, related members, and Memory Inbox notes."
          size="lg"
          onClose={() => setStoryToEdit(null)}
        >
          <div className="grid gap-5">
            <StoryFormFields
              form={editStoryForm}
              members={memberOptions}
              sourceNotes={sourceNotes}
              onChange={setEditStoryForm}
            />
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-background px-5 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                onClick={() => setStoryToEdit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                onClick={() => void saveStoryEdit()}
              >
                Save changes
              </button>
            </div>
          </div>
        </AppModal>

        <AppModal
          open={Boolean(noteToEdit)}
          title="Edit source note"
          description="Revise this Memory Inbox note and the stories or members it supports."
          size="lg"
          onClose={() => setNoteToEdit(null)}
        >
          <div className="grid gap-5">
            <SourceNoteFormFields
              form={editNoteForm}
              members={memberOptions}
              stories={stories}
              onChange={setEditNoteForm}
            />
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-background px-5 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                onClick={() => setNoteToEdit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                onClick={() => void updateSourceNote()}
              >
                Save changes
              </button>
            </div>
          </div>
        </AppModal>

        <ConfirmDialog
          open={Boolean(storyToDelete)}
          title="Delete story?"
          description="This removes the story draft and its source links from this FamilySpace. This action cannot be undone."
          onCancel={() => setStoryToDelete(null)}
          onConfirm={() => void deleteStory()}
        />

        <ConfirmDialog
          open={Boolean(noteToDelete)}
          title="Delete source note?"
          description="This removes the Memory Inbox note and its story links from this FamilySpace. This action cannot be undone."
          onCancel={() => setNoteToDelete(null)}
          onConfirm={() => void deleteSourceNote()}
        />
      </PageShell>
    </motion.div>
  );
};
