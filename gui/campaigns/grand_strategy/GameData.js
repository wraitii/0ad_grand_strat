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
		this.playerHero = undefined;

		this.turnI = 0;
		this.turnEvents = [];
	}

	Serialize()
	{
		let tribes = {};
		for (let tribe in this.tribes)
			tribes[tribe] = this.tribes[tribe].Serialize();

		let pv = {};
		for (let prov in this.provinces)
			pv[prov] = this.provinces[prov].Serialize();
		return {
			"turn": this.turn,
			"playerTribe": this.playerTribe,
			"playerHero": this.playerHero.Serialize(),
			"tribes": tribes,
			"provinces": pv,
		};
	}

	Deserialize(data)
	{
		this.parseHistory();

		this.turn = data.turn;

		for (let prov in data.provinces)
			this.provinces[prov].Deserialize(data.provinces[prov]);

		for (let code in data.tribes)
			this.tribes[code].Deserialize(data.tribes[code]);

		this.playerTribe = data.playerTribe;
		this.playerHero = new Hero();
		this.playerHero.Deserialize(data.playerHero);
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
		game.Deserialize(CampaignRun.getCurrentRun().data.gameData);
		if (CampaignRun.getCurrentRun().data.processEndedGame)
		{
			let data = CampaignRun.getCurrentRun().data.processEndedGame;
			if (game.processEndedGame(data))
			{
				delete CampaignRun.getCurrentRun().data.processEndedGame;
				game.save();
			}
		}

		return game;
	}

	save()
	{
		CampaignRun.getCurrentRun().data.gameData = this.Serialize();
		CampaignRun.getCurrentRun().save();
	}

	initialiseGame()
	{
		this.parseHistory();

		// Assign tribe initial provinces
		for (let code in this.tribes)
		{
			let tribe = this.tribes[code];
			if (!tribe.data.startProvinces)
				continue;
			for (let prov of tribe.data.startProvinces)
				this.provinces[prov].setOwner(code);
		}

		// Create human player
		this.playerTribe = "athens";
		this.playerHero = new Hero("player", "athens");

		this.save();
	}

	parseHistory()
	{
		let files = Engine.ListDirectoryFiles("campaigns/grand_strategy/provinces/", "**.json", false);
		for (let i = 0; i < files.length; ++i)
		{
			let file = files[i];
			let data = Engine.ReadJSONFile(file);
			this.provinces[data.code] = new Province(data);
		}

		files = Engine.ListDirectoryFiles("campaigns/grand_strategy/tribes/", "**.json", false);
		for (let i = 0; i < files.length; ++i)
		{
			let file = files[i];
			let data = Engine.ReadJSONFile(file);
			this.tribes[data.code] = new Tribe(data);
		}
	}

	/**
	 * Generate a map assuming the human player attacks the given code.
	 */
	doAttack(code)
	{
		let province = this.provinces[code];
		if (province.ownerTribe == this.playerTribe)
		{
			error("Cannot attack your own province");
			return;
		}

		this.save();
		// Generate a random map.
		let settings = {
			"mapType": "random",
			"map": "maps/random/mainland",
			"settings": {
				"CheatsEnabled": true
			},
			"campaignData": {
				"run": CampaignRun.getCurrentRun().filename,
				"province": code
			}
		};
		let gameSettings = new GameSettings().init();
		gameSettings.fromInitAttributes(settings);
		// TODO: pass translated name, description, preview.
		gameSettings.mapName.set(code);

		gameSettings.playerCount.setNb(2);
		gameSettings.playerAI.set(1, {
			"bot": "petra",
			"difficulty": 2,
			"behavior": "random",
		});
		gameSettings.playerCiv.setValue(0, this.tribes[this.playerTribe].civ);
		gameSettings.playerCiv.setValue(1, this.tribes[province.ownerTribe].civ);

		let assignments = {
			"local": {
				"player": 1,
				"name": Engine.ConfigDB_GetValue("user", "playername.singleplayer") || Engine.GetSystemUsername()
			}
		};
		gameSettings.launchGame(assignments);
		Engine.SwitchGuiPage("page_loading.xml", {
			"attribs": gameSettings.toInitAttributes(),
			"playerAssignments": assignments
		});
	}

	/**
	 * TODO: would be nice to make this asynchronous
	 */
	doFinishTurn()
	{
		if (!this.turnI)
		{
			// Start of the turn
			this.turnI = 25;
			this.turnEvents = [];
		}

		--this.turnI;

		if (this.turnI === 1)
		{
			// Tribe '''AI'''
			for (let code in this.tribes)
			{
				if (code === this.playerTribe)
					continue;
				let tribe = this.tribes[code];
				let targets = new Set();
				for (let prov of tribe.controlledProvinces)
					for (let pot of g_GameData.provinces[prov].getLinks())
					{
						if (g_GameData.provinces[pot].ownerTribe !== code)
							targets.add(pot);
					}

				if (randBool(0.5) && targets.size)
				{
					let target = pickRandom(Array.from(targets));
					let province = g_GameData.provinces[target];
					if (province.ownerTribe === this.playerTribe)
					{
						this.turnEvents.push({
							"type": "attack",
							"data": {
								"attacker": tribe,
								"target": target
							}
						});
					}
					else
					{
						province.setOwner(code);
					}
				}
			}
		}
		else if (this.turnI === 0)
		{
			// End of turn, control will be returned to the player.
			this.turn++;

			this.playerHero.actionsLeft = 1;

			this.save();
			return true;
		}
		return false;
	}

	processEndedGame(endGameData)
	{
		if (endGameData.won)
		{
			this.provinces[endGameData.initData.province].ownerTribe = this.playerTribe;
		}
		return true;
	}
}
