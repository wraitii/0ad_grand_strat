/**
 */
class CampaignMenu
{
	constructor(campaignRun)
	{
		this.run = campaignRun;

		this.selectedProvince = -1;

		this.window = Engine.GetGUIObjectByName("campaignMenuWindow");
		this.window.onTick = () => this.onTick();
		Engine.GetGUIObjectByName("finishTurn").onPress = () => this.doFinishTurn();
		Engine.GetGUIObjectByName('backToMain').onPress = () => this.goBackToMainMenu();

		Engine.GetGUIObjectByName('loadSaveButton').onPress = () => this.openLoadSave(true);

		this.infoTicker = new InfoTicker();
		this.eventPanel = new EventPanel();

		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseLeftPress = () => this.onBlur();
		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseRightPress = () => this.onBlur();

		/*Engine.SetGlobalHotkey("grand_strategy.camera.left", "Down", () => { this.cameraX -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.right", "Down", () => { this.cameraX += 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.up", "Down", () => { this.cameraZ -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.down", "Down", () => { this.cameraZ += 5; });
		*/

		this.cameraX = 0;
		this.cameraZ = 0;

		this.lastRender = Date.now();
	}

	initialise()
	{
		if (this.run.data.gameData)
			GameData.loadRun();

		this.centerScrollOnHero();
		this.infoTicker.initialise();

		this.render();
	}

	goBackToMainMenu()
	{
		g_GameData.save();
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}

	openLoadSave()
	{
		Engine.PushGuiPage("campaigns/grand_strategy/loadsave/page.xml", {
			"gameData": g_GameData.Serialize(),
		});
	}

	doFinishTurn()
	{
		Engine.GetGUIObjectByName("computingTurn").hidden = false;
	}

	onTick()
	{
		// TODO: unhack this.
		if (!Engine.GetGUIObjectByName("computingTurn").hidden)
		{
			if (g_GameData.doFinishTurn())
				this.onTurnComputationEnd();
			return;
		}
		this.render();
	}

	onTurnComputationEnd()
	{
		Engine.GetGUIObjectByName("computingTurn").hidden = true;
		this.infoTicker.onTurnEnd();
	}

	centerScrollOnHero()
	{
		const pos = g_GameData.provinces[g_GameData.playerHero.location].getHeroPos();
		this.cameraX = pos[0] - this.window.getComputedSize().right/2;
		this.cameraZ = pos[1] - this.window.getComputedSize().bottom/2;
	}

	/**
	 * Triggered when pressing the map background.
	 */
	onBlur()
	{
		Engine.GetGUIObjectByName("contextPanel").hidden = true;
		this.selectedProvince = -1;
	}

	displayProvinceDetails()
	{
		if (this.selectedProvince === -1 || !Engine.GetGUIObjectByName("tribeDetails").hidden)
		{
			Engine.GetGUIObjectByName("provinceDetails").hidden = true;
			return;
		}
		const province = g_GameData.provinces[this.selectedProvince];
		const infoLevel = province.getInfoLevel(g_GameData.playerTribe);

		Engine.GetGUIObjectByName("provinceDetails").hidden = false;
		let str = `Name: ${province.name}\n` +
		`Owner: ${g_GameData.tribes?.[province.ownerTribe]?.getName() || "No-one"}\n`;
		if (infoLevel >= 1)
			str += `Garrison strength: ${province.garrison}\n`;
		if (infoLevel >= 2)
			str += `Balance: ${province.getBalance()}\n`;
		str += `\n\n` + coloredText("Right-click the province to make actions", "green");
		Engine.GetGUIObjectByName("provinceDetailsText").caption = str;
		if (province.ownerTribe)
		{
			Engine.GetGUIObjectByName("provinceOwnerButton").onPress = () => this.displayTribeDetails(province.ownerTribe);
			Engine.GetGUIObjectByName("provinceOwnerButton").sprite = "stretched:session/portraits/emblems/emblem_persians.png";
			Engine.GetGUIObjectByName("provinceOwnerButton").enabled = true;
		}
		else
		{
			Engine.GetGUIObjectByName("provinceOwnerButton").enabled = false;
			Engine.GetGUIObjectByName("provinceOwnerButton").sprite = "grayscale:stretched:session/portraits/emblems/emblem_persians.png";
		}
	}


	displayTribeDetails(tribeCode)
	{
		if (tribeCode === -1)
		{
			Engine.GetGUIObjectByName("tribeDetails").hidden = true;
			return;
		}
		Engine.GetGUIObjectByName("tribeDetails").hidden = false;

		const tribe = g_GameData.tribes[tribeCode];

		let diploStr = "";
		if (tribeCode !== g_GameData.playerTribe)
		{
			const diplo = tribe.getDiplomacy(g_GameData.playerTribe);
			diploStr = `Opinion: ${diplo.opinion}\nStatus: ${diplo.status}`;
		}

		Engine.GetGUIObjectByName("tribeDetailsText").caption = `` +
		`Name: ${tribe.data.name}\n` +
		`Money: ${tribe.money}\n` +
		`Diplo: ${diploStr}\n` +
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
		`Location: ${g_GameData.provinces[g_GameData.playerHero.location].name}\n` +
		`Owner: ${g_GameData.provinces[g_GameData.playerHero.location].ownerTribe || "No-one" }\n`;
		let province = g_GameData.provinces[g_GameData.playerHero.location];

		Engine.GetGUIObjectByName("doAttack").enabled = g_GameData.playerHero.canAttack(province.code);
		Engine.GetGUIObjectByName("doAttack").onPress = () => g_GameData.playerHero.doAttack(province.code);

		Engine.GetGUIObjectByName("strengthenGarrison").enabled = g_GameData.playerHero.canStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").enabled = g_GameData.playerHero.canWeaken(province.code);
		Engine.GetGUIObjectByName("strengthenGarrison").onPress = () => g_GameData.playerHero.doStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").onPress = () => g_GameData.playerHero.doWeaken(province.code);
	}

