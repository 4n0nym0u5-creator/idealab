"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "./auth";
import { ImportError } from "./merge";
import { assertCanWrite, lockSession, unlockSession } from "./session";
import { saveWeights, commitImport, previewImport, updateTracking, type TrackingPatch } from "./store";
import type { Weights } from "./criteria";
import type { Status } from "./types";

function refresh() {
  revalidatePath("/", "layout");
}

function failure(error: unknown, fallback: string) {
  return error instanceof ImportError || error instanceof Error ? error.message : fallback;
}

export async function saveTrackingAction(input: TrackingPatch & { id: string }) {
  try {
    await assertCanWrite();
    const actor = await getActor();
    const { id, ...patch } = input;
    await updateTracking(id, patch, actor.id);
    refresh();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Could not save.") };
  }
}

export async function saveWeightsAction(input: { weights: Weights; note: string }) {
  try {
    await assertCanWrite();
    const actor = await getActor();
    const result = await saveWeights(input.weights, input.note, actor.id);
    refresh();
    return { ok: true as const, version: result.version };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Could not save weights.") };
  }
}

export async function previewImportAction(text: string) {
  try {
    await assertCanWrite();
    await getActor();
    return { ok: true as const, report: await previewImport(text) };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Could not read that file.") };
  }
}

export async function commitImportAction(text: string) {
  try {
    await assertCanWrite();
    const actor = await getActor();
    const result = await commitImport(text, actor.id);
    refresh();
    return { ok: true as const, ...result };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Import failed.") };
  }
}

export async function setStatusAction(id: string, status: Status, pipelineOrder?: number) {
  try {
    await assertCanWrite();
    const actor = await getActor();
    await updateTracking(id, { status, pipelineOrder }, actor.id);
    refresh();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Could not move that idea.") };
  }
}

export async function unlockAction(password: string) {
  try {
    await unlockSession(password);
    refresh();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: failure(error, "Could not unlock editing.") };
  }
}

export async function lockAction() {
  await lockSession();
  refresh();
}
