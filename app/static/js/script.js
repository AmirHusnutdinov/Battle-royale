document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const tournamentGrid = document.getElementById("tournamentGrid")
  const participantsList = document.getElementById("participantsList")
  const joinButton = document.getElementById("joinButton")
  const playerNameInput = document.getElementById("playerName")
  const amountInput = document.getElementById("amount")
  const registrationSection = document.getElementById("registrationSection")
  const wheelSection = document.getElementById("wheelSection")
  const spinButton = document.getElementById("spinButton")
  const wheelCanvas = document.getElementById("wheelCanvas")
  const timerDisplay = document.getElementById("timerDisplay")
  const winnerModal = document.getElementById("winnerModal")
  const winnerName = document.getElementById("winnerName")
  const winnerPrize = document.getElementById("winnerPrize")
  const nextBattleButton = document.getElementById("nextBattleButton")
  const closeModal = document.querySelector(".close-modal")

  // Game state
  const participants = []
  let matches = []
  let currentRound = 0
  let currentMatch = 0
  let tournamentStarted = false
  let wheelSpinning = false
  let timerInterval
  let timerValue = 30

  // Canvas context
  const ctx = wheelCanvas.getContext("2d")

  // Add participant
  joinButton.addEventListener("click", () => {
    const name = playerNameInput.value.trim()
    const amount = Number.parseInt(amountInput.value)

    if (!name || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid name and amount!")
      return
    }

    // Add participant
    participants.push({
      id: Date.now(),
      name: name,
      amount: amount,
      originalAmount: amount,
    })

    // Sort participants by amount (highest to lowest)
    participants.sort((a, b) => b.amount - a.amount)

    // Update participants list and tournament grid
    updateParticipantsList()
    createSeededTournamentBracket()

    // Clear inputs
    playerNameInput.value = ""
    amountInput.value = ""

    // Add animation to the list
    const lastItem = participantsList.lastElementChild
    if (lastItem) {
      lastItem.classList.add("new-item")
      setTimeout(() => {
        lastItem.classList.remove("new-item")
      }, 500)
    }
  })

  // Update participants list
  function updateParticipantsList() {
    participantsList.innerHTML = ""

    participants.forEach((participant, index) => {
      const li = document.createElement("li")
      li.innerHTML = `
                <span>#${index + 1} ${participant.name}</span>
                <span>$${participant.amount}</span>
            `
      participantsList.appendChild(li)
    })

    // If we have enough participants, show start button
    if (participants.length >= 2 && !tournamentStarted) {
      const startButton = document.createElement("button")
      startButton.className = "glow-button"
      startButton.textContent = "START TOURNAMENT"
      startButton.addEventListener("click", startTournament)

      // Remove existing start button if any
      const existingButton = document.querySelector(".registration-form > button:last-child")
      if (existingButton && existingButton.textContent === "START TOURNAMENT") {
        existingButton.remove()
      }

      document.querySelector(".registration-form").appendChild(startButton)
    }
  }

  // Create seeded tournament bracket
  function createSeededTournamentBracket() {
    if (participants.length === 0) {
      tournamentGrid.innerHTML = "<p>No participants yet...</p>"
      return
    }

    tournamentGrid.innerHTML = ""
    matches = []

    // Calculate number of rounds needed
    const numRounds = Math.ceil(Math.log2(participants.length))

    // Create bracket structure from final to first round
    for (let round = numRounds - 1; round >= 0; round--) {
      const roundDiv = document.createElement("div")
      roundDiv.className = "tournament-round"
      roundDiv.dataset.round = round

      const roundTitle = document.createElement("h3")
      roundTitle.className = "round-title"

      if (round === numRounds - 1) {
        roundTitle.textContent = "FINAL"
      } else if (round === numRounds - 2) {
        roundTitle.textContent = "SEMIFINALS"
      } else if (round === numRounds - 3) {
        roundTitle.textContent = "QUARTERFINALS"
      } else {
        roundTitle.textContent = `ROUND ${round + 1}`
      }

      roundDiv.appendChild(roundTitle)

      const matchesInRound = Math.pow(2, numRounds - round - 1)

      // Create matches for this round
      for (let match = 0; match < matchesInRound; match++) {
        const matchPairDiv = document.createElement("div")
        matchPairDiv.className = "match-pair"

        const matchDiv = document.createElement("div")
        matchDiv.className = "match"
        matchDiv.dataset.round = round
        matchDiv.dataset.match = match

        let player1, player2

        if (round === numRounds - 1) {
          // Final round - top seed vs TBD
          if (participants.length >= 1) {
            player1 = participants[0]
            player2 = { name: "???", amount: "TBD", id: "tbd-final" }
          }
        } else if (round === numRounds - 2 && participants.length >= 2) {
          // Semifinals
          if (match === 0) {
            // Second seed vs TBD
            player1 = participants[1]
            player2 = { name: "???", amount: "TBD", id: "tbd-semi1" }
          } else {
            // Other semifinal - will be filled by lower rounds
            player1 = { name: "???", amount: "TBD", id: "tbd-semi2-1" }
            player2 = { name: "???", amount: "TBD", id: "tbd-semi2-2" }
          }
        } else {
          // Lower rounds - fill with actual participants or TBD
          const participantsForThisRound = getParticipantsForRound(round, match)
          player1 = participantsForThisRound.player1 || { name: "???", amount: "TBD", id: `tbd-${round}-${match}-1` }
          player2 = participantsForThisRound.player2 || { name: "???", amount: "TBD", id: `tbd-${round}-${match}-2` }
        }

        matchDiv.innerHTML = `
                    <div class="player-card ${player1.name === "???" ? "tbd-player" : ""}">
                        <span class="player-name">${player1.name}</span>
                        <span class="player-amount">${player1.amount === "TBD" ? "TBD" : "$" + player1.amount}</span>
                    </div>
                    <div class="player-card ${player2.name === "???" ? "tbd-player" : ""}">
                        <span class="player-name">${player2.name}</span>
                        <span class="player-amount">${player2.amount === "TBD" ? "TBD" : "$" + player2.amount}</span>
                    </div>
                `

        // Add match to matches array
        matches.push({
          round: round,
          match: match,
          player1: player1,
          player2: player2,
          winner: null,
        })

        matchPairDiv.appendChild(matchDiv)

        // Add connector if not final round
        if (round < numRounds - 1) {
          const connectorDiv = document.createElement("div")
          connectorDiv.className = "match-connector"
          matchPairDiv.appendChild(connectorDiv)
        }

        roundDiv.appendChild(matchPairDiv)
      }

      tournamentGrid.appendChild(roundDiv)
    }
  }

  // Get participants for a specific round and match
  function getParticipantsForRound(round, match) {
    const numRounds = Math.ceil(Math.log2(participants.length))

    // Skip top 2 seeds (they're placed in higher rounds)
    const availableParticipants = participants.slice(2)

    // Calculate which participants should be in this match
    const participantsPerFirstRound = Math.pow(2, numRounds - 1)
    const startIndex = match * 2

    if (round === 0) {
      // First round - place remaining participants
      const player1 = availableParticipants[startIndex] || null
      const player2 = availableParticipants[startIndex + 1] || null

      return { player1, player2 }
    }

    return { player1: null, player2: null }
  }

  // Start tournament
  function startTournament() {
    if (participants.length < 2) {
      alert("Need at least 2 participants to start!")
      return
    }

    tournamentStarted = true

    // Switch to wheel section
    registrationSection.classList.add("hidden")
    wheelSection.classList.remove("hidden")

    // Find first available match to play
    findNextMatch()

    if (currentRound !== -1 && currentMatch !== -1) {
      setupCurrentMatch()
      startTimer()
    }
  }

  // Find next available match
  function findNextMatch() {
    const numRounds = Math.ceil(Math.log2(participants.length))

    // Start from the lowest round and work up
    for (let round = 0; round < numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round - 1)

      for (let match = 0; match < matchesInRound; match++) {
        const matchData = matches.find((m) => m.round === round && m.match === match)

        if (
          matchData &&
          !matchData.winner &&
          matchData.player1 &&
          matchData.player1.name !== "???" &&
          matchData.player2 &&
          matchData.player2.name !== "???"
        ) {
          currentRound = round
          currentMatch = match
          return
        }
      }
    }

    // No available matches
    currentRound = -1
    currentMatch = -1
  }

  // Setup current match
  function setupCurrentMatch() {
    const currentMatchData = matches.find((m) => m.round === currentRound && m.match === currentMatch)

    if (!currentMatchData) return

    // Update player info in wheel section
    document.querySelector("#player1 .player-name").textContent = currentMatchData.player1.name
    document.querySelector("#player1 .player-amount").textContent = `$${currentMatchData.player1.amount}`

    document.querySelector("#player2 .player-name").textContent = currentMatchData.player2.name
    document.querySelector("#player2 .player-amount").textContent = `$${currentMatchData.player2.amount}`

    // Highlight current match in bracket
    const matchDivs = document.querySelectorAll(".match")
    matchDivs.forEach((div) => div.classList.remove("active-match"))

    const currentMatchDiv = document.querySelector(`.match[data-round="${currentRound}"][data-match="${currentMatch}"]`)
    if (currentMatchDiv) {
      currentMatchDiv.classList.add("active-match")
      currentMatchDiv.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // Start timer
  function startTimer() {
    timerValue = 30
    timerDisplay.textContent = timerValue

    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      timerValue--
      timerDisplay.textContent = timerValue

      if (timerValue <= 0) {
        clearInterval(timerInterval)
        spinWheel()
      }
    }, 1000)
  }

  // Spin wheel
  function spinWheel() {
    if (wheelSpinning) return

    wheelSpinning = true
    clearInterval(timerInterval)

    const currentMatchData = matches.find((m) => m.round === currentRound && m.match === currentMatch)

    if (!currentMatchData) return

    // Calculate percentages based on amounts
    const totalAmount = currentMatchData.player1.amount + currentMatchData.player2.amount
    const player1Percentage = (currentMatchData.player1.amount / totalAmount) * 100
    const player2Percentage = (currentMatchData.player2.amount / totalAmount) * 100

    // Draw wheel
    drawWheel(player1Percentage, player2Percentage)

    // Determine winner (weighted by amount)
    let winner
    if (Math.random() * 100 < player1Percentage) {
      winner = { ...currentMatchData.player1 }
      winner.amount += currentMatchData.player2.amount
    } else {
      winner = { ...currentMatchData.player2 }
      winner.amount += currentMatchData.player1.amount
    }

    // Update match with winner
    currentMatchData.winner = winner

    // Animate wheel spin
    const spinDegrees = 1800 + Math.random() * 360
    wheelCanvas.style.transform = `rotate(${spinDegrees}deg)`

    // Show winner after spin
    setTimeout(() => {
      showWinner(winner, currentMatchData.player1.amount + currentMatchData.player2.amount)
      wheelSpinning = false

      // Update bracket
      updateBracket()
    }, 3000)
  }

  // Draw wheel
  function drawWheel(player1Percentage, player2Percentage) {
    const centerX = wheelCanvas.width / 2
    const centerY = wheelCanvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height)

    // Draw player 1 section
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2 * (player1Percentage / 100))
    ctx.fillStyle = "#ff7700"
    ctx.fill()

    // Draw player 2 section
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, Math.PI * 2 * (player1Percentage / 100), Math.PI * 2)
    ctx.fillStyle = "#ffb700"
    ctx.fill()

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = "#1a1a1a"
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw dividing lines
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0))
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(
      centerX + radius * Math.cos(Math.PI * 2 * (player1Percentage / 100)),
      centerY + radius * Math.sin(Math.PI * 2 * (player1Percentage / 100)),
    )
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2
    ctx.stroke()

    // Add player names
    ctx.font = "bold 16px Russo One"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"

    // Player 1 name
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(Math.PI * 2 * (player1Percentage / 200))
    ctx.fillText(document.querySelector("#player1 .player-name").textContent, radius * 0.6, 0)
    ctx.restore()

    // Player 2 name
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(Math.PI * 2 * (player1Percentage / 100) + Math.PI * 2 * (player2Percentage / 200))
    ctx.fillText(document.querySelector("#player2 .player-name").textContent, radius * 0.6, 0)
    ctx.restore()

    // Add percentages
    ctx.font = "bold 14px Russo One"

    // Player 1 percentage
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(Math.PI * 2 * (player1Percentage / 200))
    ctx.fillText(`${Math.round(player1Percentage)}%`, radius * 0.3, 0)
    ctx.restore()

    // Player 2 percentage
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(Math.PI * 2 * (player1Percentage / 100) + Math.PI * 2 * (player2Percentage / 200))
    ctx.fillText(`${Math.round(player2Percentage)}%`, radius * 0.3, 0)
    ctx.restore()
  }

  // Show winner
  function showWinner(winner, prize) {
    winnerName.textContent = winner.name
    winnerPrize.textContent = prize
    winnerModal.style.display = "flex"
  }

  // Update bracket
  function updateBracket() {
    const currentMatchData = matches.find((m) => m.round === currentRound && m.match === currentMatch)

    if (!currentMatchData || !currentMatchData.winner) return

    // Update current match in UI
    const currentMatchDiv = document.querySelector(`.match[data-round="${currentRound}"][data-match="${currentMatch}"]`)
    if (currentMatchDiv) {
      const playerCards = currentMatchDiv.querySelectorAll(".player-card")

      // Highlight winner
      playerCards.forEach((card) => {
        const name = card.querySelector(".player-name").textContent
        if (name === currentMatchData.winner.name) {
          card.classList.add("winner")
        } else {
          card.classList.add("loser")
        }
      })
    }

    // Update next round match
    const numRounds = Math.ceil(Math.log2(participants.length))
    if (currentRound < numRounds - 1) {
      const nextRound = currentRound + 1
      const nextMatch = Math.floor(currentMatch / 2)

      const nextMatchData = matches.find((m) => m.round === nextRound && m.match === nextMatch)

      if (nextMatchData) {
        // Determine if this is the first or second player in the next match
        if (currentMatch % 2 === 0) {
          nextMatchData.player1 = currentMatchData.winner
        } else {
          nextMatchData.player2 = currentMatchData.winner
        }

        // Update next match in UI
        const nextMatchDiv = document.querySelector(`.match[data-round="${nextRound}"][data-match="${nextMatch}"]`)
        if (nextMatchDiv) {
          const playerCards = nextMatchDiv.querySelectorAll(".player-card")

          if (currentMatch % 2 === 0) {
            playerCards[0].querySelector(".player-name").textContent = currentMatchData.winner.name
            playerCards[0].querySelector(".player-amount").textContent = `$${currentMatchData.winner.amount}`
            playerCards[0].classList.remove("tbd-player")
          } else {
            playerCards[1].querySelector(".player-name").textContent = currentMatchData.winner.name
            playerCards[1].querySelector(".player-amount").textContent = `$${currentMatchData.winner.amount}`
            playerCards[1].classList.remove("tbd-player")
          }
        }
      }
    }
  }

  // Move to next match
  function nextMatch() {
    findNextMatch()

    if (currentRound !== -1 && currentMatch !== -1) {
      setupCurrentMatch()
      startTimer()
    } else {
      // Check if tournament is over
      const finalMatch = matches.find((m) => m.round === Math.ceil(Math.log2(participants.length)) - 1 && m.match === 0)

      if (finalMatch && finalMatch.winner) {
        alert(`Tournament Over! The winner is ${finalMatch.winner.name} with $${finalMatch.winner.amount}!`)
        return
      } else {
        alert("No more matches available!")
      }
    }
  }

  // Event listeners
  spinButton.addEventListener("click", spinWheel)

  nextBattleButton.addEventListener("click", () => {
    winnerModal.style.display = "none"
    nextMatch()
  })

  closeModal.addEventListener("click", () => {
    winnerModal.style.display = "none"
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === winnerModal) {
      winnerModal.style.display = "none"
    }
  })
})
