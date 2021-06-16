class InitPage
{
	constructor()
	{
		Engine.GetGUIObjectByName("abortButton").caption="Back to Main Menu";
		Engine.GetGUIObjectByName("abortButton").onPress = () => Engine.SwitchGuiPage("page_pregame.xml", {});

		Engine.GetGUIObjectByName("campaignTitle").caption = "Grand Strategy";
		let desc = "Destined for glory? Ever since you were young, you've had the spirit of a warrior. A strong soul, and the right combination of will, luck and destiny to wield it effectively. Now your people look to you to guide them into the future, whatever may come.";
		desc += "\nWelcome to 0 A.D.'s Grand Strategy campaign, where you will take control of a country through the eyes of a Hero character. Fortify your lands, conquer your neighbors, and lead your civilization to victory."
		Engine.GetGUIObjectByName("campaignDescription").caption = desc;

		Engine.GetGUIObjectByName("campaignImage").sprite = "color:0 0 0";

		Engine.GetGUIObjectByName("playerSettings").caption = "Customize your civilization";

		Engine.GetGUIObjectByName("civSelectLabel").caption = "Civilization:";
		this.civSelect = Engine.GetGUIObjectByName("civSelect");
		Engine.GetGUIObjectByName("heroNameLabel").caption = "Hero Name:";
		this.heroName = Engine.GetGUIObjectByName("heroName");
		Engine.GetGUIObjectByName("provinceSelectLabel").caption = "Starting Province:";
		this.provinceSelect = Engine.GetGUIObjectByName("provinceSelect");
		Engine.GetGUIObjectByName("tribeNameLabel").caption = "Tribe Name:";
		this.tribeName = Engine.GetGUIObjectByName("tribeName");

		Engine.GetGUIObjectByName("gameSettings").caption = "Game Settings";
		Engine.GetGUIObjectByName("difficultySelectLabel").caption = "Difficulty:";
		this.difficultySelect = Engine.GetGUIObjectByName("difficultySelect");

		this.startButton = Engine.GetGUIObjectByName("startButton");
		this.startButton.caption = "Start Campaign";
		this.startButton.onPress = () => this.onStartRequest();

		this.civSelect.onSelectionChange = () => this.onCivPick();

		this.civSelect.list = ["Athens", "Sparta"];
		this.civSelect.list_data = ["athen", "spart"];

		this.provinceSelect.list = ["Peloponnese", "Crete", "Latium"];
		this.provinceSelect.list_data = ["peloponnese", "crete", "latium"];

		this.difficultySelect.list = ["Easy", "Medium", "Hard"];
		this.difficultySelect.list_data = ["easy", "medium", "hard"];
		this.difficultySelect.selected = 0;

		const page = Engine.GetGUIObjectByName("initPageWindow");
		const pageSize = page.getComputedSize();
		this.usePagination = (pageSize.bottom - pageSize.top) < 900;
		if (this.usePagination)
		{
			const size = Engine.GetGUIObjectByName("initSubPanel").size;
			size.rtop = 50;
			size.top = -250;
			size.rbottom = 50;
			size.bottom = 250;
			Engine.GetGUIObjectByName("initSubPanel").size = size;
			Engine.GetGUIObjectByName("page2").hidden = true;
			const p1size = Engine.GetGUIObjectByName("page1").size;
			p1size.bottom += 30;
			Engine.GetGUIObjectByName("page1").size = p1size;
			Engine.GetGUIObjectByName("page1Button").hidden = false;
			Engine.GetGUIObjectByName("page1Button").caption = "Start";
			Engine.GetGUIObjectByName("page1Button").onPress = () => {
				Engine.GetGUIObjectByName("page1").hidden = true;
				Engine.GetGUIObjectByName("page2").hidden = false;
				const p2size = Engine.GetGUIObjectByName("page2").size;
				p2size.top = 0;
				Engine.GetGUIObjectByName("page2").size = p2size;
			};
		}
		// Done at the bottom: in case of errors earlier things won't bug out every frame.
		page.onTick = () => this.render();
	}

	onCivPick()
	{
		if (this.provinceSelect.selected === -1)
			this.provinceSelect.selected = 0;
		if (!this.heroName.caption)
			this.heroName.caption = "Vercingetorix";
		if (!this.tribeName.caption)
			this.tribeName.caption = "Romans";
	}

	render()
	{
		this.updateCanStart();
	}

	updateCanStart()
	{
		const feedback = Engine.GetGUIObjectByName("feedbackText");
		const ok = (() => {
			if (this.civSelect.selected === -1)
			{
				feedback.caption = "Select a civilization to play.";
				return false;
			}
			if (this.provinceSelect.selected === -1)
			{
				feedback.caption = "Select a province to start from.";
				return false;
			}
			if (this.heroName.caption === "")
			{
				feedback.caption = "Choose a name for your Hero.";
				return false;
			}
			if (this.tribeName.caption === "")
			{
				feedback.caption = "Choose a name for your Tribe.";
				return false;
			}
			return true;
		})();
		if (ok)
			feedback.caption = "";
		this.startButton.enabled = ok;
	}

	onStartRequest()
	{
		Engine.PushGuiPage(
			"page_msgbox.xml",
			{
				"width": 450,
				"height": 200,
				"title": "Start Campaign?",
				"message": sprintf("You have chosen to start a campaign as the %(tribe)s of the %(civ)s.\nConfirm?",
					{
						"tribe": this.tribeName.caption,
						"civ": this.civSelect.list[this.civSelect.selected],
					}),
				"buttonCaptions": ["No", "Yes"],
			},
			(button) => { if (button === 1) this.actuallyStart(); });
	}

	actuallyStart()
	{
		// Writes g_GameData
		GameData.createNewGame({
			"civ": this.civSelect.list_data[this.civSelect.selected],
			"tribeName": this.tribeName.caption,
			"startProvince": this.provinceSelect.list_data[this.provinceSelect.selected],
		});
		Engine.SwitchGuiPage("campaigns/grand_strategy/page.xml", {
			"filename": CampaignRun.getCurrentRunFilename()
		});
	}
}

function init()
{
	const page = new InitPage();
	page.render();
}