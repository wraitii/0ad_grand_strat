/**
 * Re-uses the code from the regular 0 A.D. campaign load/save with some overloads.
 */
class GSLoadSave extends LoadModal
{
	constructor(gameData)
	{
		super();
		this.gameData = gameData;

		Engine.GetGUIObjectByName("titleText").caption = "Load/Save campaign";
		Engine.GetGUIObjectByName("cancelButton").onPress = () => Engine.PopGuiPage();
		Engine.GetGUIObjectByName("runSelection").parent.size = "50%-400 50%-300 50%+400 50%+300";

		// TODO: backport to 0 A.D.
		this.hovered = -1;
		this.runSelection.onHoverChange = () => { this.hovered = this.runSelection.hovered; };
		this.runSelection.onMouseLeftPress = () => {
			if (this.hovered === -1 && this.runSelection.selected !== -1)
				this.runSelection.selected = -1;
			this.render();
		};

		Engine.GetGUIObjectByName('runDescription').onTextEdit = () => this.render();
	}

	getRuns()
	{
		const currentRun = CampaignRun.getCurrentRun();
		return super.getRuns().filter(run => run?.meta?.gs_identifier === currentRun.meta.gs_identifier);
	}

	displayCurrentRuns()
	{
		super.displayCurrentRuns();
		const currentRun = CampaignRun.getCurrentRun();
		this.runSelection.list = this.currentRuns.map(run => sprintf("%(desc)s - Turn %(turn)s", {
			"desc": (run.meta?.userDescription || currentRun.userDescription),
			"turn": run.data.gameData.turn
		}));
	}

	saveRun()
	{
		// Clone the current run.
		// TODO: need a better way to do this (or a better clone()).
		const run = new CampaignRun();
		Object.assign(run, clone(CampaignRun.getCurrentRun()));
		run.meta.userDescription = Engine.GetGUIObjectByName('runDescription').caption;
		run.filename = run.meta.gs_identifier + "_" + Date.now() + "_" + Math.floor(Math.random()*100000);
		run.data.gameData = this.gameData;
		run.save();
		this.currentRuns.push(run);
	}

	render()
	{
		super.render();
		if (!this.ogFunc)
			this.ogFunc = Engine.GetGUIObjectByName("startButton").onPress;
		if (this.selectedRun === -1)
		{
			Engine.GetGUIObjectByName("startButton").caption = "Save Campaign";
			Engine.GetGUIObjectByName("startButton").enabled = Engine.GetGUIObjectByName('runDescription').caption.length > 0;
			Engine.GetGUIObjectByName("startButton").onPress = () => this.saveRun();
		}
		else
		{
			Engine.GetGUIObjectByName("startButton").caption = "Load Campaign";
			Engine.GetGUIObjectByName("startButton").onPress = this.ogFunc;
		}
	}
}

function init(gameData)
{
	const menu = new GSLoadSave(gameData.gameData);
}
