/**
 * Keeps a history & a current state of diplomatic relations.
 * Note that diplomacy is not two-ways, though some diplomatic events might be.
 */
class GSDiplomacy
{
	constructor(from, target)
	{
		this.from = from;
		this.target = target;
		// IDs of events
		this.eventHistory = [];
		this.opinion = 0;
		this.status = this.PEACE;
	}

	serialize()
	{
		return {
			"op": this.opinion,
			"hist": this.eventHistory,
			"stat": this.status,
		};
	}

	deserialize(data)
	{
		this.eventHistory = data.hist;
		this.opinion = data.op;
		this.status = data.stat;
		return this;
	}

	makeResponse(ev, id, action, tooltip)
	{
		return {
			"id": id,
			"tooltip": coloredText(tooltip, "green"),
			"action": this._process(ev, action),
		};
	}

	/**
	 * This returns the possible response options to a diplomatic event.
	 * Both AI and players will have the same instant options.
	 */
	getResponses(ev)
	{
		// Ignore messages that aren't sent to us.
		if (ev.data.target !== this.from)
			return [];
		if (ev.type === "insult")
			return [
				this.makeResponse(ev, "ok", () => { this.opinion -= 50; }, "-50 opinion")
			];
		else if (ev.type === "diploStatusChange" && ev.data.old != this.WAR && ev.data.new === this.HOSTILE)
			return [{
				"id": "ok",
				"tooltip": coloredText("-50 opinion", "green"),
				"action": this._process(ev, () => { this.opinion -= 50; }),
			}];
		else if (ev.type === "diploStatusChange" && ev.data.new === this.WAR)
		{
			if (this.status === this.WAR)
				return [this.makeResponse(ev, "ok", () => {})];
			return [{
				"id": "no_response",
				"tooltip": coloredText("We become hostile against them.", "green"),
				"action": this._process(ev, () => { this.opinion = -100; this.status = this.HOSTILE; }),
			},
			this.makeResponse(ev, "declare_war_back", () => {
				const rep = this.declareWar();
				g_GameData.pushTurnEvent(rep);
			}, sprintf("War will be declared against %(from)s", ev.data)
			)];
		}
		else if (ev.type === "peaceProposal")
		{
			return [
				this.makeResponse(ev, "refuse", () => {}, "War carries on"),
				this.makeResponse(ev, "ok", () => {
					g_GameData.pushTurnEvent(this.makePeace(ev.data.from));
					const oDiplo = g_GameData.tribes[ev.data.from].getDiplomacy(ev.data.target);
					g_GameData.pushTurnEvent(oDiplo.makePeace(ev.data.from));
				}, "Both tribes will be at peace and opinion is reset.")
			];
		}
		return [];
	}

	_process(event, func)
	{
		// TODO: record answer.
		return () => {
			this.eventHistory.push(event.id);
			func();
		};
	}

	canAttack()
	{
		return this.status === this.WAR;
	}

	getActions()
	{
		return {
			"insult": true,
			"goHostile": this.status === this.PEACE,
			"declareWar": this.status !== this.WAR,
			"proposePeace": this.status === this.WAR
		};
	}

	insult()
	{
		this.opinion -= 50;
		return new GSInsult({
			"from": this.from,
			"target": this.target,
		});
	}

	goHostile()
	{
		const oldStat = this.status;
		this.status = this.HOSTILE;
		return new GSDiploStatusChange({
			"from": this.from,
			"target": this.target,
			"old": oldStat,
			"new": this.status,
		});
	}

	declareWar()
	{
		const oldStat = this.status;
		this.status = this.WAR;
		this.opinion = -100;
		return new GSDiploStatusChange({
			"from": this.from,
			"target": this.target,
			"old": oldStat,
			"new": this.status,
		});
	}

	proposePeace()
	{
		return new GSPeaceProposal({
			"from": this.from,
			"target": this.target,
		});
	}

	makePeace(originalAsker)
	{
		this.status = this.PEACE;
		this.opinion = 0;
		return new GSPeaceAccepted({
			"from": this.from,
			"target": this.target,
			"originalAsker": originalAsker,
		});
	}
}

GSDiplomacy.prototype.ALLY = 400;
GSDiplomacy.prototype.TRADING = 300;
GSDiplomacy.prototype.PEACE = 0;
GSDiplomacy.prototype.HOSTILE = 100;
GSDiplomacy.prototype.WAR = 200;
