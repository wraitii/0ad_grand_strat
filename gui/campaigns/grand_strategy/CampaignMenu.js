/**
 */
class CampaignMenu
{
	constructor(campaignRun)
	{
		this.run = campaignRun;

		this.selectedProvince = -1;

		Engine.GetGUIObjectByName("campaignMenuWindow").onTick = () => this.onTick();
		Engine.GetGUIObjectByName("finishTurn").onPress = () => this.doFinishTurn();
		Engine.GetGUIObjectByName('backToMain').onPress = () => this.goBackToMainMenu();

		/*Engine.SetGlobalHotkey("grand_strategy.camera.left", "Down", () => { this.cameraX -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.right", "Down", () => { this.cameraX += 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.up", "Down", () => { this.cameraZ -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.down", "Down", () => { this.cameraZ += 5; });
		*/

		this.cameraX = 0;
		this.cameraZ = 0;
	}

	initialise()
	{
		if (this.run.data.gameData)
			GameData.loadRun();

		if (!g_GameData)
			GameData.createNewGame();

		const pos = g_GameData.provinces[g_GameData.playerHero.location].getHeroPos();
		this.cameraX = pos[0] - 400;
		this.cameraZ = pos[1] - 400;

		this.render();
	}

	goBackToMainMenu()
	{
		this.run.save();
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}

	doFinishTurn()
	{
		Engine.GetGUIObjectByName("computingTurn").hidden = false;
	}

	onTick()
	{
		if (!Engine.GetGUIObjectByName("computingTurn").hidden)
		{
			if (g_GameData.doFinishTurn())
			{
				Engine.GetGUIObjectByName("computingTurn").hidden = true;
				const pos = g_GameData.provinces[g_GameData.playerHero.location].getHeroPos();
				this.cameraX = pos[0] - 400;
				this.cameraZ = pos[1] - 400;
			}
			return;
		}
		this.render();
	}

	displayProvinceDetails()
	{
		if (this.selectedProvince === -1 || !Engine.GetGUIObjectByName("tribeDetails").hidden)
		{
			Engine.GetGUIObjectByName("provinceDetails").hidden = true;
			return;
		}
		Engine.GetGUIObjectByName("provinceDetails").hidden = false;
		let province = g_GameData.provinces[this.selectedProvince];
		Engine.GetGUIObjectByName("provinceDetailsText").caption = `` +
		`Name: ${province.code}\n` +
		`Owner: ${province.ownerTribe || "No-one"}\n` +
		`Garrison strength: ${province.garrison}\n` +
		`Balance: ${province.getBalance()}\n` +
		``;

		Engine.GetGUIObjectByName("doMove").enabled = g_GameData.playerHero.canMove(province.code) &&
			province.code !== g_GameData.playerHero.location;
		Engine.GetGUIObjectByName("doMove").onPress = () => g_GameData.playerHero.doMove(province.code);

		Engine.GetGUIObjectByName("provinceOwnerButton").onPress = () => this.displayTribeDetails(province.ownerTribe);
	}


	displayTribeDetails(tribeCode)
	{
		if (tribeCode === -1)
		{
			Engine.GetGUIObjectByName("tribeDetails").hidden = true;
			return;
		}
		Engine.GetGUIObjectByName("tribeDetails").hidden = false;

		let tribe = g_GameData.tribes[tribeCode];
		Engine.GetGUIObjectByName("tribeDetailsText").caption = `` +
		`Name: ${tribe.data.name}\n` +
		`Money: ${tribe.money}\n` +
		``;

		Engine.GetGUIObjectByName("goToProvinceButton").onPress = () => {
			this.displayTribeDetails(-1);
			this.displayProvinceDetails();
		};
	}

