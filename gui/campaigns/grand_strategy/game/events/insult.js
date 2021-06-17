/**
 * Insult events lower relationships between two tribes.
 */
class GSInsult extends GSDiplomacyEvent
{
	constructor(data)
	{
		super("insult", data);
	}

	setupPanel(descObj, buttons)
	{
		const responses = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(this.data.from).getResponses(this);

		let str = "“Pigs”";
		str += "\nThis is all the letter we've received from %(from)s contained.\nIt seems rather obvious they don't intend to maintain a good relationship.";
		return super.setupPanel(descObj, buttons, sprintf(str, {
			"from": g_GameData.tribes[this.data.from].getName(),
		}), () => "This won't go unpunished!");
	}

	getTickerText()
	{
		return sprintf("%(from)s insulted %(target)s", {
			"from": g_GameData.tribes[this.data.from].getName(),
			"target": g_GameData.tribes[this.data.target].getName(),
		});
	}
}
