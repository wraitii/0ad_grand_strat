/**
 * 'attack' is a special event that requires user interaction,
 * and happens when the player gets attacked by external forces.
 */
class GSAttack extends GSEvent
{
	constructor(data)
	{
		super("attack");
		this.data = data;
	}

	needUserInput()
	{
		return true;
	}

	setupPanel(descObj, buttons)
	{
		let str = "My Lord! The enemy is at our gates!";
		str += "\n%(attacker)s is attacking our lovely province of %(prov)s. What should we do?";
		descObj.caption = sprintf(str, {
			"attacker": g_GameData.tribes[this.data.attacker].getName(),
			"prov": g_GameData.provinces[this.data.target].getName(),
		});
		return [
			{
				"caption": "Auto-resolve",
				"tooltip": "(NB: this is at the moment a guaranteed win)",
				"action": () => {},
			},
			{
				"caption": "Take Control",
				"tooltip": "This will start a Skirmish where you must win to defend your land.",
				"action": () => g_GameData.playOutAttack(this.data.attacker, this.data.target),
			}
		];
	}

	getTickerText()
	{
		return sprintf("%(attacker)s attacked our province of %(prov)s", {
			"attacker": g_GameData.tribes[this.data.attacker].getName(),
			"prov": g_GameData.provinces[this.data.target].getName(),
		});
	}
}
