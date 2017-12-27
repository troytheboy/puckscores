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
        <table>
          <tbody>
            <tr>
              <td>Loading...</td>
              <td>Loading...</td>
            </tr>
          </tbody>
        </table>
      ),
      activeLabel: "league",
      teams: [],
      sort: '',

    }
  }

  componentDidMount() {
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
    // leagueTable
    let leagueTable = this.pushTeams(this.state.league, "");
    // conferanceTable
    let eastTable = this.pushTeams(this.state.east, "east");
    let westTable = this.pushTeams(this.state.west, "west");
    // divisionTable
    let atlanticTable = this.pushTeams(this.state.atl, "atlantic");
    let metropolitanTable = this.pushTeams(this.state.met, "metropolitan");
    let centralTable = this.pushTeams(this.state.cen, "central");
    let pacificTable = this.pushTeams(this.state.pac, "pacific");
    this.setState({
      leagueTable: leagueTable,
      conferenceTables: [eastTable, westTable],
      divisionTables: [atlanticTable, metropolitanTable, centralTable, pacificTable],
      activeTable: [eastTable, westTable]
    })
    this.forceUpdate();
  }

  pushTeams(teams, title) {
    let tableBody = [];
    let tableHeader = (
      <thead>
        <tr key="{title} title">
          <th className="title">{title}</th>
        </tr>
        <tr key="{title} legend">
          <th></th>
          <th>Team</th>
          <th onClick={() => this.sortStandings("points")}>Points</th>
          <th onClick={() => this.sortStandings('%')}>Points %</th>
          <th>Record</th>
        </tr>
      </thead>
    )
    let place = 0;
    teams.forEach((team) => {
      tableBody.push(
        <tr key={team.team.name}>
          <td>{++place}</td>
          <td>{team.team.name}</td>
          <td>{team.points}</td>
          <td>{(team.points / (team.gamesPlayed * 2)).toFixed(2)}</td>
          <td>{team.leagueRecord.wins}-{team.leagueRecord.losses}-{team.leagueRecord.ot}</td>
        </tr>
      )
    })
    return (
      <table key={Math.random() + "-" + title}>
        {tableHeader}
        <tbody>{tableBody}</tbody>
      </table>
    );
  }

  sortStandings(sortBy) {
    let league = this.state.league;
    let teamDivisions = [this.state.league, this.state.east, this.state.west,
       this.state.atl, this.state.met, this.state.cen, this.state.pac];
    switch(sortBy) {
      case "points":
        if (this.state.sort === "points") {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (a.points - b.points);
            })
          }
          this.setState({
              sort: "-points"
          });
        } else {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (b.points - a.points);
            })
          }
          this.setState({
              sort: "points"
          });
        }
        break;
      case '%':
        if (this.state.sort === '%') {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (a.points / a.gamesPlayed - b.points / b.gamesPlayed);
            })
          }
          this.setState({
              sort: "-%"
          });
        } else {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (b.points / b.gamesPlayed - a.points / a.gamesPlayed);
            })
          }
          this.setState({
              sort: '%'
          });
        }
        break;
      default:
      for (let i = 0; i < teamDivisions.length; i++) {
        teamDivisions[i] = teamDivisions[i].sort((a, b) => {
          return (b.points - a.points);
        })
      }
        this.setState({
            sort: "points"
        });
    }
    this.setState({
      league: teamDivisions[0],
      east: teamDivisions[1],
      west: teamDivisions[2],
      atl: teamDivisions[3],
      met: teamDivisions[4],
      cen: teamDivisions[5],
      pac: teamDivisions[6]
    })
    this.constructTables();
  }

  switchTable(selectedTable) {
    $("#"+this.state.activeLabel+"-lable").removeClass("activeLabel");

    switch (selectedTable) {
      case 'league':
        this.setState({
          activeTable: this.state.leagueTable,
          activeLabel: "league"
        })
        break;
      case 'conference':
        this.setState({
          activeTable: this.state.conferenceTables,
          activeLabel: "conference"
        })
        break;
      case 'division':
        this.setState({
          activeTable: this.state.divisionTables,
          activeLabel: "division"
        })
        break;
      default:
        this.setState({
          activeTable: this.state.leagueTables,
          activeLabel: "league"
        })
    }
    this.forceUpdate();
    $("#"+this.state.activeLabel+"-lable").addClass("activeLabel");
  }

  render() {
    return(
      <div className="standings" id="standings">
        <h1>Standings</h1>
        <br/>
        <div className=" text-center container tableSelector">
          <div className="row">
            <div id="league-label" className="col-lg-4 col-md-4 col-sm-4 col-xs-4 selectedTable"
              onClick={() => this.switchTable("league")}>
              <span>League</span>
            </div>
            <div id="conference-label" className="col-lg-4 col-md-4 col-sm-4 col-xs-4"
              onClick={() => this.switchTable("conference")}>
              <span>Conference</span>
            </div>
            <div id="division-label" className="col-lg-4 col-md-4 col-sm-4 col-xs-4"
              onClick={() => this.switchTable("division")}>
              <span>Division</span>
            </div>
          </div>
        </div>
        <br/>
        {this.state.activeTable}
      </div>
    )
  }
}

export default Standings;