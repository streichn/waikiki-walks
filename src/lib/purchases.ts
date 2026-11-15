import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT } from '../config';
import { useAccount } from '../store';

/**
 * Payments go through Apple In-App Purchase and Google Play Billing (required by both
 * stores for digital content). RevenueCat wraps both, validates receipts, and tells us
 * whether the walker has the "all_walks" entitlement.
 *
 * Suggested products (create in App Store Connect / Play Console, then attach in RevenueCat):
 *   ww_monthly   auto-renewing monthly
 *   ww_annual    auto-renewing yearly, with a free trial
 *   ww_lifetime  one-time unlock of all twelve walks
 */

let configured = false;

export function isConfigured() {
  return configured;
}

function apply(info: CustomerInfo) {
  useAccount.getState().setPro(Boolean(info.entitlements.active[REVENUECAT.entitlement]));
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
  return Boolean(customerInfo.entitlements.active[REVENUECAT.entitlement]);
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  apply(info);
  return Boolean(info.entitlements.active[REVENUECAT.entitlement]);
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
