# 0 A.D. “Grand Strategy” Campaign

This is the official repo for the “Grand Strategy” mod of 0 A.D. A25.  
The goal is to create a functional grand-strategy style gameplay using the campaign interface, similar to [Rise of Nations's Conquer the World campaign](https://riseofnations.fandom.com/wiki/Conquer_the_World).

My focus is a bit more limited: I want the player to control a single Hero character, that can move across the map. All actions would be executed through this hero, which would gain experience over time, unlocking stuff.

See the 'Issues' of this repository for some more information on the direction of Gameplay.

## Screenshots
<img width="350" alt="Main Screen" src="https://user-images.githubusercontent.com/1927071/122226887-ab67ac00-ceb6-11eb-8e40-4c2c6a009aaf.png" /> <img width="350" alt="Setup Screen" src="https://user-images.githubusercontent.com/1927071/122226907-af93c980-ceb6-11eb-9e2a-1e48c9bb5e2d.png" />

## Changelog & Current Status

It's sort of playable, but the UI is not great™.

### v0.2
- Added a setup screen to choose your civilisation and starting province
- More enemies, & enemies can attack you (though you can auto-win).
- Handle difficulty less rudimentarily so AI can actually be dangerous.
- Allow scrolling around the map via the map edges.
- Add city icons to inhabited provinces.

### v0.1
Initial reveal - sorta playable, but not really.

## Structure

`art` contains art files for the campaign map, which is mostly the provinces art files since for now nothing else is custom.  
`campaigns` contains the campaign data, including root JSON file. The `campaigns/grand_strategy` folder is the 'history' data for the campaign, and is specific to the default campaign I ship.  
`gui` contains the actual meat of the mod. This should be entirely re-usable for another Grand Strat map - it's just a very modded 'skin' of the regular 0 A.D. campaign UI.  
`tools` contains Python tooling, notably the map editor in pygame and the data editor in flask.  
`working_data` contains source art files to draw the map on.

## Contribution & Licence

Contributions are very welcome, however I'll reserve the right to merge things depending on whether they fit the gameplay I envision or not.

This repo, unless specified otherwise, is GPL2, like 0 A.D. - I intend to merge back some of it in the main game, though I think this repository might co-exist to make it easier for me to dev & to make it easier for other people to fork it.
For details, consult LICENSE.md

## Tools

A number of python tools are provided in `tools/`.  
For convenience, you can start them with `sh data_editor.sh` or `sh map_editor.sh`.  
For now, they are undocumented and somewhat prone to crashing. They are optional, though the map editor in particular makes things much easier.
