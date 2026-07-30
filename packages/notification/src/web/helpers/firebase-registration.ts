export function replacedFirebaseRegistration(previousFid: string | null, nextFid: string) {
  return previousFid && previousFid !== nextFid ? previousFid : undefined;
}
