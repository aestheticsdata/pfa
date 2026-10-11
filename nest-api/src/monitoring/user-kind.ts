/**
 * Who is behind a business metric (PFA-212): a person, or one of the synthetic bots that sign up
 * on the reserved domain (PFA-122). The only label the business series carry — never an id, an
 * email or anything else that would turn the metrics text into a list of users.
 */
export const USER_KIND = {
  real: "real",
  synthetic: "synthetic",
} as const;
