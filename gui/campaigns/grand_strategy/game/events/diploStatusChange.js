/**
 * Diplomatic status change.
 */
class GSDiploStatusChange extends GSDiplomacyEvent
{
	constructor(data)
	{
		super("diploStatusChange", data);
		super._check("old", "new");
	}

	setupPanel(descObj, buttons)
	{
		let str;
		if (this.data.old == GSDiplomacy.prototype.PEACE && this.data.new === GSDiplomacy.prototype.HOSTILE)
			str = "Our spies report that %(from)s is preparing for war, my Lord.";
		else if (this.data.new === GSDiplomacy.prototype.WAR)
			str = "The horrible barbarians of %(from)s have declared WAR on us!\nMay their gods save their souls, for it won't save their warriors.";
		return super.setupPanel(descObj, buttons, sprintf(str, {
			"from": g_GameData.tribes[this.data.from].getName(),
		}), x => ({
			"ok": "We must tread carefully",
			"no_response": "Let us not antagonize them",
			"declare_war_back": "They want war? They'll get war!",
		}[x.id]));
	}

	getTickerText()
	{
		if (this.data.new !== GSDiplomacy.prototype.WAR && this.data.from !== g_GameData.playerTribe && this.data.target !== g_GameData.playerTribe)
			return undefined;
		return {
			[GSDiplomacy.prototype.WAR]: this.sprintfTribes("%(from)s has declared war on %(target)s"),
			[GSDiplomacy.prototype.HOSTILE]: this.sprintfTribes("%(from)s is preparing for war against %(target)s"),
		}[this.data.new];
	}
}
