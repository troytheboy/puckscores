function Game(props) {
  if (first) {
    console.log(props.value);
    first = false;
  }
  let game = props.value;
  let liveData = game.liveData;
  let linescore = liveData.linescore;
  let away = linescore.teams.away;
  let home = linescore.teams.home;
  let status = game.gameData.status.detailedState;
  let statusString;
  if (status == 1) { //pre-game
    //console.log(game);
  } else if (status >= 6){ //game over
    statusString = "Final"
  } else { // game on
    statusString = "Status code: " + status;
    //let gameStats = getGameStats(game.link);
    //console.log(gameStats);
  }

  return(
    <div className="game col-sm-4">
      <p>{statusString}</p>
      <h3>{away.team.name} <small>{away.goals}</small></h3>
      <h3>{home.team.name} <small>{home.goals}</small></h3>
    </div>
  )
}

function getGameStats(link) {
  let x;
  let jqxhr = $.getJSON(nhlAPI + link)
    .then((data) => {
      console.log(data.liveData.linescore)
    })
    .done((data) => {
      x = data;
    })
  return x;
}
