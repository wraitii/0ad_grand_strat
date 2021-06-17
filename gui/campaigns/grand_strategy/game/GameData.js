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

		this.difficulty = "medium";

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
			"difficulty": this.difficulty,
			"tribes": tribes,
			"provinces": pv,
			"events": pastEvents,
			"lastEventID": GSEvent.GetStartEventID(),
		};
	}

	Deserialize(data)
	{
		this.parseHistory();

		this.turn = data.turn;

		for (const prov in data.provinces)
			this.provinces[prov].Deserialize(data.provinces[prov]);

		for (const code in data.tribes)
		{
			if (data.tribes[code].customTribeData)
				this.tribes[code] = new Tribe(data.tribes[code].customTribeData, true);
			this.tribes[code].Deserialize(data.tribes[code]);
		}

		this.playerTribe = data.playerTribe;
		this.playerHero = new Hero();
		this.playerHero.Deserialize(data.playerHero);

		if (data.difficulty)
			this.difficulty = data.difficulty;

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
		if (this.pastTurnEvents.length)
			this.turnEvents = this.pastTurnEvents[this.pastTurnEvents.length - 1];
		// Reset after as we incremented un-necessarily for a while.
		GSEvent.SetStartEventID(data.lastEventID);
	}

	static createNewGame(playerData, difficulty)
	{
		g_GameData = new GameData();
		g_GameData.initialiseGame(playerData, difficulty);
		return g_GameData;
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

	save(run = CampaignRun.getCurrentRun())
	{
		run.data.gameData = this.Serialize();
		run.save();
	}

	initialiseGame(playerData, difficulty)
	{
		this.parseHistory();

		// Create human player
		this.tribes.player = new Tribe({
			"code": "player",
			"civ": playerData.civ,
			"name": playerData.tribeName,
		}, true);
		this.provinces[playerData.startProvince].setOwner("player");
		this.playerTribe = "player";
		// TODO: hero name
		this.playerHero = new Hero("player", playerData.startProvince);

		// Assign tribe initial provinces
		for (const code in this.tribes)
		{
			const tribe = this.tribes[code];
			if (!tribe.data.startProvinces)
				continue;
			for (const prov of tribe.data.startProvinces)
				if (prov !== playerData.startProvince)
					this.provinces[prov].setOwner(code);
		}

		this.difficulty = difficulty;

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
			"difficulty": this.getAIDifficulty(province.garrison, playerIsAttacker),
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

	getAIDifficulty(garrison, playerIsAttacker)
	{
		const max = this.difficulty === "easy" ? 2 : this.difficulty == "medium" ? 4 : 5;
		const min = this.difficulty === "easy" ? 0 : this.difficulty == "medium" ? 2 : 3;
		return Math.max(min, Math.min(max, playerIsAttacker ? min + garrison : max - garrison));
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

		if (this.turnI === 24)
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
		else if (this.turnI === 5)
		{
			// Tribe '''AI''' - regular stuff & diplomacy.
			for (const code in this.tribes)
			{
				if (code === this.playerTribe)
					continue;
				const tribe = this.tribes[code];
				const neighbors = new Set();
				for (const prov of tribe.controlledProvinces)
				{
					const pv = this.provinces[prov];
					// TODO: do this elsewhere
					if (pv.garrison < 2)
						pv.garrison++;
					for (const pot of pv.getLinks())
						if ((this.provinces[pot].ownerTribe || code) !== code)
							neighbors.add(this.provinces[pot].ownerTribe);
				}
				for (const neighb of neighbors)
				{
					const diplo = tribe.getDiplomacy(neighb);
					let ev;
					if (diplo.status === diplo.PEACE)
					{
						// Go hostile then to war
						if (diplo.opinion < -30 && randBool(0.33))
							ev = diplo.goHostile();
						// Randomly decide we don't like some people.
						// (NB: this will end up being _all_ people after a while)
						else if (diplo.opinion > -30 && randBool(0.2))
							ev = diplo.insult();
					}
					// Every turn 50% chance of hostility breaking out into war.
					else if (diplo.status === diplo.HOSTILE && randBool(0.5))
						ev = diplo.declareWar();
					// else 10% chance of going at war
					else if (diplo.status === diplo.WAR && randBool(0.1))
						ev = diplo.proposePeace();
					if (ev)
						this.turnEvents.push(ev);
				}
			}
		}
		else if (this.turnI === 4)
		{
			// Tribe '''AI''' - Response to diplomacy events.
			for (const ev of this.turnEvents)
				if (ev.data.target && ev.data.from)
					pickRandom(this.tribes[ev.data.target]?.getDiplomacy(ev.data.from).getResponses(ev))?.action?.();
		}
		else if (this.turnI === 1)
		{
			// Tribe '''AI''' - Invasions.
			for (const code in this.tribes)
			{
				if (code === this.playerTribe)
					continue;
				const tribe = this.tribes[code];
				const targets = new Set();
				for (const prov of tribe.controlledProvinces)
				{
					const pv = this.provinces[prov];
					for (const pot of pv.getLinks())
						if (this.provinces[pot].ownerTribe !== code)
							if (tribe.canAttack(this.provinces[pot].ownerTribe))
								targets.add(pot);
				}
				if (randBool(0.5) && targets.size)
				{
					const target = pickRandom(Array.from(targets));
					const province = this.provinces[target];
					if (province.ownerTribe === this.playerTribe)
					{
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

			this.pastTurnEvents.push(this.turnEvents);

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

	markEventProcessed(id)
	{
		for (const ev of this.turnEvents)
		{
			if (ev.id !== id)
				continue;
			ev.processed = true;
			return;
		}
	}

	/**
	 * Call this when creating an event for the current turn.
	 * (this effectively makes it so the player plays last).
	 */
	pushTurnEvent(event)
	{
		this.turnEvents.push(event);
		if (event.data.target !== this.playerTribe)
			pickRandom(g_GameData.tribes[event.data.target]?.getDiplomacy(event.data.from).getResponses(event))?.action?.();
		// TODO: unhack this
		g_CampaignMenu.infoTicker.initialise();
	}

	canAdvanceTurn()
	{
		for (const ev of this.turnEvents)
		{
			if (ev.needUserInput() && !ev.processed)
				return false;
		}
		return true;
	}
}
