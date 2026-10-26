// Money and phone helpers for the Ka-Ezy hire flow (Uganda: UGX, +256).

/** 14700 -> "UGX 14,700" */
export function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-US")}`;
}

export type Network = "mtn" | "airtel";

export const NETWORKS: Record<Network, { name: string; logo: string; ussd: string }> = {
  mtn: { name: "MTN MoMo", logo: "/images/brand/mtn.webp", ussd: "*165#" },
  airtel: { name: "Airtel Money", logo: "/images/brand/airtel.webp", ussd: "*185#" },
};

/**
 * A Ugandan mobile number typed any common way ("0772 123456",
 * "+256 772 123 456", "772123456") -> its 9 national digits, or null.
 */
export function ugNationalNumber(input: string): string | null {
  // Also "+256 (0) 772 ...", "00256 772 ..." and "+2560772...".
  const digits = input.replace(/\D/g, "").replace(/^(?:00)?256/, "").replace(/^0/, "");
  return /^7\d{8}$/.test(digits) ? digits : null;
}

/**
 * The network for prefixes that clearly belong to one (MTN 76-78, Airtel
 * 70, 74, 75). Anything else is left to the visitor to pick.
 */
export function networkFor(national: string): Network | null {
  const prefix = national.slice(0, 2);
  if (["76", "77", "78"].includes(prefix)) return "mtn";
  if (["70", "74", "75"].includes(prefix)) return "airtel";
  return null;
}

/** "772123456" -> "+256 772 123 456" */
export function formatUgPhone(national: string): string {
  return `+256 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}
