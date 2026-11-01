/**
 * Role-based default access policy for the Smart Campus gates.
 *
 * Used as a fallback when a user has no explicit Authorization row for a gate,
 * so newly added users work immediately instead of being denied everywhere.
 * Pure functions with plain strings, so it does not depend on your Prisma field names.
 */

export type UserType = 'STUDENT' | 'FACULTY' | 'STAFF' | 'SECURITY' | 'VISITOR'
export type GateType = 'MAIN' | 'LIBRARY' | 'LABORATORY' | 'SECONDARY' | 'PARKING'

const ALL_GATES: GateType[] = ['MAIN', 'LIBRARY', 'LABORATORY', 'SECONDARY', 'PARKING']

export const ROLE_GATES: Record<UserType, GateType[]> = {
  STUDENT: ['MAIN', 'LABORATORY', 'LIBRARY'],
  FACULTY: ALL_GATES,
  STAFF: ALL_GATES,
  SECURITY: ALL_GATES, // assumption: security staff patrol every gate
  VISITOR: ['MAIN'],   // assumption: visitors only get the main gate
}

export const ROLE_RULE_TEXT: Record<UserType, string> = {
  STUDENT: 'Students can use the Main, Lab and Library gates only',
  FACULTY: 'Faculty can use all gates',
  STAFF: 'Staff can use all gates',
  SECURITY: 'Security can use all gates',
  VISITOR: 'Visitors can use the Main gate only',
}

const norm = (v: unknown) => String(v ?? '').trim().toUpperCase()

export function isAllowedByRole(userType: unknown, gateType: unknown): boolean {
  const u = norm(userType) as UserType
  const g = norm(gateType) as GateType
  return !!ROLE_GATES[u]?.includes(g)
}

/** Human-readable reason to show in the "Scan Result" panel when a role rule denies entry. */
export function roleDenyReason(userType: unknown): string {
  return ROLE_RULE_TEXT[norm(userType) as UserType] ?? 'This user type has no default gate access'
}
