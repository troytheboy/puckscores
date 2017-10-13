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
    $('#loading').show();
    $('.Scoreboard').hide();
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
              let dateTime = data.gameData.datetime.dateTime;
              let gameData = this.state.gameData;
              let length = gameData.length;
              let i = 0;
              while(i <= length) { // sort games by start time
                if (length === 0) {
                  gameData.push(data);
                } else {
                  let storedDateTime = gameData[i].gameData.datetime.dateTime;
                  if (dateTime < storedDateTime) {
                    gameData.splice(i, 0, data);
                    i = length;
                  } else if (length - 1 === i) {
                    gameData.push(data);
                  }
                }
                i++;
              }
              this.setState({gameData: gameData});
            })
            .done((data) => {
              this.forceUpdate () // force render
              setTimeout(function() {
                $('#loading').hide();
                $('.Scoreboard').show();
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
              <div className="col-md-4 col-sm-4 col-xs-4 text-left">
                <i className="fa fa-chevron-left" aria-hidden="true" onClick={(e) => this.changeDate(e, -2)}></i>
              </div>
              <div className="col-md-4 col-sm-4 col-xs-4 text-center">{this.state.dateString}</div>
              <div className="col-md-4 col-sm-4 col-xs-4 text-right">
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
      <h3 className="hidden-xs">{away.team.name}</h3><h3 className="visible-xs">{away.team.abbreviation}</h3></div>);
  let homeObject = (<div className="teamScore">
      <span><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></span>
      <h3 className="hidden-xs">{home.team.name}</h3><h3 className="visible-xs">{home.team.abbreviation}</h3></div>);
  let period = linescore.currentPeriodOrdinal;
  let timeRemaining = linescore.currentPeriodTimeRemaining;
  if (statusCode >= 3 && statusCode < 5) {
    if (timeRemaining.startsWith('0')) {
      timeRemaining = timeRemaining.slice(1);
    }
    statusString = period + " " + timeRemaining;
    awayObject = (<div className="teamScore">
      <span><img src={"img/teams/" + away.team.abbreviation + ".png"} alt={away.team.abbreviation}/></span>
      <h3>{away.team.abbreviation}</h3> <strong>{away.goals}</strong><span className="hidden-xs"> | {away.shotsOnGoal} shots</span></div>)
    homeObject = (<div className="teamScore">
      <span><img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/></span>
      <h3>{home.team.abbreviation}</h3> <strong>{home.goals}</strong><span className="hidden-xs"> | {home.shotsOnGoal} shots</span></div>)
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
      awayText = (<strong><h3>{away.team.abbreviation}</h3> <strong>{away.goals}</strong><span className="hidden-xs"> | {away.shotsOnGoal} shots</span></strong>)
      homeText = (<span><h3>{home.team.abbreviation}</h3> {home.goals}<span className="hidden-xs"> | {home.shotsOnGoal} shots</span></span>)
    } else {
      homeText = (<strong><h3>{home.team.abbreviation}</h3> <strong>{home.goals}</strong><span className="hidden-xs"> | {home.shotsOnGoal} shots</span></strong>)
      awayText = (<span><h3>{away.team.abbreviation}</h3> {away.goals}<span className="hidden-xs"> | {away.shotsOnGoal} shots</span></span>)
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
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      <div className="game">
        <p>{statusString}</p>
        {awayObject}
        {homeObject}
      </div>
    </div>
  )
}

export default Scoreboard;
