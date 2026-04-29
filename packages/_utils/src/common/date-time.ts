export const getCurrentDateTime = (): string => {
  const now = new Date();
  return now.toISOString();
};
