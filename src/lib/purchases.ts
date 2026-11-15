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

/** When the newest week pass runs out, or null if there is none. */
export function weekPassExpiry(info: CustomerInfo): Date | null {
  const passes = info.nonSubscriptionTransactions.filter((t) => t.productIdentifier === PLANS.weekPass.productId);
  if (!passes.length) return null;
  const latest = Math.max(...passes.map((t) => Date.parse(t.purchaseDate)));
  return new Date(latest + PLANS.weekPass.days * 86400000);
}

function hasAccess(info: CustomerInfo) {
  if (info.entitlements.active[REVENUECAT.entitlement]) return true;
  const exp = weekPassExpiry(info);
  return Boolean(exp && exp.getTime() > Date.now());
}

function apply(info: CustomerInfo) {
  useAccount.getState().setPro(hasAccess(info));
  const exp = weekPassExpiry(info);
  useAccount.getState().setPassExpiry(exp && exp.getTime() > Date.now() ? exp.getTime() : undefined);
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
