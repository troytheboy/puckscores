import React, { Component } from 'react';
import './App.css';
import 'request';

const $ = require('jquery');
const nhlAPI = 'https://statsapi.web.nhl.com/';
const calendar = ['January', 'February', 'March', 'April', 'May', 'June',
 'July', 'August', 'September', 'October', 'November', 'December'];


class Scoreboard extends Component{
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      games : [],
      links : [],
      gameData : [],
      gameDataMap : new Map(),
      final: [],
      active: [],
      standings: {}
    };
  }

  componentDidMount() {
    this.getGames(this.state.date);
    this.getStandings();
    setInterval(() => {
      if (this.state.games.length > this.state.final.length && this.state.active.length > 0) {
        this.changeDate(null, -1);
      }
    }, 100000);
  }

  componentWillUnmount() {
    this.getGames(this.state.date);
    this.getStandings();
  }

  getStandings() {
    const standingsURL = "api/v1/standings/";
    let standings = new Map();
    $.getJSON(nhlAPI + standingsURL)
      .then((response) => {
        response.records.forEach((division) => {
          division.teamRecords.forEach((team) => {
            team.division = division.division.name;
            standings.set(team.team.name, team);
          })
        })
        this.setState({standings : standings})
      })
  }

  renderGames() {
    const gameData = this.state.gameData;
    let gamesHTML = [];

    gameData.forEach((game) => {
      if (game !== undefined) {
        gamesHTML.push(<Game key={game.gamePk} value={game} id={game.gamePk} standings={this.state.standings}/>)
      }
    })
    return gamesHTML;
  }

  stringifyDate(date) {
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  }

  dateSuffixer(date) {
    let dateString = (calendar[date.getMonth()] + " " + date.getDate());
    let day = '' + date.getDate();
    switch (day.charAt(day.length -1)) {
      case '1':
        if (day === '11') {
          dateString += 'th';
        } else {
          dateString += 'st';
        }
        break;
      case '2':
        if (day === '12') {
          dateString += 'th';
        } else {
          dateString += 'nd';
        }
        break;
      case '3':
        if (day === '13') {
          dateString += 'th';
        } else {
          dateString += 'rd';
        }
        break;
      default:
        dateString += 'th';
    }
    this.setState({dateString : dateString});
  }

  getGames(date) {
    $('#loading').show();
    $('.games').hide();
    let startDate = this.stringifyDate(date);
    this.dateSuffixer(date);
    let tomorrow = date;
    tomorrow.setDate(tomorrow.getDate() + 1);
    let endDate = this.stringifyDate(tomorrow);
    let links = [];

    $.getJSON(nhlAPI + 'api/v1/schedule/?startDate=' + startDate + '&endDate=' + endDate)
      .then((data) => {
        this.setState({games : data.dates[0].games})
        let games = data.dates[0].games;
        games.forEach( (game) => {
          if (game.status.abstractGameState === 'Final') {
            this.state.final.push(game);
          }
          if (game.status.abstractGameState === 'In Progress') {
            this.state.active.push(game);
          }
          links.push(game.link);
        })
        this.setState(links : links);
        this.forceUpdate();
      })
      .done((data) => {
        links.forEach((link) => {
          $.getJSON(nhlAPI + link)
            .then((data) => {
              let dateTime = data.gameData.datetime.dateTime;
              let gameData = this.state.gameData;
              let length = gameData.length;
              let gameDataMap = this.state.gameDataMap;
              let i = 0;
              while(i <= length) { // sort games by start time
                gameDataMap.set(data.gamePk, data);
                if (length === 0) {
                  gameData.push(data);
                } else {
                  let storedDateTime = gameData[i].gameData.datetime.dateTime;
                  if (data.gameData.status.abstractGameState === 'Final' && this.state.active.length > 0) {
                    gameData.push(data);
                  } else {
                    if (dateTime < storedDateTime) {
                      gameData.splice(i, 0, data);
                      i = length;
                    } else if (length - 1 === i) {
                      gameData.push(data);
                    }
                  }
                }
                i++;
              }
              this.setState({gameData: gameData,gameDataMap: gameDataMap});
            })
            .done((data) => {
              this.forceUpdate () // force render
              setTimeout(function() {
                $('#loading').hide();
                $('.games').show();
              }, 300)
            })
        })

      })
  }

  changeDate(e, modifier) {
    let newDate = this.state.date;
    newDate.setDate(this.state.date.getDate() + modifier);
    this.setState({
      date: newDate,
      games : [],
      links : [],
      gameData : [],
      gameDataMap : new Map(),
      final : [],
      active : []
    });
    this.getGames(newDate);
  }

  render() {
    try {
      return(
        <div className="Scoreboard container">
          <div className="daySelector">
            <div className="row">
              <div className="col-md-4 col-sm-3 col-xs-2 text-left">
                <i className="fa fa-chevron-left" aria-hidden="true" onClick={(e) => this.changeDate(e, -2)}></i>
              </div>
              <div className="col-md-4 col-sm-6 col-xs-8 text-center">{this.state.dateString}</div>
              <div className="col-md-4 col-sm-3 col-xs-2 text-right">
                <i className="fa fa-chevron-right" aria-hidden="true" onClick={(e) => this.changeDate(e, 0)}></i>
              </div>
            </div>
          </div>
          <div className="row games">
            {this.renderGames()}
          </div>
        </div>
      );
    } catch (e) {
        console.log(e);
        return(
          <h1>Loading ...</h1>
        )
    }
  }
}

