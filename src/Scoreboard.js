import React, { Component } from 'react';
import './App.css';
import 'request'

const $ = require('jquery')
const nhlAPI = 'https://statsapi.web.nhl.com/'

class Scoreboard extends Component{
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      games : [],
      links : [],
      gameData : []
    };
  }

  componentDidMount() {
    this.getGames(this.state.date);
  }

  componentWillUnmount() {
    this.getGames(this.state.date);
  }

  renderGames() {
    var gamesHTML = [];
    let gameData = this.state.gameData;

    gameData.forEach((game) => {
      if (game !== undefined) {
        gamesHTML.push(<Game key={game.gamePk} value={game}/>)
      }
    })
    return gamesHTML;
  }

  stringifyDate(date) {
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  }

  getGames(date) {
    let startDate = this.stringifyDate(date);
    let dateString = ((date.getMonth() + 1) + "/" + date.getDate());
    this.setState({dateString : dateString});
    let tomorrow = date;
    tomorrow.setDate(tomorrow.getDate() + 1);
    let endDate = this.stringifyDate(tomorrow);

    $.getJSON(nhlAPI + 'api/v1/schedule/?startDate=' + startDate + '&endDate=' + endDate)
      .then((data) => {
        this.setState({games : data.dates[0].games})
        let games = data.dates[0].games;
        let links = [];
        games.forEach( (game) => {
          links.push(game.link);
          $.getJSON(nhlAPI + game.link)
            .then((data) => {
              this.state.gameData.push(data);
            })
            .done((data) => {
              this.forceUpdate () // force render
            })
        })
      })
      .done((data) => { //when done get liveScore object from game
      })
  }

  changeDate(e, modifier) {
    let newDate = this.state.date;
    newDate.setDate(this.state.date.getDate() + modifier);
    this.setState({
      date: newDate,
      games : [],
      links : [],
      gameData : []
    });
    this.getGames(newDate);
  }

  render() {
    try {
      return(
        <div className="Scoreboard container">
          <div className="daySelector">
            <div className="row">
              <div className="col-md-4 col-sm-4 col-xs-4 text-center">
                <i className="fa fa-chevron-left" aria-hidden="true" onClick={(e) => this.changeDate(e, -2)}></i>
              </div>
              <div className="col-md-4 col-sm-4 col-xs-4 text-center">{this.state.dateString}</div>
              <div className="col-md-4 col-sm-4 col-xs-4 text-center">
                <i className="fa fa-chevron-right" aria-hidden="true" onClick={(e) => this.changeDate(e, 0)}></i>
              </div>
            </div>
          </div>
          <div className="row">
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

  let game = props.value;
  let liveData = game.liveData;
  let linescore = liveData.linescore;
  let away = linescore.teams.away;
  let home = linescore.teams.home;
  let status = game.gameData.status;
  let statusCode = status.statusCode;
  let statusString = status.abstractGameState;
  let awayObject = (<div className="teamScore">
      <span><img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/></span>
      <h3>{away.team.name}</h3></div>);
  let homeObject = (<div className="teamScore">
      <span><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></span>
      <h3>{home.team.name}</h3></div>);
  let period = linescore.currentPeriodOrdinal;
  let timeRemaining = linescore.currentPeriodTimeRemaining;
  if (statusCode >= 3 && statusCode < 5) {
    if (timeRemaining.startsWith('0')) {
      timeRemaining = timeRemaining.slice(1);
    }
    statusString = period + " " + timeRemaining;
    awayObject = (<div className="teamScore">
      <span><img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/></span>
      <h3>{away.team.abbreviation}</h3> <strong>{away.goals}</strong> | {away.shotsOnGoal} shots</div>)
    homeObject = (<div className="teamScore">
      <span><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></span>
      <h3>{home.team.abbreviation}</h3> <strong>{home.goals}</strong> | {home.shotsOnGoal} shots</div>)
  } else if (statusCode === '1') { //pre-game
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
  } else if (statusString === 'Final') {
    // check who won
    let awayText;
    let homeText;
    if (away.goals > home.goals) {
      awayText = (<strong><h3>{away.team.abbreviation}</h3> <strong>{away.goals}</strong> | {away.shotsOnGoal} shots</strong>)
      homeText = (<span><h3>{home.team.abbreviation}</h3> {home.goals} | {home.shotsOnGoal} shots</span>)
    } else {
      homeText = (<strong><h3>{home.team.abbreviation}</h3> <strong>{home.goals}</strong> | {home.shotsOnGoal} shots</strong>)
      awayText = (<span><h3>{away.team.abbreviation}</h3> {away.goals} | {away.shotsOnGoal} shots</span>)
    }
    // check if it went to OT
    if(linescore.currentPeriod > 3) {
      statusString += (" " + linescore.currentPeriodOrdinal);
    }
    awayObject = (<div className="teamScore">
      <span className="logo"><img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/></span>
      {awayText}</div>)
    homeObject = (<div className="teamScore">
      <span className="logo"><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></span>
      {homeText}</div>)
  }
  return(
    <div className="col-md-4 col-sm-4">
      <div className="game">
        <p>{statusString}</p>
        {awayObject}
        {homeObject}
      </div>
    </div>
  )
}

export default Scoreboard;
