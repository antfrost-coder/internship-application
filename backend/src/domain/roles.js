/** User roles defined in the SRS (section 2.3). */
export const ROLES = Object.freeze({
  STUDENT: 'student',
  RECRUITER: 'recruiter',
  SCHOOL_STAFF: 'school_staff',
  ADMIN: 'admin'
})

export const ALL_ROLES = Object.freeze(Object.values(ROLES))

/**
 * Roles anyone may pick when creating an account.
 * School staff and administrators are assigned by an administrator (SCRUM-15).
 */
export const SELF_REGISTRATION_ROLES = Object.freeze([ROLES.STUDENT, ROLES.RECRUITER])
