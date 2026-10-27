"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "./auth";
import { ImportError } from "./merge";
import { saveWeights, commitImport, previewImport, updateTracking, type TrackingPatch } from "./store";
import type { Weights } from "./criteria";
import type { Status } from "./types";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveTrackingAction(input: TrackingPatch & { id: string }) {
  const actor = await getActor();
  const { id, ...patch } = input;
  updateTracking(id, patch, actor.id);
  refresh();
}

export async function saveWeightsAction(input: { weights: Weights; note: string }) {
  const actor = await getActor();
  const result = saveWeights(input.weights, input.note, actor.id);
  refresh();
  return result;
}

export async function previewImportAction(text: string) {
  await getActor();
  try {
    return { ok: true as const, report: previewImport(text) };
  } catch (error) {
    const message = error instanceof ImportError || error instanceof Error ? error.message : "Could not read that file.";
    return { ok: false as const, error: message };
  }
}

export async function commitImportAction(text: string) {
  const actor = await getActor();
  try {
    const result = commitImport(text, actor.id);
    refresh();
    return { ok: true as const, ...result };
  } catch (error) {
    const message = error instanceof ImportError || error instanceof Error ? error.message : "Import failed.";
    return { ok: false as const, error: message };
  }
}

export async function setStatusAction(id: string, status: Status, pipelineOrder?: number) {
  const actor = await getActor();
  updateTracking(id, { status, pipelineOrder }, actor.id);
  refresh();
}