function Game(props) {
  const standings = props.standings;
  const game = props.value;
  const liveData = game.liveData;
  const linescore = liveData.linescore;
  const away = linescore.teams.away;
  away.standings = getStanding(away, standings);
  const home = linescore.teams.home;
  home.standings = getStanding(home, standings);
  const plays = liveData.plays.allPlays;
  const scoringPlays = liveData.plays.scoringPlays;
  let goals = [];
  for (let i = 0; i < scoringPlays.length; i++) {
    goals.push(plays[scoringPlays[i]]);
  }
  console.log(goals);
  const status = game.gameData.status;
  const statusCode = status.statusCode;
  let statusString = status.abstractGameState;
  const period = linescore.currentPeriodOrdinal;
  const venue = game.gameData.venue;
  let timeRemaining = linescore.currentPeriodTimeRemaining;
  let boardObject = (<div className="board"><p>{statusString}</p></div>);
  let mobileBoard = boardObject;
  let matchup = (<div className="matchup"><h3>{away.team.abbreviation} @ {home.team.abbreviation}</h3></div>);
  let scoreObject = (<div className="score"> VS </div>);
  let threeStars = (<div className="threeStars"></div>);
  let gameInfoObject = (
    <div className="gameInfo container">
      <div className="row">
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
          <h2>{away.team.name}</h2>
          <p>{away.standings.leagueRecord.wins}-{away.standings.leagueRecord.losses}-{away.standings.leagueRecord.ot}</p>
          <p className="hidden-xs">{suffixer(away.standings.divisionRank)} {away.standings.division}</p>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
          <h2>{home.team.name}</h2>
          <p>{home.standings.leagueRecord.wins}-{home.standings.leagueRecord.losses}-{home.standings.leagueRecord.ot}</p>
          <p className="hidden-xs">{suffixer(home.standings.divisionRank)} {home.standings.division}</p>
        </div>
      </div>
    </div>);
  let goalsObject = [];
  for (let i = 0; i < goals.length; i++) {
    let players = goals[i].players;
    let scorer = players[0];
    let assists = "";
    for (let i = 1; i < players.length; i++) {
      if (players[i].playerType === "Assist") {
        let name = (players[i].player.fullName.split(" ")[0].charAt(0) + "." +
        players[i].player.fullName.split(" ")[1]);
        assists += (" " + name + "(" + players[i].seasonTotal + ')');
      }
    }
    console.log(players);
    goalsObject.push(
      <div key={goals[i].result.eventCode} className="goal">
        <strong>{goals[i].team.triCode} </strong>
        {goals[i].about.ordinalNum} {goals[i].about.periodTime}
        {" " + scorer.player.fullName.split(" ")[0].charAt(0) + ". " +
        scorer.player.fullName.split(" ")[1]}({scorer.seasonTotal})
        {" " + assists}</div>);
  }
  goalsObject = (
  <div className="scoringPlays">
    <h3>Scoring Plays</h3>
    {goalsObject}
  </div>
  )
  const closeSelected =(() => {
    $('.selectedGame').hide();
  })
  const gameSelect = (() => {
    $('.selectedGame','#' + game.gamePk).show();
  })
  if (statusCode >= 3 && statusCode < 5) {
    if (timeRemaining.startsWith('0')) {
      timeRemaining = timeRemaining.slice(1);
    }
    statusString = period + " " + timeRemaining;
    scoreObject = (<div className="score">{away.goals} - {home.goals}</div>);
    boardObject = (<div className="board"><p>{statusString}</p>
    <h2><img src={"img/teams/" + away.team.abbreviation + ".png"}
     alt={away.team.abbreviation}/>{away.goals} - {home.goals}<img
       src={"img/teams/" + home.team.abbreviation + ".png"}
       alt={home.team.abbreviation}/></h2></div>);

    mobileBoard = (
      <div className="row">
        <div className="teams col-xs-8">
          <div>
            <img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/>
          </div>
          {scoreObject}
          <div>
            <img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/>
          </div>
        </div>
        <div className="status col-xs-4">
          {statusString}
        </div>
      </div>
    )
  } else if (statusCode === '1' || statusCode === '2') { //pre-game
    let startTime = new Date(game.gameData.datetime.dateTime);
    let hours = startTime.getHours();
    let minutes = startTime.getMinutes();
    if (minutes === 0) {
      minutes = "00";
    }
    if (hours >= 12) {
        minutes += "pm";
    } else {
      minutes += "am";
    }
    if(hours > 12) {
      hours -= 12;
    }
    statusString = hours + ":" + minutes;
    boardObject = (<div className="board"><p>{statusString}</p>
        <h2><img src={"img/teams/" + away.team.abbreviation + ".png"}
        alt={away.team.abbreviation}/> VS <img
       src={"img/teams/" + home.team.abbreviation + ".png"}
       alt={home.team.abbreviation}/></h2>
       <h3></h3></div>);
    mobileBoard = (
       <div className="row">
         <div className="teams col-xs-8">
           <div>
             <img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/>
           </div>
           {scoreObject}
           <div>
             <img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/>
           </div>
         </div>
         <div className="status col-xs-4">
           {statusString}
         </div>
       </div>
     )
  } else if (statusString === 'Final') {
    // check who won
    // check if it went to OT
    if(linescore.currentPeriod > 3) {
      statusString += (" " + linescore.currentPeriodOrdinal);
    }
    scoreObject = (<div className="score">{away.goals} - {home.goals}</div>);
    boardObject = (<div className="board"><p>{statusString}</p>
      <h2><img src={"img/teams/" + away.team.abbreviation + ".png"}
      alt={away.team.abbreviation}/>{away.goals} - {home.goals}<img
      src={"img/teams/" + home.team.abbreviation + ".png"}
      alt={home.team.abbreviation}/></h2></div>);
    mobileBoard = (
      <div className="row">
        <div className="teams col-xs-8">
          <div>
            <img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/>
          </div>
          {scoreObject}
          <div>
            <img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/>
          </div>
        </div>
        <div className="status col-xs-4">
          {statusString}
        </div>
      </div>
    )
    threeStars = (
    <div className="threeStars">
      <h2>Three Stars</h2>
      <div className="star">
        <i className="fa fa-star" aria-hidden="true"></i>
        <h3>{liveData.decisions.firstStar.fullName}</h3>
      </div>
      <div className="star">
        <i className="fa fa-star" aria-hidden="true"></i><i className="fa fa-star" aria-hidden="true"></i>
        <h3>{liveData.decisions.secondStar.fullName}</h3>
      </div>
      <div className="star">
        <i className="fa fa-star" aria-hidden="true"></i><i className="fa fa-star" aria-hidden="true"></i><i className="fa fa-star" aria-hidden="true"></i>
        <h3>{liveData.decisions.thirdStar.fullName}</h3>
      </div>
    </div>);
  }
  let selectedGame = (
  <div className="selectedGame">
    <div className="gameContent">
      <span onClick={closeSelected}>&times;</span>
      <h1>{statusString}</h1>
      <p>{venue.name}</p>
      <div className="scoreBoard">
        <div><img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/></div>
        {scoreObject}
        <div><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></div>
      </div>
      {gameInfoObject}
      {statusString.startsWith('Final') && threeStars}
      {goals.length > 0 && goalsObject}
    </div>
  </div>);

  return(
    <div id={game.gamePk}>
      {selectedGame}
      <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12"  onClick={gameSelect}>
        <div className="game visible-xs container">
          {mobileBoard}
        </div>
        <div className="game hidden-xs">
          {boardObject}
          {matchup}
        </div>
      </div>
    </div>
  )
}

function getStanding(team, standings) {
  return standings.get(team.team.name);
}

function suffixer(rank) {
  switch (rank) {
    case '1':
      rank += "st";
      break;
    case '2':
      rank += "nd";
      break;
    case '3':
      rank += "rd";
      break;
    default:
    rank += "th";
  }
  return rank;
}


export default Scoreboard;
