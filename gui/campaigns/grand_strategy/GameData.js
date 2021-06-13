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

		this.mapTypes = new MapTypes();

		this.pastTurnEvents = [];
	}

	Serialize()
	{
		const tribes = {};
		for (const tribe in this.tribes)
			tribes[tribe] = this.tribes[tribe].Serialize();

		const pv = {};
		for (const prov in this.provinces)
			pv[prov] = this.provinces[prov].Serialize();

		const pastEvents = [];
		for (const evs of this.pastTurnEvents)
		{
			const t = [];
			for (const event of evs)
				t.push(event.serialize());
			pastEvents.push(t);
		}

		return {
			"turn": this.turn,
			"playerTribe": this.playerTribe,
			"playerHero": this.playerHero.Serialize(),
			"tribes": tribes,
			"provinces": pv,
			"events": pastEvents
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

		this.pastTurnEvents = [];
		for (const evs of data.events)
		{
			const t = [];
			for (const event of evs)
			{
				const ev = GSEvent.CreateFromSerialized(event);
				ev.deserialize(event);
				t.push(ev);
			}
			this.pastTurnEvents.push(t);
		}
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
		this.playerHero = new Hero("athens", "thessalia");

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
	 * Generate a map and play out an attack.
	 */
	playOutAttack(attackerTribe, provinceCode)
	{
		let province = this.provinces[provinceCode];
		if (province.ownerTribe == attackerTribe)
		{
			error("Cannot attack your own province");
			return;
		}

		// TODO: should snapshot or something, also this assumes human player involved.
		this.save();

		let playerIsAttacker = attackerTribe == this.playerTribe;
		let playerID = playerIsAttacker ? 0 : 1;

		// Generate a random map.
		let settings = {
			"mapType": "random",
			"map": "maps/random/mainland",
			"settings": {
				"CheatsEnabled": true
			},
			"campaignData": {
				"run": CampaignRun.getCurrentRun().filename,
				"province": provinceCode,
				"attacker": attackerTribe,
				"playerIsAttacker": playerIsAttacker,
			}
		};
		let gameSettings = new GameSettings().init();
		gameSettings.fromInitAttributes(settings);
		// TODO: pass translated name, description, preview.
		gameSettings.mapName.set(`${this.tribes[attackerTribe].data.name} attack on ${province.name}`);

		// TODO: add function to do this.
		if (province.data?.mapTypes !== undefined)
		{
			const combinations = [];
			for (let type of province.data?.mapTypes)
				combinations.push(this.mapTypes.parse(type));
			const combination = pickRandom(combinations);
			if (combination?.maps)
			{
				// TODO: biomes should support random
				//gameSettings.map.setRandomOptions(combination.maps.map(x => "maps/" + x));
				gameSettings.map.selectMap(pickRandom(combination.maps.map(x => "maps/" + x)));
			}
			if (combination?.biomes)
			{
				gameSettings.biome.available = new Set(combination.biomes);
				gameSettings.biome.setBiome("random");
			}
		}

		gameSettings.playerCount.setNb(2);
		// TODO: make all this more generic.
		let aiID = 1 - playerID;
		gameSettings.playerAI.set(aiID, {
			"bot": "petra",
			"difficulty": playerIsAttacker ? province.garrison / 2 : 5 - province.garrison / 2,
			"behavior": "random",
		});
		gameSettings.playerCiv.setValue(0, this.tribes[attackerTribe].civ);
		if (province.ownerTribe)
			gameSettings.playerCiv.setValue(1, this.tribes[province.ownerTribe].civ);
		else
		{
			// TODO: support random options.
			gameSettings.playerCiv.setValue(1, pickRandom(province.getNativeCivs()));
		}

		let assignments = {
			"local": {
				"player": playerID + 1,
				"name": Engine.ConfigDB_GetValue("user", "playername.singleplayer") || Engine.GetSystemUsername()
			}
		};
		gameSettings.launchGame(assignments);
		Engine.SwitchGuiPage("page_loading.xml", {
			"attribs": gameSettings.toInitAttributes(),
			"playerAssignments": assignments
		});
	}

	changeGarrison(provinceCode, delta)
	{
		this.provinces[provinceCode].garrison = Math.max(0, Math.min(10,
			this.provinces[provinceCode].garrison + delta));
	}

	/**
	 * TODO: would be nice to make this asynchronous
	 */
	doFinishTurn()
	{
		// The turnI variable is used to:
		// - fake synchronicity (by doing less work each turn, it keeps the GUI responsive)
		// - fake work - it looks weird if turns end too quickly :P.
		if (!this.turnI)
		{
			// Start of the turn
			this.turnI = 25;
			this.turnEvents = [];
		}

		--this.turnI;

		if (this.turnI === 2)
		{
			// Grant 100 Money for each owned province.
			for (let tribeCode in this.tribes)
			{
				let tribe = this.tribes[tribeCode];
				let totalBalance = 0;
				for (let provinceCode of tribe.controlledProvinces)
					totalBalance += this.provinces[provinceCode].getBalance();
				// Clamp to avoid weirdness.
				tribe.money = Math.max(-999999, Math.min(tribe.money + totalBalance, 999999999));
				tribe.lastBalance = totalBalance;
				// TODO: nasty events if in debt, possibly losing the game.
			}
		}
		else if (this.turnI === 1)
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
						// too annoying when testing.
						continue;
						this.turnEvents.push(new GSAttack({
							"attacker": code,
							"target": target
						}));
					}
					else
					{
						// TODO: simulate fighting.
						province.setOwner(code);
						this.turnEvents.push(new GSConquest({
							"attacker": code,
							"target": target
						}));
					}
				}
			}
		}
		else if (this.turnI === 0)
		{
			// End of turn, control will be returned to the player.
			this.turn++;

			this.playerHero.actionsLeft = Math.min(2, this.playerHero.actionsLeft + 1);

			const evs = [];
			for (const ev of this.turnEvents)
			{
				const copy = new ev.constructor();
				copy.deserialize(ev.serialize());
				evs.push(copy);
			}
			this.pastTurnEvents.push(evs);

			this.save();
			return true;
		}
		return false;
	}

	processEndedGame(endGameData)
	{
		if ((endGameData.won && endGameData.initData.playerIsAttacker) ||
			(!endGameData.won && !endGameData.initData.playerIsAttacker))
			this.provinces[endGameData.initData.province].setOwner(endGameData.initData.attacker);
		// Otherwise no change necessary, the defenders won.
		return true;
	}
}
