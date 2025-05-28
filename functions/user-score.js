import fs from "fs";

const FILE_PATH = "./users-info.json";

export function loadUserScores() {
  if (!fs.existsSync(FILE_PATH)) return {};
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(raw || "{}");
}

export function saveUserScores(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

export function updateUserScore(userId, score, userInfo = {}) {
  const scores = loadUserScores();
  scores[userId] = {
    score: score + scores[userId]?.score,
    name: userInfo.username || userInfo.first_name || `User ${userId}`,
  };
  saveUserScores(scores);
}

export function getTopScores(limit = 10) {
  const scores = loadUserScores();

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, limit);

  return sorted;
}
