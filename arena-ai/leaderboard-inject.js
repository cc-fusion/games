function getLeaderboardState() {
    return [...document.querySelector("#root-portal-target > div > div > div > div > div > div > div.flex.flex-col > div:nth-child(2) > div > div > table > tbody").children].map(e=>{
        let rankSpread = e.querySelector("td:nth-child(2)").innerText.split("\n")
        let price = e.querySelector("td:nth-child(7)").innerText.trim().replaceAll("$","")
        let priceInput = price == "N/A" ? null : parseInt(price.split("/")[0])
        let priceOutput = price == "N/A" ? null : parseInt(price.split("/")[1])
        let votes = e.querySelector("td:nth-child(5)").innerText.trim()
        votes = votes == "N/A" ? null : parseInt(votes.replaceAll(",",""))
        let costPerTask = e.querySelector("td:nth-child(6)").innerText
        costPerTask = costPerTask == "N/A" ? null : costPerTask
        return {
          rank: parseInt(e.querySelector("td:nth-child(1)").innerText),
          rankSpread: {
              min: parseInt(rankSpread[0]),
              max: parseInt(rankSpread[1]),
          },
          model: e.querySelector("td:nth-child(3)").innerText,
          score: parseInt(e.querySelector("td:nth-child(4)").innerText),
          votes: votes,
          costPerTask: costPerTask,
          priceInput: priceInput,
          priceOutput: priceOutput,
          context: e.querySelector("td:nth-child(8)").innerText,
        }
    })
}
