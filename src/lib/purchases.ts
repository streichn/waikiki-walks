import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { PLANS, REVENUECAT } from '../config';
import { useAccount } from '../store';

/**
 * Payments go through Apple In-App Purchase and Google Play Billing (required by both
 * stores for digital content). RevenueCat wraps both, validates receipts, and tells us
 * whether the walker has the "all_walks" entitlement.
 *
 * Products (create in App Store Connect / Play Console, then add to RevenueCat's current offering):
 *   ww_week_pass  non-renewing subscription, 7 days, all walks. NOT attached to the entitlement:
 *                 Apple sends no expiry date for non-renewing purchases, so we compute it here.
 *   ww_forever    non-consumable, attached to the "all_walks" entitlement.
 */

let configured = false;

export function isConfigured() {
  return configured;
}

const DAY_MS = 86400000;

/**
 * When a run of week passes ends. Passes stack: a pass bought while another is still active
 * starts when the active one ends, so a walker never loses days they paid for.
 */
export function passEnd(purchaseTimes: number[], days: number = PLANS.weekPass.days): number | null {
  if (!purchaseTimes.length) return null;
  let end = 0;
  for (const t of [...purchaseTimes].sort((a, b) => a - b)) end = Math.max(end, t) + days * DAY_MS;
  return end;
}

/** When the walker's week pass runs out, or null if they never bought one. */
export function weekPassExpiry(info: CustomerInfo): Date | null {
  const times = info.nonSubscriptionTransactions
    .filter((t) => t.productIdentifier === PLANS.weekPass.productId)
    .map((t) => Date.parse(t.purchaseDate))
    .filter((n) => Number.isFinite(n));
  const end = passEnd(times);
  return end === null ? null : new Date(end);
}

/** Whether the walker owns the forever unlock (not just a pass). */
export function ownsForever(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[REVENUECAT.entitlement]);
}

/** "Wed, Nov 25, 3:40 PM" in the walker's own locale. */
export function formatPassEnd(ms: number): string {
  return new Date(ms).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function hasAccess(info: CustomerInfo) {
  if (ownsForever(info)) return true;
  const exp = weekPassExpiry(info);
  return Boolean(exp && exp.getTime() > Date.now());
}

function apply(info: CustomerInfo) {
  useAccount.getState().setPro(hasAccess(info));
  const exp = weekPassExpiry(info);
  // A forever owner has no pass end to show, even if they bought a pass first.
  useAccount.getState().setPassExpiry(!ownsForever(info) && exp && exp.getTime() > Date.now() ? exp.getTime() : undefined);
}

export async function initPurchases(appUserId?: string) {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT.iosKey : REVENUECAT.androidKey;
  if (!apiKey || configured) return;
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
  Purchases.addCustomerInfoUpdateListener(apply);
  try {
    apply(await Purchases.getCustomerInfo());
  } catch {}
}

export async function loadPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  apply(customerInfo);
  return hasAccess(customerInfo);
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  apply(info);
  return hasAccess(info);
}

export async function linkUser(userId: string) {
  if (configured) await Purchases.logIn(userId).catch(() => undefined);
}

export async function unlinkUser() {
  if (configured) await Purchases.logOut().catch(() => undefined);
}

export async function manageSubscriptionUrl(): Promise<string | null> {
  if (!configured) return null;
  const info = await Purchases.getCustomerInfo();
  return info.managementURL ?? null;
}
