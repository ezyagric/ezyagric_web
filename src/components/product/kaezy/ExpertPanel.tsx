"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Camera } from "lucide-react";
import { Chips, Composer } from "./Composer";
import { diagnosisCategory, fill, promptsFor, type Profile, type TryIt } from "./personalise";
import { readPhoto } from "./photo";
import { KaEzyAskError, demoService, normalise, wait, type KaEzyChatService } from "./service";
import { demo, newId, type Conversation, type Message, type Photo } from "./store";
import { SMALL_PRIMARY, Thread, type ThreadLabels } from "./Thread";

/** The question box's id ("Ask Ka-Ezy" links put the cursor in it: KaEzyDemo). */
export const QUESTION_ID = "kaezy-question";

/** After this many answers, Ka-Ezy suggests hiring it. */
const NUDGE_AFTER = 2;

type Sample = TryIt["diagnosis"]["samples"][number];

/**
 * The visitor's own photo, waiting to be sent: the copy shown and kept, and
 * (live answers) the copy for Ka-Ezy. The original file is not kept.
 */
type Waiting = { photo: Photo; sent: Blob | null };

/**
 * Farm Expert: the app's chat (greeting, "Try asking" tiles, answers,
 * composer), personalised from "Your farm": the starter questions follow
 * the chosen crop or animal, and answers use the farmer's name, location
 * and land size. `live` answers through the guest demo endpoint; without
 * it, from the sample answers.
 *
 * It also checks photos, like the app's diagnosis mode: a sample photo gets
 * its sample diagnosis. The visitor's own photo goes to Ka-Ezy with live
 * answers; with sample answers it stays on the device, and Ka-Ezy says
 * honestly that only the app can check it.
 */
