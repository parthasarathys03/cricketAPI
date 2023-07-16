const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server is running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// 1. get

app.get("/players/", async (request, response) => {
  const sqQuery = `
   SELECT 
   *
   FROM
   player_details
 `;
  const store = await db.all(sqQuery);

  response.send(store.map((eachPlayer) => convertObject(eachPlayer)));
});

//2.specific

app.get("/players/:playerId/", async (request, response) => {
  console.log(request.params);
  const { playerId } = request.params;
  const sqQuery = `
   SELECT 
   *
   FROM
   player_details  
   where
     player_Id=  ${playerId};
 `;
  const store = await db.get(sqQuery);

  response.send(convertObject(store));
});

// add
app.post("/players/", async (request, response) => {
  const playerDetails = request.body;

  const { playerName, jerseyNumber, role } = playerDetails;
  const sqQuery = `
  INSERT INTO 
  cricket_team (player_name,jersey_number,role)
  VALUES
   ('${player_name}',
   ${jersey_number},
   '${role}')
 `;
  const store = await db.run(sqQuery);
  console.log(store);
  response.send("Player Added To Team");
});

// 3.update

app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerId } = request.params;

  const { playerName } = playerDetails;
  const sqQuery = `
  UPDATE
 player_details
  SET
  player_name='${playerName}'
  WHERE
   player_Id=  ${playerId};
 `;
  const store = await db.run(sqQuery);

  response.send("Player Details Updated");
});

const convertObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// 4. get matches

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const sqQuery = `
   SELECT 
   *
   FROM
  match_details
  WHERE
  match_id=${matchId}
 `;
  const store = await db.get(sqQuery);
  console.log(store);
  response.send(convertObject1(store));
});

// 5. get matches and junction table

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const sqQuery = `
   SELECT 
   match_details.match_id, match_details.match, match_details.year
   FROM
  match_details natural join player_match_score
  WHERE
    player_id=${playerId}
 `;
  const store = await db.all(sqQuery);
  response.send(store.map((eachPlayer) => convertObject1(eachPlayer)));
});

// 6. get players and junction table

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const sqQuery = `
   SELECT 
   player_details.player_id, player_details.player_name
   FROM
  player_details natural join player_match_score
  WHERE
    match_id=${matchId}
   
  
 `;
  const store = await db.all(sqQuery);
  response.send(store.map((eachPlayer) => convertObject(eachPlayer)));
});

const convertObject2 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.total_score,
    totalFours: dbObject.total_fours,
    totalSixes: dbObject.total_sixes,
  };
};

// 7. get for particular playerId

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const sqQuery = `
   SELECT
    player_details.player_id,
    player_details.player_name,
    sum(score) as total_score ,
    sum(fours) as total_fours,
    sum(sixes) as total_sixes
   FROM
   player_details inner join player_match_score
  WHERE
   player_details.player_id=player_match_score.player_id
    and player_match_score.player_id=${playerId}
   group by

    player_details.player_id
   
  
 `;
  const store = await db.get(sqQuery);
  console.log(store);
  response.send(convertObject2(store));
});

module.exports = app;
