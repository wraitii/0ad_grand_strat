/**
 * Run metadata for the 'grand_strategy' metagame.
 */
var g_GameData;

class GameData
{
	constructor()
	{
		this.turn = 0;
		this.provinces = {};
		this.tribes = {};

		this.playerTribe = undefined;

		this.turnI = 0;
	}

	Serialize()
	{
		let pv = {};
		for (let prov in this.provinces)
			pv[prov] = this.provinces[prov].Serialize();
		return {
			"turn": this.turn,
			"playerTribe": this.playerTribe,
			"provinces": pv
		}
	}

	Deserialize(data)
	{
		this.parseHistory();
		this.tribes.player = new Tribe("player");

		this.turn = data.turn;
		this.playerTribe = data.playerTribe;
		for (let prov in data.provinces)
			this.provinces[prov].Deserialize(data.provinces[prov]);
	}

	static createNewGame()
	{
		let game = new GameData();
		g_GameData = game;
		game.initialiseGame();
		return game;
	}

	static loadRun()
	{
		let game = new GameData();
		g_GameData = game;
		game.Deserialize(g_CampaignMenu.run.data.gameData);
		if (g_CampaignMenu.run.data.processEndedGame)
		{
			let data = g_CampaignMenu.run.data.processEndedGame;
			if (game.processEndedGame(data))
			{
				delete g_CampaignMenu.run.data.processEndedGame;
				this.save();
			}
		}

		return game;
	}

	save()
	{
		g_CampaignMenu.run.data.gameData = this.Serialize();
		g_CampaignMenu.run.save();
	}

	initialiseGame()
	{
		this.parseHistory();
		// Parse tribes
		// TODO

		// Create player tribe.
		// TODO: do this better
		this.tribes.player = new Tribe("player");
		this.playerTribe = "player";
		this.provinces[255].ownerTribe = "player";

		this.save();
	}

	parseHistory()
	{
		let files = Engine.ListDirectoryFiles("campaigns/grand_strategy/provinces/", "**.json", false);
		for (let i = 0; i < files.length; ++i)
		{
			let file = files[i];
			let data = Engine.ReadJSONFile(file);
			this.provinces[data.hash] = new Province(data.hash, file);
		}
	}

	doAttack(code)
	{
		// Generate a random map.
		Engine.SwitchGuiPage("page_gamesetup.xml", {
			"mapType": "random",
			"map": "maps/random/mainland",
			"autostart": true,
			"campaignData": {
				"run": g_CampaignMenu.run.filename,
				"province": code
			}
		});
	}

	/**
	 * TODO: would be nice to make this asynchronous
	 */
	doFinishTurn()
	{
		if (!this.turnI)
			this.turnI = 100;
		--this.turnI;
		if (this.turnI !== 0)
			return false;
		this.turn++;

		this.save();
		return true;
	}

	processEndedGame(endGameData)
	{
		if (endGameData.won)
		{
			this.provinces[endGameData.initData.province].ownerTribe = this.playerTribe;
		}

		this.turn++;
		return true;
	}
}
