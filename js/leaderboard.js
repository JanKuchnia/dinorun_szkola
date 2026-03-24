class Leaderboard {
  // UWAGA: Trzeba założyć darmowe konto na https://jsonbin.io/
  // Następnie utworzyć nowy Bin, wklejając w niego po prostu puste nawiasy kwadratowe: []
  // Skopiować ID Binu oraz klucz dostępu (Master Key / Access Key) i wkleić poniżej:

  static BIN_ID = '69c317e0b7ec241ddc9d4bdc'; 
  static API_KEY = '$2a$10$nZYy7vIt41vvkBRrSS7cP.gQLQy4anlMhPNorR.JMkZnf9NXavuR6';

  static async getScores() {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}/latest`, {
        headers: { 'X-Master-Key': this.API_KEY }
      });
      const data = await res.json();
      if (data.record && Array.isArray(data.record)) {
        return data.record;
      }
      return [];
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
      return [];
    }
  }

  static async addScore(name, score) {
    if (!name || name.trim() === '') name = 'ANON';
    name = name.substring(0, 10).toUpperCase();

    const current = await this.getScores();
    const finalScore = Math.floor(score);
    
    // Check if player already exists
    const existingIndex = current.findIndex(entry => entry.name === name);
    if (existingIndex !== -1) {
      if (finalScore > current[existingIndex].score) {
        current[existingIndex].score = finalScore;
      }
    } else {
      current.push({ name, score: finalScore });
    }

    current.sort((a,b) => b.score - a.score);
    const top10 = current.slice(0, 10);

    try {
      await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.API_KEY
        },
        body: JSON.stringify(top10)
      });
    } catch (e) {
      console.error('Leaderboard save error:', e);
    }
    return top10;
  }
}