	displayContextualPanel(code)
	{
		if (code === -1)
		{
			Engine.GetGUIObjectByName("contextPanel").hidden = true;
			return;
		}
		this.selectedProvince = code;
		const pos = [this.mouseX+this.cameraX, this.mouseY+this.cameraZ];
		Engine.GetGUIObjectByName("contextPanel").size = this.toGUISize(...pos, pos[0] + 250, pos[1] + 200);
		Engine.GetGUIObjectByName("contextPanel").hidden = false;

		// Move there button.
		Engine.GetGUIObjectByName("contextPanelButton[0]").hidden = false;
		Engine.GetGUIObjectByName("contextPanelButton[0]").enabled = g_GameData.playerHero.canMove(code) &&
			code !== g_GameData.playerHero.location;
		Engine.GetGUIObjectByName("contextPanelButton[0]").onPress = () => {
			g_GameData.playerHero.doMove(code);
			this.displayContextualPanel(-1);
		};
		Engine.GetGUIObjectByName("contextPanelButton[0]").caption = "Move there";
		if (!g_GameData.provinces[code].ownerTribe || g_GameData.provinces[code].ownerTribe === g_GameData.playerTribe)
		{
			for (let i = 1; i < 5; ++i)
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).hidden = true;
		}
		else
		{
			const actions = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(g_GameData.provinces[code].ownerTribe).getActions();
			let i = 1;
			for (const key in actions)
			{
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).enabled = actions[key];
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).hidden = false;
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).onPress = () => {
					this.displayContextualPanel(-1);
					const ev = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(g_GameData.provinces[code].ownerTribe)[key]();
					g_GameData.pushTurnEvent(ev);
				};
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).caption = key;
				++i;
			}
		}
		for (let i = 0; i < 5; ++i)
			Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).size = `0 ${i*28} 100% ${(i+1)*28}`;
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

		const los = g_GameData.provinces[hero.location].getLinks();

		// Update provinces
		let i = 0;
		for (let code in g_GameData.provinces)
		{
			let province = g_GameData.provinces[code];
			if (!province.icon)
			{
				let icon = Engine.GetGUIObjectByName(`mapProvinceSprite[${i++}]`);
				icon.hidden = false;
				icon.parent.hidden = false;
				icon.onPress = () => { this.displayTribeDetails(-1); this.selectedProvince = province.code; };
				icon.onMouseRightPress = () => { this.displayContextualPanel(province.code); };
				province.icon = icon;
				province.icon.mouse_event_mask = "texture:campaigns/grand_strategy/provinces/" + province.code + ".png";
			}
			province.icon.size = this.toGUISize(...province.gfxdata.size);
			const cityIcon = Engine.GetGUIObjectByName(province.icon.name.replace("Sprite", "City"));
			if (province.ownerTribe)
			{
				const hpos = province.getHeroPos();
				cityIcon.size = this.toGUISize(...this.centeredSizeAt([12, 12], hpos));
				cityIcon.hidden = false;
			}
			else
				cityIcon.hidden = true;

			const inLos = province.ownerTribe === hero.tribe || code == hero.location || los.indexOf(code) !== -1;
			let color = province.getColor();
			color.push(province.ownerTribe ? 70 : 30);
			if (!inLos)
			{
				color[0] = Math.round(color[0] * 0.33);
				color[1] = Math.round(color[1] * 0.33);
				color[2] = Math.round(color[2] * 0.33);
				color[3] = 150;
			}
			if (province.code === this.selectedProvince)
				color[3] = 100;
			color = color.join(" ");
			province.icon.sprite = `color:${color}:stretched:textureAsMask:campaigns/grand_strategy/provinces/${province.code}.png`;
		}

		// Render event
		const didRenderEvent = this.eventPanel.renderEvents(g_GameData.turnEvents);

		Engine.GetGUIObjectByName("finishTurn").enabled = !didRenderEvent && g_GameData?.canAdvanceTurn();

		const delta = Date.now() - this.lastRender;
		const SCROLL_SPEED = delta * 0.6;
		if (this.mouseX < 10)
			this.cameraX -= SCROLL_SPEED;
		else if (this.mouseX >= this.window.getComputedSize().right - 10)
			this.cameraX += SCROLL_SPEED;
		if (this.mouseY < 10)
			this.cameraZ -= SCROLL_SPEED;
		else if (this.mouseY >= this.window.getComputedSize().bottom - 10)
			this.cameraZ += SCROLL_SPEED;

		this.lastRender = Date.now();
	}

	handleInputAfterGui(ev)
	{
		if (ev.type !== "mousemotion")
			return false;
		this.mouseX = ev.x;
		this.mouseY = ev.y;
		return true;
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
		return `${Math.round(x0 - this.cameraX)} ${Math.round(z0 - this.cameraZ)} ${Math.round(x1 - this.cameraX)} ${Math.round(z1 - this.cameraZ)}`;
	}
}

function handleInputAfterGui(ev, hoveredObject)
{
	return g_CampaignMenu.handleInputAfterGui(ev, hoveredObject);
}
