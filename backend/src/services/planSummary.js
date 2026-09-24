
export function summarizePlan(matches = []) {
  const requirements = matches.length;
  const matched = matches.filter((item) => item.total > 0).length;
  return {
    requirements,
    matched,
    gaps: requirements - matched,
    coveragePercent: requirements
      ? Math.round((matched / requirements) * 100)
      : 0,
    candidates: matches.reduce((sum, item) => sum + (item.total || 0), 0),
    reservationCreated: false,
  };
}
