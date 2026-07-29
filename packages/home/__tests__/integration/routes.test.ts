import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";
import { deleteFile, fileExists, readFileText } from "@modular-vsa/storage";

import { createAuthenticatedHomeClient } from "./utils/auth";

const runId = `${Date.now()}-${crypto.randomUUID()}`;
const createdPostIds = new Set<number>();
const uploadedKeys = new Set<string>();

let api: Awaited<ReturnType<typeof createAuthenticatedHomeClient>>;

async function seedPost(overrides: Partial<typeof post.$inferInsert> = {}) {
  const [created] = await db
    .insert(post)
    .values({
      title: `Integration post ${runId}`,
      content: "Seeded by the Home route integration suite",
      published: false,
      ...overrides,
    })
    .returning();

  if (!created) throw new Error("Failed to seed an integration post");
  createdPostIds.add(created.id);
  return created;
}

beforeAll(async () => {
  api = await createAuthenticatedHomeClient();
});

afterEach(async () => {
  if (createdPostIds.size > 0) {
    await db.delete(post).where(inArray(post.id, [...createdPostIds]));
    createdPostIds.clear();
  }

  await Promise.all([...uploadedKeys].map(async (key) => await deleteFile(key)));
  uploadedKeys.clear();
});

describe("Home controller routes", () => {
  test("creates a post", async () => {
    const { data, error, status } = await api.home.post({
      title: ` Created ${runId} `,
      content: "Created through Eden",
      published: false,
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toMatchObject({
      title: `Created ${runId}`,
      content: "Created through Eden",
      published: false,
    });

    if (!data) throw new Error("Create route returned no data");
    createdPostIds.add(data.id);
  });

  test("lists posts with title and publication filters", async () => {
    const matching = await seedPost({ title: `Needle ${runId}`, published: true });
    await seedPost({ title: `Other ${runId}`, published: false });

    const { data, error } = await api.home.get({
      query: { title: `Needle ${runId}`, published: true },
    });

    expect(error).toBeNull();
    expect(data?.map(({ id }) => id)).toEqual([matching.id]);
  });

  test("reads a post by id", async () => {
    const seeded = await seedPost();
    const { data, error } = await api.home({ id: seeded.id }).get();

    expect(error).toBeNull();
    expect(data).toMatchObject({ id: seeded.id, title: seeded.title });
  });

  test("updates a post by id", async () => {
    const seeded = await seedPost();
    const { data, error } = await api.home({ id: seeded.id }).patch({
      title: ` Updated ${runId} `,
      published: true,
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: seeded.id,
      title: `Updated ${runId}`,
      published: true,
    });
  });

  test("deletes a post by id", async () => {
    const seeded = await seedPost();
    const { data, error } = await api.home({ id: seeded.id }).delete();

    expect(error).toBeNull();
    expect(data).toEqual({ success: true, message: "Post deleted successfully" });

    createdPostIds.delete(seeded.id);
    const rows = await db
      .select({ id: post.id })
      .from(post)
      .where(inArray(post.id, [seeded.id]));
    expect(rows).toEqual([]);
  });

  test("uploads a file", async () => {
    const key = `integration/${runId}.txt`;
    const contents = `Home upload integration ${runId}`;
    uploadedKeys.add(key);

    const { data, error } = await api.home.upload.post({
      file: new File([contents], "integration.txt", { type: "text/plain" }),
      key,
    });

    expect(error).toBeNull();
    expect(data?.key).toBe(key);
    expect(data?.url).toContain(key);
    expect(await fileExists(key)).toBe(true);
    expect(await readFileText(key)).toBe(contents);
  });
});
