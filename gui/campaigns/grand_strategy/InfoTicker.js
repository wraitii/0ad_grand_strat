class InfoTicker
{
	constructor()
	{
		this.panel = Engine.GetGUIObjectByName("infoTicker");
		this.panelData = Engine.GetGUIObjectByName("infoTickerData");

		this.messages = [];
	}

	initialise()
	{
		this.messages = [];
		this.panelData.list = [];
		this.panelData.list_data = [];
		for (const i in g_GameData.pastTurnEvents)
			this.processTurnEvents(g_GameData.pastTurnEvents[i], +i+1);
	}

	onTurnEnd()
	{
		this.processTurnEvents(g_GameData.turnEvents, g_GameData.turn);
	}

	processTurnEvents(events, turn)
	{
		for (const event of events)
		{
			const text = event.getTickerText();
			if (!text)
				continue;
			this.messages.push({
				"turn": turn,
				"text": text
			});
			this.panelData.addItem(sprintf("• Turn %s: ", turn) + text);
		}
	}
}
