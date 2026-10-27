/**
 * Single-user local studio.
 * Replace getActor() with a real session lookup when accounts are needed.
 * Mutations call it so the seam stays in one place.
 */
export type Actor = {
  id: string;
  name: string;
  email: string;
};

export async function getActor(): Promise<Actor> {
  return {
    id: "local",
    name: "Sydney builder",
    email: "local@idealab",
  };
}
