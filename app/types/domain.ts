// The four AWS Certified Solutions Architect – Associate (SAA-C03) exam domains.
// Values are the numbers persisted in the data/db; the named members let code
// refer to a domain symbolically (e.g. `Domain.DesignSecureArchitectures`).
export enum Domain {
  DesignSecureArchitectures = 1,
  DesignResilientArchitectures = 2,
  DesignHighPerformingArchitectures = 3,
  DesignCostOptimizedArchitectures = 4,
}

/** Human-readable label for each domain (matches the official exam guide). */
export const DOMAIN_LABELS: Record<Domain, string> = {
  [Domain.DesignSecureArchitectures]: "Design Secure Architectures",
  [Domain.DesignResilientArchitectures]: "Design Resilient Architectures",
  [Domain.DesignHighPerformingArchitectures]:
    "Design High-Performing Architectures",
  [Domain.DesignCostOptimizedArchitectures]:
    "Design Cost-Optimized Architectures",
};

/** The domains in canonical exam order — handy for building filters/legends. */
export const ALL_DOMAINS: Domain[] = [
  Domain.DesignSecureArchitectures,
  Domain.DesignResilientArchitectures,
  Domain.DesignHighPerformingArchitectures,
  Domain.DesignCostOptimizedArchitectures,
];

/** Narrowing guard for raw numbers coming from the data layer. */
export function isDomain(value: unknown): value is Domain {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
