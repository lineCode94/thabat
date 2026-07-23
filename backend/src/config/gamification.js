/**
 * Calculates the required XP for a given level.
 * Level 1 starts at 0 XP.
 * The curve is quadratic to make higher levels progressively harder.
 * Formula: Required XP = 500 * (level - 1)^1.2
 */
export function calculateRequiredXpForLevel(level) {
  if (level <= 1) return 0;
  
  // Example curve: 
  // Level 1: 0
  // Level 2: 500
  // Level 3: 1148
  // Level 4: 1859
  // Level 5: 2639
  return Math.floor(500 * Math.pow(level - 1, 1.2));
}

/**
 * Calculates the current level, next level xp, etc., based on total XP.
 */
export function calculateLevelFromXp(totalXp) {
  let currentLevel = 1;
  let nextLevelXp = calculateRequiredXpForLevel(2);
  let currentLevelXp = 0;

  // We loop until the totalXP is less than the required XP for the next level
  while (totalXp >= nextLevelXp) {
    currentLevel++;
    currentLevelXp = nextLevelXp;
    nextLevelXp = calculateRequiredXpForLevel(currentLevel + 1);
  }

  const xpIntoCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const remainingXp = nextLevelXp - totalXp;
  
  let progress = 0;
  if (xpNeededForNextLevel > 0) {
    progress = Math.floor((xpIntoCurrentLevel / xpNeededForNextLevel) * 100);
  }

  return {
    currentLevel,
    totalXp,
    currentLevelXp,
    nextLevelXp,
    remainingXp,
    progress,
  };
}
