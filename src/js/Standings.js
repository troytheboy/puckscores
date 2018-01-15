import React, { Component } from 'react'
import 'request'

const $ = require('jquery')
const nhlAPI = 'https://statsapi.web.nhl.com/'
const abbreviations = require('../json/abbreviations.json')

class Standings extends Component {
  constructor (props) {
    super(props)
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
              <td></td>
            </tr>
          </tbody>
        </table>
      ),
      activeLabel: 'league',
      teams: [],
      sort: ''
    }
  }

  componentDidMount () {
    this.getStandings()
  }

  getStandings () {
    const standingsURL = 'api/v1/standings/'
    $.getJSON(nhlAPI + standingsURL).then((response) => {
      let records = response.records
      this.setState({
        atl: records.filter((division) => division.division.name ===
          'Atlantic')[0].teamRecords,
        met: records.filter((division) => division.division.name ===
          'Metropolitan')[0].teamRecords,
        cen: records.filter((division) => division.division.name ===
          'Central')[0].teamRecords,
        pac: records.filter((division) => division.division.name ===
          'Pacific')[0].teamRecords
      })
    }).done(() => {
      let east = this.state.atl.concat(this.state.met)
      let west = this.state.cen.concat(this.state.pac)
      let league = east.concat(west)
      this.setState({east: east, west: west, league: league, activeTable: null})
      this.sortStandings('points')
      this.forceUpdate()
    })
  }

  constructTables () {
    // leagueTable
    let leagueTable = this.pushTeams(this.state.league, 'NHL')
    // conferanceTable
    let eastTable = this.pushTeams(this.state.east, 'east')
    let westTable = this.pushTeams(this.state.west, 'west')
    // divisionTable
    let atlanticTable = this.pushTeams(this.state.atl, 'atlantic')
    let metropolitanTable = this.pushTeams(this.state.met, 'metropolitan')
    let centralTable = this.pushTeams(this.state.cen, 'central')
    let pacificTable = this.pushTeams(this.state.pac, 'pacific')
    this.setState({
      leagueTable: leagueTable,
      conferenceTables: [
        eastTable, westTable
      ],
      divisionTables: [atlanticTable, metropolitanTable, centralTable,
        pacificTable]
    })
    switch (this.state.activeLabel) {
      case 'league':
        this.setState({activeTable: leagueTable})
        break
      case 'conference':
        this.setState({
          activeTable: [eastTable, westTable]
        })
        break
      case 'division':
        this.setState({
          activeTable: [atlanticTable, metropolitanTable,
            centralTable, pacificTable]
        })
        break
      default:
        this.setState({activeTable: leagueTable})
    }
    if (this.state.activeTable === null) {}
    this.forceUpdate()
  }

  pushTeams (teams, title) {
    let tableBody = []
    let tableHeader = (
      <thead>
        <tr key={title + '-title'} className="titleRow">
          <th className='spacer'></th>
          <th className='title'>{title}</th>
        </tr>
        <tr key={title + '-legend'}>
          <th className='spacer'></th>
          <th>Team</th>
          <th onClick={() => this.sortStandings('points')}>Points</th>
          <th onClick={() => this.sortStandings('%')}>Points %</th>
          <th className='hidden-mobile'>Record</th>
        </tr>
      </thead>
    )
    let place = 0
    let divison = false
    switch (title) {
      case 'atlantic':
        divison = true
        break;
      case 'metropolitan':
        divison = true
        break;
      case 'central':
        divison = true
        break;
      case 'pacific':
        divison = true
        break;
      default:
        divison = false;
    }
    teams.forEach((team) => {
      place++;
      tableBody.push(
        <tr key={team.team.name} id={title + '-' + place} className={place === 3 && divison ? 'playoff-line' : this.props.className}>
          <td>{place}</td>
          <td className='d-none d-lg-block'>{team.team.name}</td>
          <td className='d-lg-none'>{abbreviations[team.team.name]}</td>
          <td>{team.points}</td>
          <td>{Math.round((team.points / (team.gamesPlayed * 2)) * 100)}
            %</td>
          <td className='hidden-mobile'>{team.leagueRecord.wins}-{team.leagueRecord.losses}-{team.leagueRecord.ot}</td>
        </tr>
      )
    })
    return (
      <table key={Math.random() + '-' + title} className='table table-striped'>
        {tableHeader}
        <tbody>{tableBody}</tbody>
      </table>
    )
  }

  sortStandings (sortBy) {
    let teamDivisions = [
      this.state.league,
      this.state.east,
      this.state.west,
      this.state.atl,
      this.state.met,
      this.state.cen,
      this.state.pac
    ]
    switch (sortBy) {
      case 'points':
        if (this.state.sort === 'points') {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (a.points - b.points)
            })
          }
          this.setState({sort: '-points'})
        } else {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (b.points - a.points)
            })
          }
          this.setState({sort: 'points'})
        }
        break
      case '%':
        if (this.state.sort === '%') {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (a.points / a.gamesPlayed - b.points / b.gamesPlayed)
            })
          }
          this.setState({sort: '-%'})
        } else {
          for (let i = 0; i < teamDivisions.length; i++) {
            teamDivisions[i] = teamDivisions[i].sort((a, b) => {
              return (b.points / b.gamesPlayed - a.points / a.gamesPlayed)
            })
          }
          this.setState({sort: '%'})
        }
        break
      default:
        for (let i = 0; i < teamDivisions.length; i++) {
          teamDivisions[i] = teamDivisions[i].sort((a, b) => {
            return (b.points - a.points)
          })
        }
        this.setState({sort: 'points'})
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
    this.constructTables()
    this.forceUpdate()
  }

  switchTable (selectedTable) {
    console.log('remove', this.state.activeLabel + '-label')
    $('#' + this.state.activeLabel + '-label').removeClass('activeLabel')
    switch (selectedTable) {
      case 'league':
        this.setState({activeTable: this.state.leagueTable,
          activeLabel: 'league'})
        break
      case 'conference':
        this.setState({activeTable: this.state.conferenceTables,
          activeLabel: 'conference'})
        break
      case 'division':
        this.setState({activeTable: this.state.divisionTables,
          activeLabel: 'division'})
        break
      default:
        this.setState({activeTable: this.state.leagueTables,
          activeLabel: 'league'})
    }
    this.forceUpdate()
    $('#' + selectedTable + '-label').addClass('activeLabel')
  }

  render () {
    return (
      <div className='standings' id='standings'>
        <h1>Standings</h1>
        <br/>
        <div className=' text-center container tableSelector'>
          <div className='row'>
            <div id='league-label'
              className='col-lg-4 col-md-4 col-sm-4 col-xs-12 activeLabel'
              onClick={() => this.switchTable('league')}>
              <span>League</span>
            </div>
            <div id='conference-label'
              className='col-lg-4 col-md-4 col-sm-4 col-xs-12 text-center'
              onClick={() => this.switchTable('conference')}>
              <span>Conference</span>
            </div>
            <div id='division-label'
              className='col-lg-4 col-md-4 col-sm-4 col-xs-12'
              onClick={() => this.switchTable('division')}>
              <span>Division</span>
            </div>
          </div>
        </div>
        <br/> {this.state.activeTable}
      </div>
    )
  }
}

export default Standings