	displayHeroDetails()
	{
		Engine.GetGUIObjectByName("heroDetailsText").caption = `` +
		`Moves left: ${g_GameData.playerHero.actionsLeft}\n` +
		`Location: ${g_GameData.playerHero.location}\n` +
		`Owner: ${g_GameData.provinces[g_GameData.playerHero.location].ownerTribe || "No-one" }\n`;
		let province = g_GameData.provinces[g_GameData.playerHero.location];

		Engine.GetGUIObjectByName("doAttack").enabled = g_GameData.playerHero.canAttack(province.code);
		Engine.GetGUIObjectByName("doAttack").onPress = () => g_GameData.playerHero.doAttack(province.code);

		Engine.GetGUIObjectByName("strengthenGarrison").enabled = g_GameData.playerHero.canStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").enabled = g_GameData.playerHero.canWeaken(province.code);
		Engine.GetGUIObjectByName("strengthenGarrison").onPress = () => g_GameData.playerHero.doStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").onPress = () => g_GameData.playerHero.doWeaken(province.code);
	}

	render()
	{
		Engine.GetGUIObjectByName("topPanelText").caption = `` +
		`Turn ${g_GameData.turn}` +
		` Tribe "${g_GameData.playerTribe}"` +
		` Money ${g_GameData.tribes[g_GameData.playerTribe].money}` +
		` Balance ${g_GameData.tribes[g_GameData.playerTribe].lastBalance}` +
		``;

		this.displayHeroDetails();
		this.displayProvinceDetails();

		// Update heros
		const hero = g_GameData.playerHero;
		const heroIcon = Engine.GetGUIObjectByName("heroButton");
		const pos = g_GameData.provinces[hero.location].getHeroPos();
		heroIcon.size = this.toGUISize(...this.centeredSizeAt([16, 16], pos));

		// Update provinces
		let i = 0;
		for (let code in g_GameData.provinces)
		{
			let province = g_GameData.provinces[code];
			if (!province.icon)
			{
				let icon = Engine.GetGUIObjectByName(`mapProvince[${i++}]`);
				icon.hidden = false;
				icon.onPress = () => { this.displayTribeDetails(-1); this.selectedProvince = province.code; };
				province.icon = icon;
				province.icon.mouse_event_mask = "texture:campaigns/grand_strategy/provinces/" + province.code + ".png";
			}
			province.icon.size = this.toGUISize(...province.gfxdata.size);
			if (province.code !== this.selectedProvince)
				province.icon.sprite = `color:${province.getColor()} 20:stretched:textureAsMask:campaigns/grand_strategy/provinces/${province.code}.png`;
			else
				province.icon.sprite = `color:${province.getColor()} 50:stretched:textureAsMask:campaigns/grand_strategy/provinces/${province.code}.png`;
		}

		// Render event
		let event = g_GameData.turnEvents && g_GameData.turnEvents[0];
		if (event)
		{
			Engine.GetGUIObjectByName("eventPanel").hidden = false;
			Engine.GetGUIObjectByName("eventPanelDesc").caption = event.type;
			Engine.GetGUIObjectByName("eventPanelButton[0]").onPress = () => {
				g_GameData.turnEvents.shift();
				if (event.type === "attack")
					g_GameData.playOutAttack(event.data.attacker, event.data.target);
			};
		}
		else
			Engine.GetGUIObjectByName("eventPanel").hidden = true;

		Engine.GetGUIObjectByName("finishTurn").enabled = !!g_GameData && !g_GameData.turnEvents.length;
	}

	centeredSizeAt(size, pos)
	{
		return [
			pos[0] - size[0],
			pos[1] - size[1],
			pos[0] + size[0],
			pos[1] + size[1]
		];
	}

	toGUISize(x0, z0, x1, z1)
	{
		return `${x0 - this.cameraX} ${z0 - this.cameraZ} ${x1 - this.cameraX} ${z1 - this.cameraZ}`;
	}
}

var g_CampaignMenu;

function init(initData)
{
	let run = initData?.filename || CampaignRun.getCurrentRunFilename();
	try {
		run = new CampaignRun(run).load();
		run.setCurrent();
		g_CampaignMenu = new CampaignMenu(run);
		g_CampaignMenu.initialise();
	} catch (err) {
		error(sprintf(translate("Error loading campaign run %s: %s."), CampaignRun.getCurrentRunFilename(), err));
		error(err.stack.toString());
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}
}
