import React, { Component } from 'react';
import './App.css';
import 'request';

const $ = require('jquery');
const nhlAPI = 'https://statsapi.web.nhl.com/';


class Standings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      atl: [],
      met: [],
      cen: [],
      pac: [],
      activeTable: (
        <tbody>
          <tr>
            <td>Loading...</td>
            <td>Loading...</td>
          </tr>
        </tbody>),
      teams: [],
      sort: '',

    }
  }

  componentDidMount() {
    console.log('getStandings')
    this.getStandings();
  }

  getStandings() {
    const standingsURL = "api/v1/standings/";
    let teams = [];
    $.getJSON(nhlAPI + standingsURL)
      .then((response) => {
        let records = response.records;
        this.setState({
          atl: records.filter((division) => division.division.name === 'Atlantic')[0].teamRecords,
          met: records.filter((division) => division.division.name === 'Metropolitan')[0].teamRecords,
          cen: records.filter((division) => division.division.name === 'Central')[0].teamRecords,
          pac: records.filter((division) => division.division.name === 'Pacific')[0].teamRecords
        });
      })
      .done(() =>{
        let east = this.state.atl.concat(this.state.met);
        let west = this.state.cen.concat(this.state.pac);
        //console.log("east", east)
        let league = east.concat(west);
        this.setState({
          east: east,
          west: west,
          league: league
        });
        this.sortStandings("points");
      });
  }

  constructTables() {
    let divisionTable;
    let conferenceTable;
    let leagueTable = [];
    // leagueTable
    //loop thru every team and add to table
    let place = 0;
    this.state.league.forEach((team) => {
      leagueTable.push(<tr key={team.team.name}>
        <td>{++place}</td>
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
    let league = this.state.league;
    switch(sortBy) {
      case "points":
        if (this.state.sort === "points") {
          league = league.sort((team1, team2) => {
            return (team1.points - team2.points);
          })
          this.setState({
              sort: "-points"
          });
        } else {
          console.log('switch',sortBy);
          league = league.sort((team1, team2) => {
            return (team2.points - team1.points);
          })
          this.setState({
              sort: "points"
          });
        }
        break;
      case '%':
        if (this.state.sort === '%') {
          league = league.sort((team1, team2) => {
            return ((team1.points / team1.gamesPlayed) - (team2.points / team2.gamesPlayed));
          })
          this.setState({
              sort: "-%"
          });
        } else {
          league = league.sort((team1, team2) => {
            return ((team2.points / team2.gamesPlayed) - (team1.points / team1.gamesPlayed));
          })
          this.setState({
              sort: '%'
          });
        }
        break;
      default:
        league = league.sort((team1, team2) => {
          return (team2.points - team1.points);
        })
        this.setState({
            sort: "points"
        });
    }
    console.log(sortBy, league[0].team.name);
    this.setState({
      league: league
    })
    this.constructTables();
  }

  render() {
    return(
      <div className="standings" id="standings">
        <h1>Standings</h1>
        <br/>
        <div className=" text-center container tableSelector">
          <div className="row">
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4 selectedTable">
              <span>League</span>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
              <span>Conference</span>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
              <span>Division</span>
            </div>
          </div>
        </div>
        <br/>
        <table>
          <thead>
            <tr>
              <th></th>
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
