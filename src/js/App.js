import React, { Component } from 'react'
import Scoreboard from './Scoreboard.js'
import Standings from './Standings'
const $ = require('jquery')

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      activeSection: 'scoreboard'
    }
  }

  navigate (section) {
    $('#' + this.state.activeSection + 'Link').removeClass('active')
    $('div#' + this.state.activeSection).hide()
    this.setState({activeSection: section})
    $('#' + section + 'Link').addClass('active')
    $('div#' + section).show()
  }

  render () {
    return (
      <div className='App'>
        <div className='App-header'>
          <img className='icon' src='img/icons/text_logo_light_bg.png' alt='puck_score' />
          <div className='links'>
            <span id='scoreboardLink' onClick={() => this.navigate('scoreboard')} className='active'>Scores</span>
            <span id='standingsLink' onClick={() => this.navigate('standings')}>Standings</span>
          </div>
        </div>
        <Standings/>
        <Scoreboard/>
        <div className='loading'>
          <img id='loading' src='img/icons/puck_logo.png' alt='loading' />
        </div>
      </div>
    )
  }
}

export default App
