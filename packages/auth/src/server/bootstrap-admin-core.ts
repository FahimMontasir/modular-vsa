export type BootstrapIdentity = {
  email: string;
  username: string;
};

export type BootstrapCandidate = {
  email: string;
  username: string | null;
  role: string;
};

export type BootstrapAdminInput = BootstrapIdentity & {
  name: string;
  password: string;
  displayUsername: string;
};

export type BootstrapAdminRepository<Candidate extends BootstrapCandidate> = {
  findCandidates: (identity: BootstrapIdentity) => Promise<Candidate[]>;
  createAdmin: (input: BootstrapAdminInput) => Promise<Candidate>;
};

export function normalizeBootstrapAdmin(input: BootstrapAdminInput): BootstrapAdminInput {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    username: input.username.trim().toLowerCase(),
    displayUsername: input.displayUsername.trim(),
    password: input.password,
  };
}

export function verifyBootstrapAdmin(
  candidates: BootstrapCandidate[],
  identity: BootstrapIdentity
) {
  if (candidates.length !== 1) return false;

  const candidate = candidates[0];
  if (!candidate) return false;

  const isSameIdentity =
    candidate.email.toLowerCase() === identity.email &&
    candidate.username?.toLowerCase() === identity.username;
  const isAdmin = candidate.role.split(",").includes("admin");

  return isSameIdentity && isAdmin;
}

export async function ensureBootstrapAdminWith<Candidate extends BootstrapCandidate>(
  repository: BootstrapAdminRepository<Candidate>,
  rawInput: BootstrapAdminInput
) {
  const input = normalizeBootstrapAdmin(rawInput);
  const identity = { email: input.email, username: input.username };
  const candidates = await repository.findCandidates(identity);

  if (candidates.length > 0) {
    if (!verifyBootstrapAdmin(candidates, identity)) {
      throw new Error(
        "Bootstrap administrator email or username conflicts with an existing non-admin identity"
      );
    }

    return { candidate: candidates[0]!, created: false as const, raced: false as const };
  }

  try {
    const candidate = await repository.createAdmin(input);
    return { candidate, created: true as const, raced: false as const };
  } catch (error) {
    const racedCandidates = await repository.findCandidates(identity);
    if (verifyBootstrapAdmin(racedCandidates, identity)) {
      return { candidate: racedCandidates[0]!, created: false as const, raced: true as const };
    }

    throw error;
  }
}
