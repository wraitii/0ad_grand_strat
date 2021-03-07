/**
 *
 */
function init(endGameData)
{
	let run = CampaignRun.getCurrentRun();
	if (!!run.data.processEndedGame)
	{
		error("processEndedGame already exists - something went wrong")
	}
	run.data.processEndedGame = endGameData;
	run.save();
}
