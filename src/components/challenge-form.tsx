"use client";

import { useActionState, useState } from "react";
import { saveChallenge, type FormState } from "@/lib/actions/admin";
import { MATCH_MODE_LABELS } from "@/lib/flag";
import DecryptedText from "@/components/DecryptedText";

export type ChallengeDefaults = {
  id?: string;
  week?: number;
  title?: string;
  category?: string;
  volunteer?: string;
  description?: string;
  published?: boolean;
  releaseAtLocal?: string;
  closeAtLocal?: string;
  initialPoints?: number;
  minPoints?: number;
  decay?: number;
  matchMode?: keyof typeof MATCH_MODE_LABELS;
};

const flagHelp: Record<string, string> = {
  EXACT_CS: "The exact flag. Compared case-sensitively.",
  EXACT_CI: "The exact flag. Whitespace and case are ignored.",
  REGEX: "A regular expression the submission must match, e.g. ^flag\\{.*\\}$",
  MULTI: "One accepted answer per line (or a JSON array).",
};

const inputCls = "field";
const labelCls = "text-sm text-slate-300";

export function ChallengeForm({ defaults }: { defaults?: ChallengeDefaults }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveChallenge,
    undefined,
  );
  const isEdit = !!defaults?.id;
  const [matchMode, setMatchMode] = useState(defaults?.matchMode ?? "EXACT_CS");
  const isMulti = matchMode === "MULTI";

  return (
    <form action={formAction} className="space-y-5">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className={labelCls} htmlFor="week">Week</label>
          <input id="week" name="week" type="number" min={1} required
            defaultValue={defaults?.week} className={inputCls} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className={labelCls} htmlFor="title">Title</label>
          <input id="title" name="title" required
            defaultValue={defaults?.title} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelCls} htmlFor="category">Category</label>
          <input id="category" name="category" defaultValue={defaults?.category ?? "misc"}
            className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="volunteer">Created by (Volunteer, optional)</label>
          <input id="volunteer" name="volunteer" defaultValue={defaults?.volunteer}
            placeholder="e.g. John Doe" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelCls} htmlFor="description">
          Description (markdown)
        </label>
        <textarea id="description" name="description" rows={8}
          defaultValue={defaults?.description} className={`${inputCls} font-mono`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelCls} htmlFor="releaseAt">Release at (IST)</label>
          <input id="releaseAt" name="releaseAt" type="datetime-local" required
            defaultValue={defaults?.releaseAtLocal} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="closeAt">Close at (IST, optional)</label>
          <input id="closeAt" name="closeAt" type="datetime-local"
            defaultValue={defaults?.closeAtLocal} className={inputCls} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" name="published" defaultChecked={defaults?.published}
          className="h-4 w-4" />
        Published (visible to players once release time passes)
      </label>

      <fieldset className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
        <legend className="px-1 text-xs uppercase tracking-wide text-slate-400">
          Dynamic scoring
        </legend>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="initialPoints">Initial points</label>
          <input id="initialPoints" name="initialPoints" type="number" min={1} required
            defaultValue={defaults?.initialPoints ?? 500} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="minPoints">Minimum points</label>
          <input id="minPoints" name="minPoints" type="number" min={1} required
            defaultValue={defaults?.minPoints ?? 100} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="decay">Decay</label>
          <input id="decay" name="decay" type="number" min={1} required
            defaultValue={defaults?.decay ?? 20} className={inputCls} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <legend className="px-1 text-xs uppercase tracking-wide text-slate-400">
          Flag
        </legend>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="matchMode">Match mode</label>
          <select id="matchMode" name="matchMode" value={matchMode}
            onChange={(e) => setMatchMode(e.target.value as typeof matchMode)}
            className={inputCls}>
            {Object.entries(MATCH_MODE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="flag">
            {isEdit ? "Flag (leave blank to keep current)" : "Flag"}
          </label>
          {isMulti ? (
            <textarea id="flag" name="flag" rows={4}
              placeholder={"answer one\nanswer two"} className={`${inputCls} font-mono`} />
          ) : (
            <input id="flag" name="flag" className={`${inputCls} font-mono`}
              placeholder="flag{...}" autoComplete="off" />
          )}
          <p className="text-xs text-slate-500">{flagHelp[matchMode]}</p>
        </div>
      </fieldset>

      <div className="space-y-1">
        <label className={labelCls} htmlFor="files">
          Attach files (images, txt, downloadables)
        </label>
        <input id="files" name="files" type="file" multiple
          className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-white/15" />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        <DecryptedText
          text={pending ? "Saving…" : isEdit ? "Save changes" : "Create challenge"}
        />
      </button>
    </form>
  );
}
