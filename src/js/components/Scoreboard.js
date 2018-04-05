import React, { Component } from 'react'
import 'request'

import axios from 'axios'
const nhlAPI = 'https://statsapi.web.nhl.com/'
const calendar = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const loadingObject = (
  <div className='loading'>
    <img id='loading' src='img/icons/puck_logo.png' alt='loading' />
  </div>
)

class Scoreboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      activeComponent: 'loading',
      date: new Date(),
      games: [],
      gameLinks: [],
      contentLinks: [],
      gameData: [],
      gameDataMap: new Map(),
      final: [],
      active: [],
      standings: {},
      noGames: [],
      activeGame: []
    }
  }

  componentDidMount () {
    this.getGames(this.state.date)
    //this.getContent()
    this.getStandings()
    setInterval(() => {
      if (this.state.games.length > this.state.final.length && this.state.active.length > 0) {
        this.changeDate(null, -1)
      }
    }, 100000)
  }

  componentWillUnmount () {
    this.getGames(this.state.date)
    this.getStandings()
  }

  getStandings () {
    const standingsURL = 'api/v1/standings/'
    let standings = new Map()
    axios.get(nhlAPI + standingsURL)
      .then((response) => {
        response.data.records.forEach((division) => {
          division.teamRecords.forEach((team) => {
            team.division = division.division.name
            standings.set(team.team.name, team)
          })
        })
        this.setState({standings: standings})
      })
  }

  renderGames () {
    const gameData = this.state.gameData
    let gamesHTML = []
    gameData.forEach((game) => {
      if (game !== undefined) {
        gamesHTML.push(<Game key={game.gamePk} value={this.state.gameDataMap.get(game.gamePk)} id={game.gamePk} standings={this.state.standings}/>)
      }
    })
    return gamesHTML
  }

  stringifyDate (date) {
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate())
  }

  dateSuffixer (date) {
    let dateString = (calendar[date.getMonth()] + ' ' + date.getDate())
    let day = '' + date.getDate()
    switch (day.charAt(day.length - 1)) {
      case '1':
        if (day === '11') {
          dateString += 'th'
        } else {
          dateString += 'st'
        }
        break
      case '2':
        if (day === '12') {
          dateString += 'th'
        } else {
          dateString += 'nd'
        }
        break
      case '3':
        if (day === '13') {
          dateString += 'th'
        } else {
          dateString += 'rd'
        }
        break
      default:
        dateString += 'th'
    }
    this.setState({dateString: dateString})
  }

  getGames (date) {
    this.setState({ activeComponent: 'loading' })
    let startDate = this.stringifyDate(date)
    this.dateSuffixer(date)
    let tomorrow = date
    tomorrow.setDate(tomorrow.getDate() + 1)
    let gameLinks = []
    let contentLinks = []
    axios.get(nhlAPI + 'api/v1/schedule/?startDate=' + startDate + '&endDate=' + startDate)
      .then((response) => {
        this.setState({noGames: (response.data.totalGames === 0)})
        this.setState({games: response.data.dates[0].games})
        let games = response.data.dates[0].games
        games.forEach((game) => {
          if (game.status.abstractGameState === 'Final') {
            this.state.final.push(game)
          }
          if (game.status.abstractGameState === 'In Progress') {
            this.state.active.push(game)
          }
          gameLinks.push(game.link)
          contentLinks.push(game.content.link)
        })
        gameLinks.forEach((link) => {
          axios.get(nhlAPI + link)
            .then((responseInner) => {
              let dateTime = responseInner.data.gameData.datetime.dateTime
              let gameData = this.state.gameData
              let length = gameData.length
              let gameDataMap = this.state.gameDataMap
              let i = 0
              while (i <= length) { // sort games by start time
                gameDataMap.set(responseInner.data.gamePk, responseInner.data)
                if (length === 0) {
                  gameData.push(responseInner.data)
                } else {
                  let storedDateTime = gameData[i].gameData.datetime.dateTime
                  if (responseInner.data.gameData.status.abstractGameState === 'Final' && this.state.active.length > 0) {
                    gameData.push(responseInner.data)
                  } else {
                    if (dateTime < storedDateTime) {
                      gameData.splice(i, 0, responseInner.data)
                      i = length
                    } else if (length - 1 === i) {
                      gameData.push(responseInner.data)
                    }
                  }
                }
                i++
              }
              this.setState({gameData: gameData, gameDataMap: gameDataMap, contentLinks: contentLinks})
            })
        })
      })
    setTimeout(() => {
      this.setState({ activeComponent: 'scoreboard' })
    }, 2000)
  }

  changeDate (e, modifier) {
    let newDate = this.state.date
    newDate.setDate(this.state.date.getDate() + modifier)
    this.setState({
      date: newDate,
      games: [],
      gameLinks: [],
      contentLinks: [],
      gameData: [],
      gameDataMap: new Map(),
      final: []
    })
    this.getGames(newDate)
  }

  // getContent () {
  //   console.log('contentLinks', this.state.contentLinks)
  //   this.state.contentLinks.forEach((link) => {
  //     $.getJSON(nhlAPI + link)
  //       .then((data) => {
  //         //console.log(data)
  //       })
  //   })
  // }

  render () {
    let scoreboardObject = (
      <div className='scoreboard' id='scoreboard'>
        {this.state.activeGame}
        <div className='daySelector container'>
          <div className='row'>
            <div className='col-3'>
              <i className='fa fa-chevron-left' aria-hidden='true' onClick={(e) => this.changeDate(e, -2)}></i>
            </div>
            <div className='col-6 text-center'>{this.state.dateString}</div>
            <div className='col-3'>
              <i className='fa fa-chevron-right' aria-hidden='true' onClick={(e) => this.changeDate(e, 0)}></i>
            </div>
          </div>
        </div>
        <div className='container'>
          <div className='row games'>
            {this.state.noGames && <h3 className='text-center'>Sorry, no games today :(</h3>}
            {this.renderGames()}
          </div>
        </div>
      </div>
    )
    try {
      //console.log(this.state.activeComponent)
      if (this.state.activeComponent === 'scoreboard') {
        return scoreboardObject
      } else {
        return loadingObject
      }
    } catch (e) {
      console.log(e)
      return loadingObject
    }
  }
}

