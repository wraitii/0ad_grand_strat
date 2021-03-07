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

		Engine.GetGUIObjectByName("doAttack").enabled = province.ownerTribe !== g_GameData.playerTribe;
		Engine.GetGUIObjectByName("doAttack").hidden = province.ownerTribe === g_GameData.playerTribe;

		Engine.GetGUIObjectByName("doAttack").onPress = () => g_GameData.doAttack(province.code);
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

	render()
	{
		Engine.GetGUIObjectByName("finishTurn").enabled = !!g_GameData;

		Engine.GetGUIObjectByName("topPanelText").caption = `` +
		`Turn ${g_GameData.turn} Tribe "${g_GameData.playerTribe}"`;

		this.displayProvinceDetails();

		let i = 0;
		for (let code in g_GameData.provinces)
		{
			let province = g_GameData.provinces[code];
			if (!province.icon)
			{
				let icon = Engine.GetGUIObjectByName(`mapProvince[${i++}]`);
				icon.sprite = `color:250 250 250 20:stretched:campaigns/grand_strategy/provinces/${province.code}.png`;
				icon.size = province.gfxdata.size.map(x => x/2).join(" ");
				icon.hidden = false;
				icon.onPress = () => { this.selectedProvince = province.code; };
				province.icon = icon;
			}
		}
	}
}

var g_CampaignMenu;

function init(initData)
{
	let run;
	try {
		run = new CampaignRun(initData.filename).load();
	} catch (err) {
		error(sprintf(translate("Error loading campaign run %s: %s."), initData.filename, err));
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}
	g_CampaignMenu = new CampaignMenu(run);
	g_CampaignMenu.initialise();
}
