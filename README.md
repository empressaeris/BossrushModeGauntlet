# Havenwood Gauntlet: Boss Rush Mode

An anime-styled, real-time boss rush that runs in the browser. It reimagines the original p5.js *Boss Rush Mode* project.

In the city of Havenwood, Lysa's grandmother, a thief of some renown, has stolen a priceless relic. To pay off the fine, Lysa enters the Havenwood Gauntlet. She has to beat six champions in a row: **the Headstealer**, **the Mountain Lion**, **the Minotaur**, **the Lamia**, **the Griffin** and **the Archmage**.

## Play

There's no build step and nothing to install.

- **Locally:** open `index.html` in a browser.
- **GitHub Pages:** in the repository settings, go to *Pages* and deploy from the branch root. The game is fully static.

### Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Advance dialogue | Click / tap | <kbd>Space</kbd> / <kbd>Enter</kbd> |
| Skip a cutscene | **Skip** button | <kbd>Esc</kbd> |
| Cast Frostbolt / Fireball / Heal / Barrier | Spell buttons | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> |
| Pause | ❚❚ button | <kbd>P</kbd> / <kbd>Esc</kbd> |
| Mute | Speaker button | <kbd>M</kbd> |

### How battles work

- Bosses attack in real time. The **gauge under each boss** shows what attack is coming and when it lands.
- **MP** refills on its own. Every spell costs MP, and Heal and Barrier also have cooldowns.
- **Critical hits** can happen on both sides. Lysa's spells (Heal included) have a 15% chance to crit for 1.6× effect. Each boss has its own crit chance on regular attacks, rising from 10% to 16% as the gauntlet goes on, for 1.75× damage.
- Each boss has a different **weakness** and **resistance**. A hit on a weakness does double damage and a resisted hit does half. Damage numbers show which is which, and the boss's tags fill in once you discover them.
- Watch for special moves:
  - The Headstealer **steals your MP**.
  - The Mountain Lion becomes **enraged** at half health.
  - The Minotaur's **Earthshaker Charge** and the Griffin's **Gale Dive** hit hard, so get a Barrier up first.
  - The Lamia's **Venom Fang** poisons you over time. Heal cures it.
  - The Archmage charges a huge **Inferno Cataclysm** that you'll want a Barrier up for.
- If you lose, you can retry the current round or restart the gauntlet.

## What changed from the original

- **New art direction:** Lysa and her grandmother are dark elves, with silver hair, long ears and gold circlets. Lysa wears eyeshadow, winged eyeliner and rose lipstick, with a high-collared tunic and gold shoulder guards. Every character, background and icon is original anime-style vector art drawn in code (`js/art.js`). There are no image files and no public-domain illustrations.
- **Original music and sound effects:** they're synthesized live with the Web Audio API (`js/audio.js`), so there are no audio files.
- **Battle system:**
  - The boss's next attack is announced ahead of time.
  - Spells cost MP.
  - Heal and Barrier have cooldowns.
  - Both sides can land critical hits, and damage numbers float up from each hit.
  - Each boss has a signature special move.
- **Story:** the original story is kept, with three new bosses (the Minotaur, the Lamia and the Griffin) before the Archmage. There's a VS cut-in before each round, and the ending reveals the Archmage as Lysa's grandfather.
- **Other improvements:** keyboard controls, pause, retrying a round, end-of-run stats, a layout that scales to fit any screen, and support for reduced motion.
- **Bug fixes:** Heal now restores what its message says. The fight also stops correctly when either side is defeated.

## Project structure

```
index.html      page shell
style.css       layout, UI, and animation
js/art.js       SVG character portraits, backgrounds, and spell icons
js/audio.js     synthesized music loops and sound effects
js/game.js      story, scenes, and battle logic
```

Boss stats, spells and story text are plain data at the top of `js/game.js`, so they're easy to tweak.