function Game (props) {
  const standings = props.standings
  const game = props.value
  const {gameData, liveData} = game
  const {venue, status} = gameData
  const statusCode = status.statusCode
  let statusString = status.abstractGameState
  const plays = liveData.plays.allPlays
  const linescore = liveData.linescore
  const home = linescore.teams.home
  const away = linescore.teams.away
  const period = linescore.currentPeriodOrdinal
  const scoringPlays = liveData.plays.scoringPlays
  away.standings = getStanding(away, standings)
  home.standings = getStanding(home, standings)
  let goals = []
  for (let i = 0; i < scoringPlays.length; i++) {
    goals.push(plays[scoringPlays[i]])
  }
  let timeRemaining = linescore.currentPeriodTimeRemaining
  let boardObject = (<div className='board'><p>{statusString}</p></div>)
  let mobileBoard = boardObject
  let matchup = (<div className='matchup'><h3>{away.team.abbreviation} @ {home.team.abbreviation}</h3></div>)
  let scoreObject = (<div className='score row'><div className='col text-center'>VS</div></div>)
  let threeStars = (<div className='threeStars'></div>)
  let gameInfoObject = (
    <div className='gameInfo container'>
      <div className='row'>
        <div className='col-5'>
          <h2 className='d-none d-lg-block'>{away.team.name}</h2>
          <h2 className='d-none d-sm-block d-lg-none'>{gameData.teams.away.shortName}</h2>
          <h2 className='d-block d-sm-none'>{away.team.abbreviation}</h2>
          <p>{away.standings.leagueRecord.wins}-{away.standings.leagueRecord.losses}-{away.standings.leagueRecord.ot}</p>
          <p>{suffixer(away.standings.divisionRank)}<br/>{away.standings.division}</p>
        </div>
        <div className='col-2'><br/><p className='d-none d-block-md'>Teams</p></div>
        <div className='col-5'>
          <h2 className='d-none d-lg-block'>{home.team.name}</h2>
          <h2 className='d-none d-sm-block d-lg-none'>{gameData.teams.home.shortName}</h2>
          <h2 className='d-block d-sm-none'>{home.team.abbreviation}</h2>
          <p>{home.standings.leagueRecord.wins}-{home.standings.leagueRecord.losses}-{home.standings.leagueRecord.ot}</p>
          <p>{suffixer(home.standings.divisionRank)}<br/>{home.standings.division}</p>
        </div>
      </div>
    </div>)
  let goalsObject = []
  for (let i = 0; i < goals.length; i++) {
    let players = goals[i].players
    let scorer = players[0]
    let assists = ''
    for (let i = 1; i < players.length; i++) {
      if (players[i].playerType === 'Assist') {
        let name = (players[i].player.fullName.split(' ')[0].charAt(0) + '. ' +
        players[i].player.fullName.split(' ').slice(1).join(' '))
        assists += (' ' + name + '(' + players[i].seasonTotal + ')')
      }
    }
    goalsObject.push(
      <div key={goals[i].result.eventCode} className='goal'>
        <p><strong className='teamName'>{goals[i].team.triCode} </strong>
        <strong>{goals[i].about.ordinalNum} {goals[i].about.periodTime}</strong>
        {' ' + scorer.player.fullName.split(' ')[0].charAt(0) + '. ' +
        scorer.player.fullName.split(' ').slice(1).join(' ')}({scorer.seasonTotal})
        {' ' + assists}</p></div>)
  }
  goalsObject = (
    <div className='scoringPlays'>
      <h3>Scoring Plays</h3>
      {goalsObject}
    </div>
  )
  const closeSelected = () => {
    document.querySelector('body').style.overflow='scroll'
    removeClass('.selectedGame', 'open-animate')
    addClass('.selectedGame', 'close-animate')
    removeClass('.fa-angle-left', 'open-arrow')
    addClass('.fa-angle-left', 'close-arrow')
    setTimeout(function() {
      document.querySelector('.selectedGame', '#' + game.gamePk).style.display='none'
    }, 500)
  }
  const gameSelect = () => {
    document.querySelector('body').style.overflow='hidden'
    removeClass('.selectedGame', 'close-animate')
    addClass('.selectedGame', 'open-animate')
    removeClass('.fa-angle-left', 'close-arrow')
    addClass('.fa-angle-left', 'open-arrow')
    document.querySelector('.selectedGame', '#' + game.gamePk).style.display='block'
}
  if (statusCode >= 3 && statusCode < 5) {
    if (timeRemaining.startsWith('0')) {
      timeRemaining = timeRemaining.slice(1)
    }
    statusString = period + ' ' + timeRemaining
    scoreObject = (
      <div className='score row'>
          <div className='col-4 text-center'>{away.goals}</div>
          <div className='col-4 text-center'>-</div>
          <div className='col-4 text-center'>{home.goals}</div>
      </div>
    )
    boardObject = (
      <div className='board'>
        <p>{statusString}</p>
        <h2>
          <img src={'img/teams/' + away.team.abbreviation + '.png'}
            alt={away.team.abbreviation}/>
          {away.goals} - {home.goals}
          <img src={'img/teams/' + home.team.abbreviation + '.png'}
            alt={home.team.abbreviation}/>
        </h2>
      </div>
    )
    mobileBoard = (
      <div className='row'>
        <div className='teams col-8'>
          <div className='row'>
            <div className='col-3 text-right'>
              <img src={'img/teams/' + away.team.abbreviation + '.png'} alt={away.team.abbreviation}/>
            </div>
            <div className='col-6 text-center'>
              {scoreObject}
            </div>
            <div className='col-3 text-left'>
              <img src={'img/teams/' + home.team.abbreviation + '.png'} alt={home.team.abbreviation}/>
            </div>
          </div>
        </div>
        <div className='status col-4 active'>
          <div className='text-center'>{statusString}</div>
        </div>
      </div>
    )
  } else if (statusCode === '1' || statusCode === '2') { // pre-game
    let startTime = new Date(game.gameData.datetime.dateTime)
    let hours = startTime.getHours()
    let minutes = startTime.getMinutes()
    if (minutes === 0) {
      minutes = '00'
    }
    if (hours >= 12) {
      minutes += 'pm'
    } else {
      minutes += 'am'
    }
    if (hours > 12) {
      hours -= 12
    }
    statusString = hours + ':' + minutes
    boardObject = (
      <div className='board'>
        <p>{statusString}</p>
        <h2>
          <img src={'img/teams/' + away.team.abbreviation + '.png'}
            alt={away.team.abbreviation}/>
           VS
          <img src={'img/teams/' + home.team.abbreviation + '.png'}
            alt={home.team.abbreviation}/>
        </h2>
        <h3></h3>
      </div>
    )
    mobileBoard = (
      <div className='row'>
        <div className='teams col-8'>
          <div className='row'>
            <div className='col-3 text-right'>
              <img src={'img/teams/' + away.team.abbreviation + '.png'} alt={away.team.abbreviation}/>
            </div>
            <div className='col-6 text-center'>
              {scoreObject}
            </div>
            <div className='col-3 text-left'>
              <img src={'img/teams/' + home.team.abbreviation + '.png'} alt={home.team.abbreviation}/>
            </div>
          </div>
        </div>
        <div className='status col-4'>
          <div className='text-center'>{statusString}</div>
        </div>
      </div>
    )
  } else if (statusString === 'Final') {
    // check who won
    // check if it went to OT
    if (linescore.currentPeriod > 3) {
      statusString += (' ' + linescore.currentPeriodOrdinal)
    }
    scoreObject = (
      <div className='score row'>
        <div className='col-4 text-center'>{away.goals}</div>
        <div className='col-4 text-center'>-</div>
        <div className='col-4 text-center'>{home.goals}</div>
      </div>
    )
    boardObject = (
      <div className='board'>
        <p>{statusString}</p>
        <h2>
          <img src={'img/teams/' + away.team.abbreviation + '.png'}
            alt={away.team.abbreviation}/>
          {away.goals} - {home.goals}
          <img src={'img/teams/' + home.team.abbreviation + '.png'}
            alt={home.team.abbreviation}/>
        </h2>
      </div>
    )
    mobileBoard = (
      <div className='row'>
        <div className='teams col-8'>
          <div className='row'>
            <div className='col-3 text-right'>
              <img src={'img/teams/' + away.team.abbreviation + '.png'} alt={away.team.abbreviation}/>
            </div>
            <div className='col-6 text-center'>
              {scoreObject}
            </div>
            <div className='col-3 text-left'>
              <img src={'img/teams/' + home.team.abbreviation + '.png'} alt={home.team.abbreviation}/>
            </div>
          </div>
        </div>
        <div className='status col-4 active'>
          <div className='text-center'>{statusString}</div>
        </div>
      </div>
    )
    if (liveData.decisions.firstStar !== undefined) {
      threeStars = (
        <div className='threeStars container'>
          <h2>Three Stars</h2>
          <div className='row'>
            <div className='star col'>
              <i className='fa fa-star' aria-hidden='true'></i>
              <h3>{liveData.decisions.firstStar.fullName}</h3>
            </div>
            <div className='star col'>
              <i className='fa fa-star' aria-hidden='true'></i><i
                className='fa fa-star' aria-hidden='true'></i>
              <h3>{liveData.decisions.secondStar.fullName}</h3>
            </div>
            <div className='star col'>
              <i className='fa fa-star' aria-hidden='true'></i><i
                className='fa fa-star' aria-hidden='true'></i><i
                className='fa fa-star' aria-hidden='true'></i>
              <h3>{liveData.decisions.thirdStar.fullName}</h3>
            </div>
          </div>
        </div>
      )
    }
  }
  let selectedGame = (
    <div className='selectedGame'>
      <span onClick={closeSelected}><i className="fa fa-angle-left" aria-hidden="true" alt='close'></i></span>
      <div className='container'>
        <h1>{statusString}</h1>
        <p>{venue.name}</p>
      </div>
      <div className='scoreboard container'>
        <div className='row'>
          <div className='col-3 text-right'>
            <img src={'img/teams/' + away.team.abbreviation + '.png'}
              alt={away.team.abbreviation}/>
          </div>
          <div className='col-6'>
            {scoreObject}
          </div>
          <div className='col-3 text-left'>
            <img src={'img/teams/' + home.team.abbreviation + '.png'}
              alt={home.team.abbreviation}/>
          </div>
        </div>
      </div>
      {gameInfoObject}
      {statusString.startsWith('Final') && threeStars}
      {goals.length > 0 && goalsObject}
    </div>
  )

  return (
    <div id={game.gamePk} className='game col-lg-3 col-md-4 col-sm-6 col-xs-12'>
      {selectedGame}
      <div onClick={gameSelect}>
        <div className='gameContainer d-sm-none d-block container'>
          {mobileBoard}
        </div>
        <div className='gameContainer d-sm-block d-none'>
          {boardObject}
          {matchup}
        </div>
      </div>
    </div>
  )
}

function getStanding (team, standings) {
  return standings.get(team.team.name)
}

function suffixer (rank) {
  switch (rank) {
    case '1':
      rank += 'st'
      break
    case '2':
      rank += 'nd'
      break
    case '3':
      rank += 'rd'
      break
    default:
      rank += 'th'
  }
  return rank
}

function addClass(selector, myClass) {

  // get all elements that match our selector
  let elements = document.querySelectorAll(selector);

  // add class to all chosen elements
  for (var i=0; i<elements.length; i++) {
    elements[i].classList.add(myClass);
  }
}

function removeClass(selector, myClass) {

  // get all elements that match our selector
  let elements = document.querySelectorAll(selector);

  // remove class from all chosen elements
  for (var i=0; i<elements.length; i++) {
    elements[i].classList.remove(myClass);
  }
}

export default Scoreboard
