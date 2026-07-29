import { expect, test } from "@playwright/test";

import {
  cleanupAnnouncement,
  cleanupDirectChatTarget,
  cleanupIncomingDirectMessage,
  createDirectChatTarget,
  openMessenger,
  seedIncomingDirectMessage,
} from "./utils/notification";

test("notification center shows unread incoming messages in a centered dialog", async ({
  page,
  request,
}) => {
  const body = `Incoming Playwright message ${crypto.randomUUID()}`;
  const fixture = await seedIncomingDirectMessage(request, body);
  try {
    await page.goto("/");
    await expect(page.getByText("Enable notifications to receive messages")).toBeVisible();
    const accountTrigger = page.getByLabel("Open account menu");
    const unreadAfterSeed = fixture.unreadBefore + 1;
    await expect(accountTrigger.locator('[data-slot="badge"]')).toHaveText(
      unreadAfterSeed > 99 ? "99+" : String(unreadAfterSeed)
    );

    const dialog = await openMessenger(page);
    const box = await dialog.boundingBox();
    const viewport = await page.evaluate(() => ({
      height: document.documentElement.clientHeight,
      width: document.documentElement.clientWidth,
    }));
    if (!box) throw new Error("Messenger geometry is unavailable");
    // Base UI compensates for the removed page scrollbar while the modal is open.
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(8);
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2);
    expect(box.width).toBeLessThan(viewport.width);
    expect(box.height).toBeLessThan(viewport.height);

    await page.getByRole("button", { name: new RegExp(fixture.sender.name) }).click();
    await expect(page.getByRole("article").getByText(body, { exact: true })).toBeVisible();
    if (fixture.unreadBefore === 0) {
      await expect(accountTrigger.locator('[data-slot="badge"]')).toHaveCount(0);
    } else {
      await expect(accountTrigger.locator('[data-slot="badge"]')).toHaveText(
        fixture.unreadBefore > 99 ? "99+" : String(fixture.unreadBefore)
      );
    }
  } finally {
    await cleanupIncomingDirectMessage(request, fixture);
  }
});

test("user starts a direct conversation and sends a text message", async ({ page, request }) => {
  const fixture = await createDirectChatTarget(request);
  const messageLine = `Outgoing Playwright message ${crypto.randomUUID()}`;
  const body = Array.from({ length: 60 }, (_, index) => `${messageLine} ${index + 1}`).join("\n");
  try {
    await test.step("open a direct thread and persist its message", async () => {
      await page.goto("/");
      await openMessenger(page);
      await test.step("search for the recipient", async () => {
        await page.getByLabel("Start a conversation").click();
        await page.getByPlaceholder("Search people").fill(fixture.target.name);
        await expect(
          page.getByRole("button", { name: new RegExp(fixture.target.name) })
        ).toBeVisible();
      });
      await test.step("select the recipient", async () => {
        await page.getByRole("button", { name: new RegExp(fixture.target.name) }).click();
        await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
      });
      await test.step("send the message", async () => {
        await page.getByLabel("Message", { exact: true }).fill(body);
        await page.getByLabel("Send message").click();
        const message = page.getByRole("article").filter({
          has: page.getByText(body, { exact: true }),
        });
        await expect(message).toBeVisible();
        await expect(message.locator("time")).toHaveText(/^\d+s ago$/);

        const viewport = page.locator('[data-slot="message-scroller-viewport"]');
        await expect
          .poll(() =>
            viewport.evaluate(
              (element) => element.scrollHeight - element.clientHeight - element.scrollTop
            )
          )
          .toBeLessThanOrEqual(1);
      });
    });
  } finally {
    await test.step("clean up the direct thread fixture", async () => {
      await cleanupDirectChatTarget(request, fixture);
    });
  }
});

test("administrator schedules an announcement from the pinned thread", async ({ page }) => {
  const title = `Playwright announcement ${crypto.randomUUID()}`;
  try {
    await page.goto("/");
    await openMessenger(page);
    await expect(page.getByText("Announcements", { exact: true }).first()).toBeVisible();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await dialog.getByLabel("Create notification").click();
    await dialog.getByLabel("Title", { exact: true }).fill(title);
    await dialog.getByLabel("Audience").selectOption("all");
    await dialog
      .getByLabel("Announcement", { exact: true })
      .fill("Scheduled by the notification E2E suite");
    await dialog.getByRole("textbox", { name: "Schedule", exact: true }).fill("2099-01-01T10:00");
    await dialog.getByRole("button", { name: "Schedule announcement" }).click();
    await expect(page.getByText("Announcement scheduled")).toBeVisible();
    const scheduledSection = dialog.getByRole("region", { name: "Scheduled notifications" });
    await expect(scheduledSection.getByText(title, { exact: true })).toBeVisible();
    await expect(scheduledSection.getByText("Scheduled for", { exact: false })).toBeVisible();
  } finally {
    await cleanupAnnouncement(title);
  }
});
