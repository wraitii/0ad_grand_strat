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
			if (!event.ticker)
				continue;
			this.messages.push({
				"turn": turn,
				"text": sprintf(event.ticker.text, event.data)
			});
			this.panelData.addItem(sprintf("• Turn %s: ", turn) + this.messages[this.messages.length - 1].text);
		}
	}
}
