import React, { Component } from 'react'
import Scoreboard from './Scoreboard'
import Standings from './Standings'
import { connect, mapStateToProps, mapDispatchToProps } from 'react-redux'
import '../reducers/store.js'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      activeComponent: 'scoreboard'
    }
  }

  navigate (component) {
    this.setState({ activeComponent: component })
  }

  render () {
    let activeComponent = 'loading'

    if (this.state.activeComponent === 'scoreboard') {
      activeComponent = (<Scoreboard/>)
    } else if (this.state.activeComponent === 'standings') {
      activeComponent = (<Standings/>)
    }

    return (
      <div className='App'>
        <div className='App-header'>
          <img className='icon' src='img/icons/text_logo_light_bg.png' alt='puck_score' />
          <div className='links'>
            <span id='scoreboardLink' onClick={() => this.navigate('scoreboard')} className={this.state.activeComponent === 'scoreboard' ? 'active' : ''}>Scores</span>
            <span id='standingsLink' onClick={() => this.navigate('standings')} className={this.state.activeComponent === 'standings' ? 'active' : ''}>Standings</span>
          </div>
        </div>
        {activeComponent}
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
