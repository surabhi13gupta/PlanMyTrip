import { expect, test, type Page } from '@playwright/test'
import { addDays, format } from 'date-fns'

const iso = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
const uniqueUser = () => `e2e_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
const PASSWORD = 'correct-horse-42'

async function signUp(page: Page, username: string) {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to PlanMyTrip' })).toBeVisible()
}

async function addTrip(page: Page) {
  await page.getByRole('link', { name: '+ Add new trip' }).first().click()
  await expect(page.getByRole('heading', { name: 'Plan a new trip' })).toBeVisible()
  await page.getByLabel('From').fill(iso(10))
  await page.getByLabel('To').fill(iso(14))
  await expect(page.getByText('5 days')).toBeVisible()
  await page.getByLabel('Destination').fill('Paris, France')
  await page.getByText('Couple', { exact: true }).click()
  await page.getByRole('button', { name: 'Plan' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Paris, France' })).toBeVisible()
}

async function addActivity(page: Page, day: number, title: string, time = '') {
  const card = page.locator(`#day-${day}`)
  await card.getByRole('button', { name: '+ Add activity' }).click()
  await card.getByLabel('Title').fill(title)
  if (time) await card.getByLabel('Time (optional)').fill(time)
  await card.getByRole('button', { name: 'Save' }).click()
  await expect(card.getByText(title)).toBeVisible()
}

test('sign up → add new trip → add activities → Print downloads the PDF', async ({ page }) => {
  await signUp(page, uniqueUser())
  await expect(page.getByText('No trips yet. Add your first trip to start planning.')).toBeVisible()

  await addTrip(page)
  for (const n of [1, 2, 3, 4, 5]) {
    await expect(page.getByRole('heading', { level: 2, name: `Day ${n}` })).toBeVisible()
  }
  await expect(page.locator('#day-1').getByText('No activities planned')).toBeVisible()

  await addActivity(page, 2, 'Walk along the Seine')
  await addActivity(page, 2, 'Visit the Louvre', '09:00')
  // Timed activities come first.
  const titles = page.locator('#day-2 li .font-medium.break-words')
  await expect(titles).toHaveText(['Visit the Louvre', 'Walk along the Seine'])

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Print' }).click()
  expect((await download).suggestedFilename()).toBe(`Paris-France-${iso(10)}-itinerary.pdf`)

  // No sideways scrolling at this width (the day chips scroll inside their own strip).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  // Back on My Trips, the trip is listed.
  await page.getByRole('link', { name: 'PlanMyTrip' }).click()
  await expect(page.getByRole('heading', { level: 3, name: 'Paris, France' })).toBeVisible()
})

test('refresh keeps you logged in; closing the page saves the unsaved activity and logs you out', async ({
  context,
}) => {
  const username = uniqueUser()
  const page = await context.newPage()
  await signUp(page, username)
  await addTrip(page)
  const tripUrl = page.url()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Paris, France' })).toBeVisible()

  // Start an activity but don't click Save, then close the tab.
  const day3 = page.locator('#day-3')
  await day3.getByRole('button', { name: '+ Add activity' }).click()
  await day3.getByLabel('Title').fill('Dinner cruise')
  await page.close({ runBeforeUnload: true })
  // The save is sent with keepalive as the tab closes; give it a moment to land before the
  // reopened tab ends the old session. (A real user reopens much later than this.)
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Reopening (a new tab, same browser): asked to log in again.
  const reopened = await context.newPage()
  await reopened.goto(tripUrl)
  await expect(reopened).toHaveURL(/\/login\?redirect=/)
  await reopened.getByLabel('Username').fill(username)
  await reopened.getByLabel('Password').fill(PASSWORD)
  await reopened.getByRole('button', { name: 'Log in' }).click()

  // Back on the trip, with the activity that was saved as the page closed.
  await expect(reopened).toHaveURL(tripUrl)
  await expect(reopened.locator('#day-3').getByText('Dinner cruise')).toBeVisible()
})
