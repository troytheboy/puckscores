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
      final: [],
      active: []
    };
  }

  componentDidMount() {
    this.getGames(this.state.date);
    setInterval(() => {
      if (this.state.games.length > this.state.final.length && this.state.active.length > 0) {
        this.changeDate(null, -1);
      }
    }, 100000);
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
    $('.games').hide();
    let startDate = this.stringifyDate(date);
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
    let tomorrow = date;
    tomorrow.setDate(tomorrow.getDate() + 1);
    let endDate = this.stringifyDate(tomorrow);

    $.getJSON(nhlAPI + 'api/v1/schedule/?startDate=' + startDate + '&endDate=' + endDate)
      .then((data) => {
        this.setState({games : data.dates[0].games})
        let games = data.dates[0].games;
        let links = [];
        games.forEach( (game) => {
          if (game.status.abstractGameState === 'Final') {
            this.state.final.push(game);
          }
          if (game.status.abstractGameState === 'In Progress') {
            this.state.active.push(game);
          }
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
              this.setState({gameData: gameData});
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
              <div className="col-md-4 col-sm-4 col-xs-2 text-left">
                <i className="fa fa-chevron-left" aria-hidden="true" onClick={(e) => this.changeDate(e, -2)}></i>
              </div>
              <div className="col-md-4 col-sm-4 col-xs-8 text-center">{this.state.dateString}</div>
              <div className="col-md-4 col-sm-4 col-xs-2 text-right">
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
  let game = props.value;
  let liveData = game.liveData;
  let linescore = liveData.linescore;
  let away = linescore.teams.away;
  let home = linescore.teams.home;
  let status = game.gameData.status;
  let statusCode = status.statusCode;
  let statusString = status.abstractGameState;
  let period = linescore.currentPeriodOrdinal;
  let timeRemaining = linescore.currentPeriodTimeRemaining;
  let boardObject = (<div className="board"><p>{statusString}</p></div>)
  let mobileBoard = (<div className="board"><p>{statusString}</p></div>)
  let matchup = (<div className="matchup"><h3>{away.team.abbreviation} @ {home.team.abbreviation}</h3></div>)
  if (statusCode >= 3 && statusCode < 5) {
    if (timeRemaining.startsWith('0')) {
      timeRemaining = timeRemaining.slice(1);
    }
    statusString = period + " " + timeRemaining;

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
          <div className="score">
            {away.goals} - {home.goals}
          </div>
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
           <div className="score">
            VS
           </div>
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
            <div className="score">
              {away.goals} - {home.goals}
            </div>
            <div>
              <img src={"img/teams/" + home.team.abbreviation + ".png"} alt={home.team.abbreviation}/>
            </div>
          </div>
          <div className="status col-xs-4">
            {statusString}
          </div>
        </div>
      )
  }

  return(
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12">
      <div className="game visible-xs container">
        {mobileBoard}
      </div>
      <div className="game hidden-xs">
        {boardObject}
        {matchup}
      </div>
    </div>
  )
}

export default Scoreboard;
