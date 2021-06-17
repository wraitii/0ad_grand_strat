class GSDiplomacyEvent extends GSEvent
{
	constructor(name, data)
	{
		super(name);
		this.data = data;
		super._check("from", "target");
	}

	needUserInput()
	{
		if (this.cachedNeedUserInput === undefined)
			this.cachedNeedUserInput = this.data.target === g_GameData.playerTribe &&
				g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(this.data.from).getResponses(this).length > 0;
		return this.cachedNeedUserInput;
	}

	setupPanel(descObj, buttons, desc, respFunc)
	{
		const responses = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(this.data.from).getResponses(this);
		let str = desc;
		if (responses.length === 1)
			str += "\n\n" + responses[0].tooltip;
		descObj.caption = str;
		return responses.map(x => {
			const f = respFunc(x);
			if (typeof f === "string")
				return {
					"caption": f,
					"tooltip": x.tooltip,
					"action": x.action,
				};
			return f;
		});
	}

	sprintfTribes(text)
	{
		return sprintf(text, {
			"from": g_GameData.tribes[this.data.from].getName(),
			"target": g_GameData.tribes[this.data.target].getName(),
		});
	}
}