/**
 * Diplomatic status change.
 */
class GSPeaceProposal extends GSDiplomacyEvent
{
	constructor(data)
	{
		super("peaceProposal", data);
	}

	setupPanel(descObj, buttons)
	{
		const str = "The poor sobs of %(from)s have proposed that we make peace.\nThey must be tired of losing all the time!";
		return super.setupPanel(descObj, buttons, sprintf(str, {
			"from": g_GameData.tribes[this.data.from].getName(),
		}), x => x.id === "ok" ? "Our brothers shall come home" : "Never!"
		);
	}

	getTickerText()
	{
		return undefined;
	}
}
