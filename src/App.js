import React, { Component } from 'react';
import Scoreboard from './Scoreboard.js'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img className="icon" src="img/icons/nhl-icon.png" alt="nhl-icon" />
          <h2>SCOREBOARD</h2>
        </div>
        <Scoreboard/>
      </div>
    );
  }
}

export default App;
