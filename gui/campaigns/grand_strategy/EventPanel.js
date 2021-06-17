class EventPanel
{
	constructor()
	{
		this.panel = Engine.GetGUIObjectByName("eventPanel");
		this.desc = Engine.GetGUIObjectByName("eventPanelDesc");
		this.buttons = [
			Engine.GetGUIObjectByName("eventPanelButton[0]"),
			Engine.GetGUIObjectByName("eventPanelButton[1]")
		];
	}

	/**
	 * @return whether an event was rendered.
	 */
	renderEvents(turnEvents)
	{
		for (const ev of turnEvents)
		{
			if (ev.processed)
				continue;
			if (!ev.needUserInput())
				continue;
			return this.render(ev);
		}
		return this.render();
	}

	render(event)
	{
		if (!event)
		{
			this.panel.hidden = true;
			return false;
		}
		this.panel.hidden = false;
		const buttonData = event.setupPanel(this.desc, this.buttons);
		if (!buttonData)
		{
			// Sane default.
			this.desc.caption = event.getTickerText() ?? "";
			this.buttons[0].hidden = false;
			this.buttons[0].caption = "OK";
			this.buttons[0].size = "100%-300 0 100% 100%";
			this.buttons[0].onPress = () => {
				g_GameData.markEventProcessed(event.id);
			};
			this.buttons[1].hidden = true;
			return true;
		}
		const nb = buttonData.length;
		for (let i = nb; i < this.buttons.length; ++i)
			this.buttons[i].hidden = true;
		for (const bd in buttonData)
		{
			this.buttons[bd].caption = buttonData[bd].caption;
			this.buttons[bd].tooltip = buttonData[bd].tooltip || "";
			this.buttons[bd].onPress = () => {
				g_GameData.markEventProcessed(event.id);
				buttonData[bd].action();
			};
			this.buttons[bd].size = `${Math.round(+bd * (100.0/nb))}%+4 0 ${Math.round((+bd + 1) * (100.0/nb))}%-4 100%`;
			this.buttons[bd].hidden = false;
			this.buttons[bd].enabled = true;
		}
		return true;
	}
}