export function ExpertPanel({
  copy,
  profile,
  conversation,
  avatar,
  hireHref,
  live,
  labels,
  onChooseValueChain,
  onSignIn,
}: {
  copy: TryIt;
  profile: Profile;
  conversation: Conversation | undefined;
  avatar: string;
  hireHref: string;
  live: KaEzyChatService | null;
  labels: ThreadLabels;
  onChooseValueChain: () => void;
  /** Builds with sign-in: a sample answer to the visitor's own question offers it. */
  onSignIn?: () => void;
}) {
  const chat = copy.chat;
  const d = copy.diagnosis;
  const prompts = promptsFor(chat, copy.valueChains, profile);
  // The conversation waiting for Ka-Ezy, if any (the "thinking" bubble shows only there).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const thinking = pendingId !== null;
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoError, setPhotoError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoButtonRef = useRef<HTMLButtonElement>(null);
  // How the photo picker was opened: from the keyboard, focus the question box after.
  const pickedByKeyboard = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const messages = conversation?.messages ?? [];

  useEffect(() => () => abortRef.current?.abort(), []);

  // The sample photos, the chosen crop's first.
  const samples = [...d.samples].sort(
    (a, b) => Number(b.crop === profile.valueChain) - Number(a.crop === profile.valueChain),
  );

  /**
   * Adds the visitor's message to Farm Expert's open conversation, then
   * Ka-Ezy's reply from `reply` (and, after the second answer, the nudge to
   * hire it).
   */
  async function send(
    text: string,
    photo: Photo | undefined,
    reply: (conversationId: string, signal: AbortSignal) => Promise<Message[]>,
  ) {
    // Whatever went wrong with an earlier photo, the visitor has moved on.
    setPhotoError("");
    const you: Message = photo ? { id: newId(), from: "you", text, photo } : { id: newId(), from: "you", text };
    const conversationId = demo.append("expert", [you], text);
    setPendingId(conversationId);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const out = await reply(conversationId, controller.signal);
      const answered =
        (demo.conversation(conversationId)?.messages ?? []).filter((m) => m.from === "kaezy" || m.from === "diagnosis")
          .length + 1;
      if (answered === NUDGE_AFTER) out.push({ id: newId(), from: "nudge", text: chat.nudge });
      demo.appendTo(conversationId, out);
    } catch (error) {
      // Anything else is an abort (the visitor left the page): nothing to show.
      if (error instanceof KaEzyAskError) {
        demo.appendTo(conversationId, [
          { id: newId(), from: error.reason === "limit" ? "limit" : "error", text: chat.errors[error.reason] },
        ]);
      }
    } finally {
      setPendingId(null);
    }
  }

  /** A typed question, with the waiting photo if there is one. */
  function ask(question: string) {
    const typed = question.trim();
    if (thinking || (!typed && !waiting)) return;
    const own = waiting;
    setWaiting(null);
    setPhotoStatus("");
    const text = typed || d.question;
    void send(text, own?.photo, async (conversationId, signal) => {
      // Sample answers cannot answer the visitor's own question or photo:
      // say so, and (with sign-in on this build) offer the real Ka-Ezy here.
      const offer: Message[] = onSignIn ? [{ id: newId(), from: "signin", text: chat.signInPrompt }] : [];
      if (own && !live) {
        await wait(1600, signal);
        return [{ id: newId(), from: "kaezy", text: fill(d.ownPhotoReply, profile) }, ...offer];
      }
      const isSample = !live && !prompts.some((p) => normalise(p.q) === normalise(text));
      const service =
        live ?? demoService({ answers: prompts, otherQuestion: fill(chat.ownQuestionReply, profile) });
      const reply = await service.ask(
        // A photo check sends the app's diagnosis form as the question.
        own ? JSON.stringify({ type: diagnosisCategory(profile, copy.valueChains), symptoms: [], notes: text }) : text,
        signal,
        {
          mode: own ? "diagnosis" : "chat",
          profile,
          threadId: demo.threadOf(conversationId),
          photos: own?.sent ? [own.sent] : undefined,
        },
      );
      if (reply.threadId) demo.setThread(conversationId, reply.threadId);
      const out: Message[] = [
        reply.video ? { id: newId(), from: "kaezy", text: reply.text, video: reply.video } : { id: newId(), from: "kaezy", text: reply.text },
      ];
      if (reply.records) {
        out.push({ id: newId(), from: "record", text: copy.records.prompt, records: reply.records, status: "pending" });
      }
      if (isSample) out.push(...offer);
      return out;
    });
  }

  /** A sample photo: its question, then its sample diagnosis. */
  function askSample(sample: Sample) {
    if (thinking) return;
    const text = fill(sample.question, profile);
    void send(text, sample.photo, async (_conversationId, signal) => {
      await wait(2200, signal);
      return [
        {
          id: newId(),
          from: "diagnosis",
          diagnosis: {
            kind: sample.kind,
            name: sample.name,
            crop: sample.crop,
            intro: fill(sample.intro, profile),
            signs: sample.signs,
            steps: sample.steps,
          },
        },
      ];
    });
  }

  /**
   * Asking from a tile or chip removes that button, so move focus: to the
   * composer for keyboard users, to the conversation for taps (focusing the
   * composer on a phone would open the keyboard over the answer).
   */
  function askFromButton(event: MouseEvent, question: string) {
    const sample = samples.find((s) => fill(s.question, profile) === question);
    if (sample) askSample(sample);
    else ask(question);
    const target = event.detail === 0 ? inputRef.current : threadRef.current;
    target?.focus({ preventScroll: true });
  }

  function choosePhoto(keyboard: boolean) {
    pickedByKeyboard.current = keyboard;
    setPhotoError("");
    // Emptied now, so "Photo added" is announced again when a waiting photo is replaced.
    setPhotoStatus("");
    fileRef.current?.click();
  }

  async function onPhotoChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared, so choosing the same photo again still counts as a change.
    event.target.value = "";
    if (!file) return;
    try {
      const { kept, sent } = await readPhoto(file, !!live);
      setWaiting({ photo: { ...kept, alt: d.photoAlt }, sent });
      setPhotoError("");
      setPhotoStatus(d.added);
      if (pickedByKeyboard.current) inputRef.current?.focus();
    } catch {
      // A photo already waiting stays: only the new one failed.
      setPhotoError(d.unreadable);
    }
  }

  function removePhoto() {
    setWaiting(null);
    setPhotoStatus("");
    setPhotoError("");
    // The remove button goes: keep focus on the photo button.
    photoButtonRef.current?.focus();
  }

  const askedKeys = messages.filter((m) => m.from === "you").map((m) => normalise(m.text));
  const remaining = prompts.filter((p) => !askedKeys.includes(normalise(p.q))).map((p) => p.q);
  const shownPhotos = messages.flatMap((m) => (m.from === "you" && m.photo ? [m.photo.src] : []));
  const remainingSamples = samples.filter((s) => !shownPhotos.includes(s.photo.src));
  const greeting = profile.name.trim() ? fill(chat.greetingNamed, profile) : chat.greeting;

  return (
    <>
      <Thread
        threadRef={threadRef}
        messages={messages}
        thinking={thinking && pendingId === conversation?.id}
        avatar={avatar}
        hireHref={hireHref}
        label="Conversation with Ka-Ezy"
        labels={labels}
        onRecord={recordDecision}
        onSignIn={onSignIn}
        empty={
          // shrink-0: when it is taller than the conversation area, it scrolls from its top
          // (shrunk to fit, its centred content would spill out above, out of reach).
          <div className="flex min-h-full shrink-0 flex-col justify-center text-center">
            <p className="text-2xl font-heading tracking-heading text-heading">{greeting}</p>
            <p className="mx-auto mt-1 max-w-lg text-base text-pretty text-muted">{chat.subtitle}</p>
            {profile.valueChain ? (
              <p className="mx-auto mt-3 inline-flex rounded-pill bg-brand-soft px-3 py-1 text-sm font-label text-title">
                {fill(chat.personalised, profile)}
              </p>
            ) : (
              <button
                type="button"
                onClick={onChooseValueChain}
                className="mx-auto mt-2 min-h-11 cursor-pointer rounded-control px-2 text-sm font-label text-link underline"
              >
                {chat.choosePrompt}
              </button>
            )}
            <p className="mt-3 text-sm text-label-style text-label">{chat.tryAsking}</p>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-left">
              {prompts.map((prompt, i) => (
                <li key={prompt.q}>
                  <button
                    type="button"
                    onClick={(event) => askFromButton(event, prompt.q)}
                    data-track="kaezy_try_prompt"
                    data-track-prompt={String(i + 1)}
                    className="flex h-full min-h-12 w-full cursor-pointer items-center rounded-control border border-line bg-card px-3 py-2.5 text-sm font-label text-title transition-colors hover:border-secondary hover:bg-brand-soft"
                  >
                    {prompt.q}
                  </button>
                </li>
              ))}
            </ul>

            {/* The photo check: add a photo, or try a sample one. The composer's
                own photo button is below it. */}
            <div className="mt-2 rounded-control border border-line bg-subtle p-3 text-left">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
                >
                  <Camera className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-title">{d.title}</span>
                  <span className="block text-sm text-pretty text-muted">{d.text}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={(event) => choosePhoto(event.detail === 0)}
                  data-track="kaezy_try_photo"
                  className={SMALL_PRIMARY}
                >
                  <Camera aria-hidden="true" className="size-4" />
                  {d.upload}
                </button>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-muted">{d.samplesTitle}</span>
                  {/* role="list": Safari drops the list role from unstyled lists. */}
                  <ul role="list" className="flex gap-1.5">
                    {samples.map((sample) => (
                      <li key={sample.photo.src}>
                        <button
                          type="button"
                          onClick={(event) => askFromButton(event, fill(sample.question, profile))}
                          aria-label={`${d.sampleLabel}: ${fill(sample.question, profile)}`}
                          title={sample.crop}
                          data-track="kaezy_try_sample_photo"
                          data-track-item={sample.crop}
                          className="block size-11 cursor-pointer overflow-hidden rounded-control ring-1 ring-line transition hover:ring-2 hover:ring-secondary"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- small static sample photo */}
                          <img
                            src={sample.photo.src}
                            alt=""
                            width={sample.photo.width}
                            height={sample.photo.height}
                            className="size-full object-cover"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </span>
              </div>
            </div>

          </div>
        }
      />
      <div className="border-t border-line bg-card p-3">
        {messages.length > 0 ? (
          <Chips
            label="More questions to try"
            items={[...remaining, ...remainingSamples.map((s) => fill(s.question, profile))]}
            disabled={thinking}
            onPick={askFromButton}
            track="kaezy_try_prompt"
            photoOf={(item) => {
              const sample = remainingSamples.find((s) => fill(s.question, profile) === item);
              return sample
                ? { src: sample.photo.src, label: d.sampleLabel, track: "kaezy_try_sample_photo", item: sample.crop }
                : undefined;
            }}
          />
        ) : null}
        {photoError ? (
          <p role="alert" className="mb-2 px-1 text-sm font-label text-danger">
            {photoError}
          </p>
        ) : null}
        <p role="status" className="sr-only">
          {photoStatus}
        </p>
        {/* Opened by the photo buttons. No `capture`: phones offer the camera and the gallery. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void onPhotoChosen(event)}
          className="hidden"
        />
        <Composer
          id={QUESTION_ID}
          label="Your question for Ka-Ezy"
          placeholder={waiting ? d.placeholder : chat.placeholder}
          disabled={thinking}
          onSend={ask}
          inputRef={inputRef}
          track="kaezy_try_ask"
          attach={{
            label: d.attach,
            removeLabel: d.remove,
            photo: waiting?.photo ?? null,
            hint: d.added,
            note: live ? d.privacyLive : d.privacy,
            onAdd: choosePhoto,
            onRemove: removePhoto,
          }}
          attachRef={photoButtonRef}
        />
        <p className="mt-2 px-1 text-xs text-muted">{chat.disclaimer}</p>
      </div>
    </>
  );

  function recordDecision(message: Message, save: boolean) {
    if (!conversation || message.from !== "record") return;
    demo.updateMessage(conversation.id, message.id, (m) =>
      m.from === "record" ? { ...m, status: save ? "saved" : "dismissed" } : m,
    );
    if (save) demo.saveRecords(message.records);
  }
}
