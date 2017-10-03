import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import 'request'
//import 'jquery'
let request = require('request');
let $ = require('jquery')
const nhlAPI = 'https://statsapi.web.nhl.com/api/v1/schedule/'
let first = true;

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <Scoreboard/>
      </div>
    );
  }
}

class Scoreboard extends Component{
  constructor(props) {
    super(props);
    this.state = {
      date: new Date()
    };
  }

  componentDidMount() {
    this.getGames();
  }

  renderGames() {
    //console.log(this.state.stats)
    this.getGames();
    var gamesHTML = [];
    this.state.games.forEach(function (game) {
      if (game !== 'undefined') {
        //console.log(game);
        gamesHTML.push(<Game key={game.gamePk} value={game} />)
      }
    })
    return gamesHTML;
  }

  stringifyDate(date) {
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  }

  getGames() {
    let startDate = this.stringifyDate(this.state.date);
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    //console.log(new Date(this.state.date + 1))
    let endDate = this.stringifyDate(tomorrow);

    let x;
    let jqxhr = $.getJSON(nhlAPI + '?startDate=' + startDate + '&endDate=' + endDate)
      .then((data) => {
        this.setState({games : data.dates[0].games})
        //console.log(nhlAPI + '?startDate=2017-10-3&endDate=2017-10-4');
        //console.log(data);
      })
      .done((data) => {
        x = data;
      })
  }

  render() {
    try {
      return(
        <div className="Scoreboard">
          {this.renderGames()}
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
  if (first) {
    console.log(props.value);
    first = false;
  }
  let game = props.value;
  let away = game.teams.away;
  let home = game.teams.home;
  let status = game.status.statusCode;
  if (status == 1) { //pre-game
    return(
      <div className="game">
        <p>Not yet</p>
        <h2>{away.team.name}</h2>
        <h2>{home.team.name}</h2>
      </div>
    )
  } else if (status == 6){ //game over
    return (
      <div className="game">
        <p>Final</p>
        <h2>{away.team.name} {away.score}</h2>
        <h2>{home.team.name} {home.score}</h2>
      </div>
    )
  } else { // game on
    return (
      <div className="game">
        <p>Game Status: {game.status.statusCode}</p>
        <h2>{away.team.name} {away.score}</h2>
        <h2>{home.team.name} {home.score}</h2>
      </div>
    )
  }

}


export default App;
