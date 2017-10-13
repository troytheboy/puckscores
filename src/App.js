import React, { Component } from 'react';
import Scoreboard from './Scoreboard.js'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img className="icon" src="img/icons/text_logo_light_bg.png" alt="puck_score" />
        </div>
        <Scoreboard/>
        <div className="loading">
          <img id="loading" src="img/icons/puck_logo.png" alt="loading" />
        </div>
      </div>
    );
  }
}

export default App;
