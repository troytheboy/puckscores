import React, { Component } from 'react';
import './App.css';
import 'request';

const $ = require('jquery');
const nhlAPI = 'https://statsapi.web.nhl.com/';


class Standings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      standings: new Map(),
      activeTable: (
        <tbody>
          <tr>
            <td>Loading...</td>
            <td>Loading...</td>
          </tr>
        </tbody>),
      teams: [],
      sort: ''
    }
  }

  componentDidMount() {
    this.getStandings();
  }

  getStandings() {
    const standingsURL = "api/v1/standings/";
    let standings = new Map();
    let teams = [];
    $.getJSON(nhlAPI + standingsURL)
      .then((response) => {
        response.records.forEach((division) => {
          standings.set(division.division.name, division);
          division.teamRecords.forEach((team) => {
            teams.push(team);
          })
        })
        //console.log('before',teams);
        // teams = teams.sort((team1, team2) => {
        //   return (team2.points - team1.points);
        // })
        //console.log('after',teams);
        this.setState({
          standings: standings,
          teams: teams
        })
      })
      .done(() =>{
        this.forceUpdate(); // force render
        console.log(this.state.teams);
        this.sortStandings('points');
      });
  }

  constructTables() {
    let divisionTable;
    let conferanceTable;
    let leagueTable = [];
    // leagueTable
    //loop thru every team and add to table
    this.state.teams.forEach((team) => {
      leagueTable.push(<tr key={team.team.name}>
        <td>{team.team.name}</td>
        <td>{team.points}</td>
        <td>{(team.points / (team.gamesPlayed * 2)).toFixed(2)}</td>
        <td>{team.leagueRecord.wins}-{team.leagueRecord.losses}-{team.leagueRecord.ot}</td>
      </tr>)
    })
    this.setState({
      activeTable: (<tbody>{leagueTable}</tbody>)
    })
    // conferanceTable

    // divisionTable
  }

  sortStandings(sortBy) {
    let teams = this.state.teams;
    switch(sortBy) {
      case 'points':
        if (this.state.sort === 'points') {
          teams = teams.sort((team1, team2) => {
            return (team1.points - team2.points);
          })
          this.setState({
              sort: '-points'
          });
        } else {
          console.log('switch',sortBy);
          teams = teams.sort((team1, team2) => {
            return (team2.points - team1.points);
          })
          this.setState({
              sort: 'points'
          });
        }
        break;
      case '%':
        if (this.state.sort === '%') {
          teams = teams.sort((team1, team2) => {
            return ((team1.points / team1.gamesPlayed) - (team2.points / team2.gamesPlayed));
          })
          this.setState({
              sort: '-%'
          });
        } else {
          teams = teams.sort((team1, team2) => {
            return ((team2.points / team2.gamesPlayed) - (team1.points / team1.gamesPlayed));
          })
          this.setState({
              sort: '%'
          });
        }
        break;
      default:
        teams = teams.sort((team1, team2) => {
          return (team2.points - team1.points);
        })
        this.setState({
            sort: 'points'
        });
    }
    console.log(sortBy, teams[0].team.name);
    this.setState({
      teams: teams
    })
    this.constructTables();
  }

  render() {
    return(
      <div className="standings" id="standings">
        <h1>Standings</h1>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th onClick={() => this.sortStandings('points')}>Points</th>
              <th onClick={() => this.sortStandings('%')}>Points %</th>
              <th>Record</th>
            </tr>
          </thead>
          {this.state.activeTable}
        </table>
      </div>
    )
  }
}

export default Standings;
