/*
must define 
let normalState = getLeaderboardState()
let factualityState = getLeaderboardState()
*/

const factualityMap = new Map(
  factualityState.map(item => [item.model, item.score])
);

const sortedDifferences = normalState
  .filter(item => factualityMap.has(item.model))
  .map(item => ({
    model: item.model,
    difference: item.score - factualityMap.get(item.model)
  }))
  .sort((a, b) => b.difference - a.difference); // Sorts descending (highest difference first)
let x = ""
for (let d of sortedDifferences) {
    x += `${d.difference}\t${d.model}\n`
}
console.log(x)
