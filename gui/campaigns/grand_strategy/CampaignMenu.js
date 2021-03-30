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
	}

	initialise()
	{
		if (this.run.data.gameData)
			GameData.loadRun();

		if (!g_GameData)
			GameData.createNewGame();

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
				Engine.GetGUIObjectByName("computingTurn").hidden = true;
			return;
		}
		this.render();
	}

	displayProvinceDetails()
	{
		if (this.selectedProvince === -1)
		{
			Engine.GetGUIObjectByName("provinceDetails").hidden = true;
			return;
		}
		Engine.GetGUIObjectByName("provinceDetails").hidden = false;
		let province = g_GameData.provinces[this.selectedProvince];
		Engine.GetGUIObjectByName("provinceDetailsText").caption = JSON.stringify(province.Serialize());

		Engine.GetGUIObjectByName("doMove").enabled = g_GameData.playerHero.canMove(province.code) &&
			province.code !== g_GameData.playerHero.location;
		Engine.GetGUIObjectByName("doMove").onPress = () => g_GameData.playerHero.doMove(province.code);
	}

	displayHeroDetails()
	{
		Engine.GetGUIObjectByName("heroDetailsText").caption = `` +
		`Moves left: ${g_GameData.playerHero.actionsLeft}\n` +
		`Location: ${g_GameData.playerHero.location}`;
		let province = g_GameData.provinces[g_GameData.playerHero.location];

		Engine.GetGUIObjectByName("doAttack").enabled = g_GameData.playerHero.canAttack(province.code) &&
			province.ownerTribe !== g_GameData.playerTribe;
		Engine.GetGUIObjectByName("doAttack").onPress = () => g_GameData.playerHero.doAttack(province.code);
	}

	render()
	{
		Engine.GetGUIObjectByName("topPanelText").caption = `` +
		`Turn ${g_GameData.turn} Tribe "${g_GameData.playerTribe}" Money ${g_GameData.tribes[g_GameData.playerTribe].money}`;

		this.displayHeroDetails();
		this.displayProvinceDetails();

		// Update heros
		let hero = g_GameData.playerHero;
		let heroIcon = Engine.GetGUIObjectByName("heroButton");
		heroIcon.size = this.toSize(...this.centeredSizeAt([100, 100], g_GameData.provinces[hero.location].getHeroPos()));

		// Update provinces
		let i = 0;
		for (let code in g_GameData.provinces)
		{
			let province = g_GameData.provinces[code];
			if (!province.icon)
			{
				let icon = Engine.GetGUIObjectByName(`mapProvince[${i++}]`);
				icon.size = this.toSize(...province.gfxdata.size);
				icon.hidden = false;
				icon.onPress = () => { this.selectedProvince = province.code; };
				province.icon = icon;
			}
			if (province.code !== this.selectedProvince)
				province.icon.sprite = `color:${province.getColor()} 20:stretched:campaigns/grand_strategy/provinces/${province.code}.png`;
			else
				province.icon.sprite = `color:${province.getColor()} 50:stretched:campaigns/grand_strategy/provinces/${province.code}.png`;
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
		return [pos[0]-size[0]/2, pos[1]-size[1]/2, pos[0]+size[0]/2, pos[1]+size[1]/2];
	}

	toSize(x0, z0, x1, z1)
	{
		return `${x0/2} ${z0/2} ${x1/2} ${z1/2}`;
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
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}
}
