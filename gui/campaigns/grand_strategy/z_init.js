var g_CampaignMenu;

function init(initData)
{
	let run = initData?.filename || CampaignRun.getCurrentRunFilename();
	try {
		run = new CampaignRun(run).load();
		run.setCurrent();
		if (!run.data.gameData)
		{
			Engine.SwitchGuiPage("campaigns/grand_strategy/init/page.xml");
			return;
		}
		g_CampaignMenu = new CampaignMenu(run);
		g_CampaignMenu.initialise();
	} catch (err) {
		error(sprintf(translate("Error loading campaign run %s: %s."), CampaignRun.getCurrentRunFilename(), err));
		error(err.stack.toString());
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}
}
