import { shade } from './color'

// Hand-authored pixel art. Each sprite is a grid of single characters plus a
// palette mapping character -> colour ('.' is always transparent). Grids are
// rendered to SVG rects by <PixelSprite/>, so they scale to any size crisply.

const PET_PAL_BASE = {
  o: '#2b1a10', // outline
  k: '#141018', // eyes / pupils
  w: '#ffffff',
}

// ---------------------------------------------------------------- PUP (common)
export const PUP = {
  id: 'pup',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, b: '#d9a066', l: '#f2cfa0', d: '#a86e3c' },
  grid: [
    '................',
    '...oooooooooo...',
    '..obbbbbbbbbbo..',
    'oddbbbbbbbbbbddo',
    'oddbbbbbbbbbbddo',
    'oddbllllllllbddo',
    'oddbllllllllbddo',
    'oddblkllllklbddo',
    'oddbllllllllbddo',
    '.obbllkkkkllbbo.',
    '..obbllwwllbbo..',
    '...obbbbbbbbo...',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbo....obbo..',
  ],
}

// ------------------------------------------------------------ TURBO (uncommon)
export const TURBO = {
  id: 'turbo',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, s: '#2f6b34', p: '#57a04a', g: '#8fd17a', y: '#c9e88f' },
  grid: [
    '................',
    '................',
    '.....oooooo.....',
    '...oosssssoo....',
    '..ospsspsspso...',
    '.osssssssssso...',
    '.ospsspsspsso...',
    '.osssssssssso...',
    '.ospsspsspsso...',
    '.osssssssssso...',
    '.oggggggggggggo.',
    '..oggoyyoggggo..',
    '..ogo..ogo.ogo..',
    '...o....o...o...',
    '................',
    '................',
  ],
}

// ---------------------------------------------------------------- FROST (rare)
export const FROST = {
  id: 'frost',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, b: '#1c2233', l: '#39435c', w: '#ffffff', y: '#f6a623' },
  grid: [
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '...obwwwwwwbo...',
    '...obwwwwwwbo...',
    '...obwkwwkwbo...',
    '...obwwyywwbo...',
    '...obwwwwwwbo...',
    '..obbwwwwwwbbo..',
    '..oblwwwwwwlbo..',
    '..oblwwwwwwlbo..',
    '..obbwwwwwwbbo..',
    '...obbwwwwbbo...',
    '....oyyo.oyyo...',
  ],
}

// ---------------------------------------------------------------- EMBER (epic)
export const EMBER = {
  id: 'ember',
  w: 32,
  h: 32,
  palette: { o: '#221a1e', a: '#4a4048', b: '#6b6068', l: '#948a92', r: '#ff6a2a', R: '#ffc23d', y: '#fff0b8', k: '#0d0a10', e: '#ffd166', w: '#e8e2d8' },
  grid: [
    '.......owo............owo.......',
    '.......owwo..........owwo.......',
    '.......owwwoooooooo.owwwo.......',
    '........owwooooooooowwwo........',
    '........owoaaaaaaaaowwwo........',
    '........ooaaaaaaaaaaowo.........',
    '........ooaaaaaaaaaaoo..........',
    '........ooaaaaaaaaaaoo..........',
    '........ooallllllllaoo..........',
    '........ooaleelleelaoo..........',
    '........ooalkelleklaobo.........',
    '........ooallllllllaobbo........',
    '.........ooalrRRrlaolbbbo.......',
    '.........ooalwkkwlaolllbbo......',
    '.........oboooooooolllrlbbo.....',
    '..........obbbblllllllRllbo.....',
    '....oo.....obbbblllllrlrlbbo....',
    '...olboo....obbbbllllllllbbo....',
    '..olllbbo....oobbblllllllbbo....',
    '..olllbbo......obllllllybbbo....',
    '..olllrbbo.....obllllllRbbo.....',
    '..obllRbbo...oobllllllrbrbo.....',
    '..oblrlrlbooobllllllllbbbo......',
    '..obbllllllblllllllllbbbbo......',
    '..obbllllllllllllrlllbbbo.......',
    '...oblllllyllllllRlbbbbbo.......',
    '....obblllRlllllrbrbbbbo........',
    '.....obblrlrllbbbbbbbbbo........',
    '......oobbllbbbbbbbbboo.........',
    '........obbbbbbbbbboo...........',
    '.........oobboobooo.............',
    '...........oo..o................',
  ],
}

// ------------------------------------------------------------- ZEUS (legendary)
export const ZEUS = {
  id: 'zeus',
  w: 32,
  h: 32,
  palette: { o: '#2a1206', m: '#7d4109', n: '#bd6d0d', y: '#eda227', b: '#e0a844', l: '#f7d489', d: '#a9701f', e: '#8bf0ff', k: '#0d1020', w: '#fff6e0', z: '#d6f8ff', p: '#7c4318' },
  grid: [
    '.........oo...onno...oo.........',
    '........onno.onnnno.onno........',
    '........omzmoommmmoozmmo........',
    '........ommzmmmmmmmzmmmo........',
    '........omzmmmmmmmmmzmmo........',
    '...ooooommmnnnnnnnnnmmmmooooo...',
    '..ommmmmmnnnooooooonnnmmmmmmno..',
    '..ommmmmnnobbbbbbbbbonnmmmmmno..',
    '...ommmnnobbbbbbbbbbbonnmmmmo...',
    '....ommnnobbbbbbbbbbbonnmmmo....',
    '....omnnnobbbbbbbbbbbonnnmmo....',
    '...ommnnnobblllllllbbonnnmmmo...',
    '.oommmnnobbdddllldddbbonnmmmnoo.',
    'onnmmmnnobleellllleelbonnmmmnnno',
    '.oommmnnoblkellllleklbonnmmmnoo.',
    '...ommnnoblllllllllllbonnmmmo...',
    '...ommnnnobdllpppllddonnnmmmo...',
    '..ommmmnnobdllpppllddonnmmmmno..',
    '...ommmnnnobdwkkkwdbonnnmmmmo...',
    '....oommnnnobbbbbbbonnnmmmoo....',
    '......ommnnnooooooonnnmmmo......',
    '.......ommmnnnnnnnnnmmmmo.......',
    '........oommmmmmmmmmmmoo........',
    '........ommmmmmmmmmmmmmo........',
    '.......ommmmmmmmmmmmmmmmo.......',
    '......onnnyyyyyyyyyyyynnno......',
    '......onnyyyyyyyyyyyyyynno......',
    '......onnyyyyyyyyyyyyyynno......',
    '.......onyyyyyyyyyyyyyyno.......',
    '........onyyyyyyyyyyyyno........',
    '.........oobwboyyobwboo.........',
    '..........oooooyyooooo..........',
  ],
}

// ---------------------------------------------- TUSKLING (legendary, seasonal)
// Grimtusk's cub. Only players who put damage on the Season 2 world raid ever
// see one, so it wears the same greens and amber eyes as the boss it came from.
export const TUSKLING = {
  id: 'tuskling',
  w: 32,
  h: 32,
  palette: { o: '#1c2a12', g: '#5f8a3a', l: '#83b154', d: '#3d5c26', t: '#f4eed4', e: '#fbbf24', k: '#101018', w: '#ffffff', h: '#3a2a16' },
  grid: [
    '...........ohho..ohho...........',
    '.......oo..ohhhoohhho..oo.......',
    '......ohhoooooooooooooohho......',
    '......ohhhoggggggggggohhho......',
    '......ohoggggggggggggggoho......',
    '......ooggggggggggggggggoo......',
    '.....ooggggggggggggggggggoo.....',
    '.....ooggggggggggggggggggoo.....',
    '.....ooggggggggggggggggggoo.....',
    '.....ooggggggggggggggggggoo.....',
    '.ooooooggllllllllllllllggoooooo.',
    'odddddoglleekllllllkeellgodddddo',
    'odddddogllkeelllllleekllgodddddo',
    '.oddddoggtlllllllllllltggoddddo.',
    '..ooddogtttllllddlllltttgoddoo..',
    '....odogttttllkkkkllttttgodo....',
    '.....ooggtttllwwwwlltttggoo.....',
    '......oogttttllllllttttgoo......',
    '.......oogtttlllllltttgoo.......',
    '........oogtggggggggtgoo........',
    '.....o...oooooooooooooo...o.....',
    '...oogoo...ooooggoooo...oogoo...',
    '..ogggggo.oggggggggggo.ogggggo..',
    '.ogggggggoggggggggggggogggggggo.',
    '.ogggggggoggggggggggggogggggggo.',
    '.oggggggggggggggggggggggggggggo.',
    '.ogggggggggggggllgggggggggggggo.',
    '.oggggggggggllllllllggggggggggo.',
    '..ogggggoogllllllllllgoogggggo..',
    '...oogooooggllllllllggoooogoo...',
    '.....o.ooglllgolloglllgoo.o.....',
    '........oooooooggooooooo........',
  ],
}

// Legendary companion. Front-facing like the rest of the roster so it sits in the
// collection grid as a set, and it wears the LVL100 band the same as every pet.
export const DRAKE = {
  id: 'drake',
  w: 32,
  h: 32,
  palette: { o: '#17240f', g: '#4f7a3c', l: '#7fb45c', d: '#33532a', y: '#efe0a8', r: '#f2803a', R: '#ffc23d', k: '#101018', e: '#ffcf4d', w: '#f4f0e0' },
  grid: [
    '..........o..........o..........',
    '.........owo........owo.........',
    '.........owwo......owwo.........',
    '.........owwwo....owwwo.........',
    '.........owwwo....owwwo.........',
    '..........owwwoooowwwo..........',
    '..........owoooooooowo..........',
    'oo........ooggggggggoo........oo',
    'owoo.....ooggggggggggoo.....oowo',
    'owdooo...ooggggggggggoo...ooodwo',
    'owdldoo..ooggggggggggoo..oodldwo',
    'owdlldoo.ooggggggggggoo.oodlldwo',
    'owdllldoooggllllllllggooodllldwo',
    'owdlldldoogekllllllkegoodldlldwo',
    'owdllldldogkellllllekgodldllldwo',
    'owdlldldloggllllllllggoldldlldwo',
    'owdllldldloggllllllggoldldllldwo',
    'oowdlldldlgoggllllggogldldlldwoo',
    '.oowdlldllgoglkllklgoglldlldwoo.',
    '..oowdlldlgogllllllgogldlldwoo..',
    '...oowdldlgogwwkkwwgogldldwoo...',
    '....ooooggogogrRRrgogoggoooo....',
    '.....oooooogyooooooygoooooo.....',
    '.........oogyrRRRRrygoo.........',
    '.........oogyyrRRryygoo.........',
    '.........ooggyyrrryggoo.........',
    '..........ooggyyyyggoo..........',
    '...........ooggyyggoo...........',
    '...........oogggggooo...........',
    '..........ooggooooggoo..........',
    '.........oowwwoooowwwoo.........',
    '..........ooooo..ooooo..........',
  ],
}

export const PET_SPRITES = { pup: PUP, turbo: TURBO, frost: FROST, ember: EMBER, zeus: ZEUS, tuskling: TUSKLING, drake: DRAKE }

// ------------------------------------------------------------------- ARMOUR
// Armour is drawn once per slot in neutral palette slots and recoloured per
// set, which is how thirty pieces of gear cost six drawings. Palette keys:
// o outline, d dark, m mid, l light, A trim, s strap.
// Armour is drawn once per slot in neutral palette slots and recoloured per
// set, which is how thirty pieces of gear cost six drawings. Palette keys:
// o outline, d dark, m mid, l light, A trim, s strap.
// Weapons and armour, transcribed from art/ by tools/import_gear.py: helm,
// chestplate, leggings, gauntlets, boots and shield, plus six weapons. 32 x 32
// each, drawn once and bound to the ARMOUR_PALETTES ramp by brightness — which
// is what lets one drawing come back as leather, iron, bone, verdant and
// gilded instead of needing five of everything.
const GEAR_ART = {
  helm: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...............oo...............',
    '.............oolmoo.............',
    '............ooAllAoo............',
    '...........oolAAAlmoo...........',
    '..........oAAAdAAAAmoo..........',
    '..........oAAAAAAAAmmo..........',
    '.........ooAlmAAAAAmmmo.........',
    '.........olAAmAAAlAlAmo.........',
    '.........ommlmmmmmlldmo.........',
    '.........oAmlmAAlllmmmo.........',
    '.........oooldooomlmmmo.........',
    '.........oodlodddoooooo.........',
    '.........oooldmdmommloo.........',
    '.........ooolomllomlloo.........',
    '........ooooooo..dAllodo........',
    '........omooo....olllooo........',
    '........omooo...odlllo..........',
    '........omoooooomdllo...........',
    '.........o..ooodoolo............',
    '.............ooo..o.............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  chest: [
    '................................',
    '................................',
    '................................',
    '................................',
    '........oooo........sooo........',
    '.......oodAos......soAmoo.......',
    '.......odmAoooo..ooooAAdo.......',
    '.......ooAAoddooooddoAAoo.......',
    '........oAlloodmmddollAo........',
    '........olllsooooooslldo........',
    '........osllssoooodsldso........',
    '........osllslssssmsllso........',
    '.......oslddmAmmmmmmsssdo.......',
    '.......olsAAAAAAAAAmmmslo.......',
    '......ooAsAAAAAlllAAmmsAoo......',
    '......oodmAAAAlAlllmAmddoo......',
    '......oodmmAAllAlllmAmddoo......',
    '......ooAdmAllAAAlAmAmdAoo......',
    '......ossdmlAllllllmAmdAso......',
    '......ooAdmAmllllllAAddloo......',
    '.......oAdmAmllllllAlmdmo.......',
    '.......odmmlAmllllAmldddo.......',
    '.......osddmmmmlllmmmdddo.......',
    '.......omsdmmmmmmmmmmssmo.......',
    '.......oooAsdsmmmmsdsAooo.......',
    '........ooooAlAsdAlAoooo........',
    '.........oooooooooooooo.........',
    '............oooooooo............',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  legs: [
    '................................',
    '................................',
    '................................',
    '................................',
    '.........sso.....oooo...........',
    '.........smmdo..odmAddo.........',
    '........oAAAAddoolAAAlmo........',
    '........ooAAAmoooAAAAAlso.......',
    '........omAAllmmsAAAAmloo.......',
    '.........olmlmdsolAAlllos.......',
    '.........slmdmsmsdmmmmmso.......',
    '..........sollmmoodmdmmmo.......',
    '..........slllmlooooolmoo.......',
    '..........olllmmoolmllmoo.......',
    '..........ollmlmosllllmld.......',
    '..........oollmsoslAAmmmo.......',
    '..........oolmdoosmllmloo.......',
    '..........ooAmmo.sslllso........',
    '..........ssAmso.ooAAmAo........',
    '..........ooolosoooAAAoo........',
    '.........doAAdsoodmmAAlo........',
    '........doAAlmmmoodlsomo........',
    '.......ddAAmmmdlosdAAoso........',
    '......olAAldldooddAAdmmo........',
    '......dddddoss.odAAAAdoo........',
    '.......oooos...dAAAAlsso........',
    '...............sllllmd..........',
    '...............dooosd...........',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  gloves: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.........s............o.........',
    '.......lolsdo......sdoloo.......',
    '......oAoAodAs....oAAoAoAs......',
    '.....sdmmAooms....smAoAsmdo.....',
    '.....momoAoAd......mAsAolom.....',
    '....smdlmAoAd......mAoAsmlms....',
    '....dmomoAoAmooddsdmAoAomoAd....',
    '....oldodAoAmolsslsmdsAddsmo....',
    '.....sdAAAllooloolomslAAlds.....',
    '.....mllAAllsoAsolosAlAAlll.....',
    '.....lllAdAslAl..lslsAdAllm.....',
    '.....smsslllAmo..mmAlAlsoms.....',
    '.....smlAAAdlm....mlsAAAlds.....',
    '.....omllAlsmd....mmllAllms.....',
    '.....smmlAlmm......mslAlmms.....',
    '.....ddodddsm......msdodsdm.....',
    '.....oldodlmm......smllldAo.....',
    '....dsosdAddds....ddddllssds....',
    '....doddsolmds....oddlAlddoo....',
    '.....dddsdmdod....mmdsmddsd.....',
    '.....odddAAoo......sslAddos.....',
    '........dso..........sss........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  boots: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '............ssss................',
    '.........ooodddmos.ooodssoo.....',
    '.........oAAmddddssAAlddddo.....',
    '.........ddlAAldmssoAlAolds.....',
    '.........slolmmddssdmlAlodd.....',
    '.........olAllodo.mlAAmooomo....',
    '.........oddAlmds.dddAmmooo.....',
    '.........slAlmmds.ssmdllmdo.....',
    '.........odAsmmds.slAllmosm.....',
    '.........ddsAmmdd.ooossssso.....',
    '........oosAAAmdd.ooodsmddd.....',
    '.......ooooAAlmdmdooomAAddo.....',
    '.......olsAAAlmlmooAoAllddm.....',
    '.....doAAoAllmdmmoooAAlmmmm.....',
    '...soAAAAlldddsooAAdAlllslm.....',
    '..olAAAAAmmmdsoolAAllllmdmos....',
    '..ollllllmmddoAAAoAAolldooms....',
    '..oAmmmlmddolAAAAAAAAlmommms....',
    '...ooooolooolllllllmmmooooo.....',
    '...........slmmmlmmommo.........',
    '...........ooAAlllmmoo..........',
    '..............sssso.............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  shield: [
    '...........sssssssoss...........',
    '.........sosAAAAAAAAAoo.........',
    '.......ssAAAdAsdssAAAddoo.......',
    '......sAAAssoodddsssodddds......',
    '.....sAAosodlllmmllllosddds.....',
    '....sAAosllllllmmllllllssdss....',
    '...sAAsslllllllmdlllllllsodds...',
    '..oAAssllllllllmmllllllllsodds..',
    '..sAAsAllllllllmdllllllllosdds..',
    '.oAAsllllllllllmmlllllllldloddo.',
    '.sAsslllllllmoAAAAollllllAlsdds.',
    'ssAolllAllloAAAAAAddslllllllsdos',
    'sAAslllllllAAoAAddoddlllllllsddo',
    'sAAlllllllsAoAAAAAssmsllllllsdds',
    'sAdsllollAAAAAAAAlddmmollsllsodm',
    'oAdsAmmmdmAoAAAAAAAsomsddmmmsodo',
    'sAdsmmmssmAodAAmmmsssdsdsmmmsodo',
    'sAooloosmoAAddmmmssosdoomomosodo',
    'oddslmsllmoAosdssssodomdmAlmoddo',
    'oddomlsmmmmddodssooodommmslmoddo',
    'oodoAllmmmmodddsdsddommmmsmdodso',
    '.odAommmmmmAooddddooollmmAmoddo.',
    '.oAdomolmlmsmmsodommmldlmsmodoo.',
    '..oddoolmmmAlmmmmodmmlmllAoddo..',
    '..oddoommmmdmmmmmommmmmmmoodoo..',
    '...oddoommmdmmmmmmmmmmmmooddo...',
    '....oodoommommmmmmmmmmmoodoo....',
    '.....odddosommommmmmmoodddo.....',
    '......oddddosdosdodooAdddo......',
    '.......oosddddooooddAddoo.......',
    '.........osssddddddsooo.........',
    '...........soooooosso...........',
  ],

  sword: [
    '................................',
    '................................',
    '................................',
    '..........................sss...',
    '........................odAAs...',
    '.......................dAAmms...',
    '......................dAAlms....',
    '.....................slllmls....',
    '....................oAAmlms.....',
    '...................olAmmmo......',
    '..................dlAmlms.......',
    '.................slAmmmo........',
    '................sAAmlms.........',
    '...............slAmlms..........',
    '..............dAAmmms...........',
    '.............oAAmlls............',
    '........ss..sAAmlmo.............',
    '.......sAsooAAlllo..............',
    '........sAolAlmls...............',
    '.........oAolmlo................',
    '.........ommdds.................',
    '........ooddloo.................',
    '.......oddosolls................',
    '......olddo..olo................',
    '.....ssmds....o.................',
    '...somddo.......................',
    '...sddoo........................',
    '...sddm.........................',
    '....sss.........................',
    '................................',
    '................................',
    '................................',
  ],

  axe: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.................sA.............',
    '...............oAAA.............',
    '..............sAlmlsd...........',
    '..............lAmlmmss..........',
    '.............oAmlmlAAds.........',
    '.............AAlmlAmmdAo........',
    '.............odsddmmmmmmAs......',
    '................sdddmmmdA.......',
    '...............oldsdmmmAs.......',
    '..............olmo.dllAo........',
    '.............osmo..slAAo........',
    '............oldo...sAo..........',
    '...........somo.................',
    '...........odds.................',
    '..........dmdso.................',
    '.........sldool.................',
    '........sdmo.do.................',
    '.........ss.....................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  bow: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '........................do......',
    '....................sdldoo......',
    '.................lAAlmmmds......',
    '...............sAAlso..l........',
    '..............oAmo....d.........',
    '.............llmo....d..........',
    '............ollo....d...........',
    '...........dmmo....A............',
    '..........olmo....do............',
    '..........Ams....Ad.............',
    '.........slm....Ao..............',
    '.........od....As...............',
    '........olo...Ad................',
    '........om...ld.................',
    '........sm..Ad..................',
    '........lm.Ao...................',
    '........AsAo....................',
    '.......oldo.....................',
    '.......lmo......................',
    '.......md.......................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  dagger: [
    '................................',
    '................................',
    '................................',
    '................................',
    '........................os......',
    '.......................oAoo.....',
    '......................sssloo....',
    '.....................ssdomms....',
    '....................smmmmss.....',
    '...................oslmmms......',
    '..................smmmmss.......',
    '.............sssssmlllms........',
    '.............sosAslllmo.........',
    '..............ssoAsmmo..........',
    '.............soloolos...........',
    '............solAmmoso...........',
    '...........oolAmlmmmss..........',
    '..........solAlllAssss..........',
    '.........osAAAmlAo..s...........',
    '........soAllmlAo...............',
    '........ollAlllo................',
    '.......sllmmllo.................',
    '......dolAmlAo..................',
    '......slmllAd...................',
    '.....dAAllos....................',
    '.....oAlosd.....................',
    '....sAssd.......................',
    '....sss.........................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  spear: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.......................oAm......',
    '.....................ollA.......',
    '...................soAllm.......',
    '...................sAmls........',
    '...................sAmAs........',
    '..................slsms.........',
    '.................slls...........',
    '................sAssss..........',
    '...............oAs.so...........',
    '..............oAo...............',
    '.............olo................',
    '............oAo.................',
    '...........oAo..................',
    '..........sls...................',
    '.........sls....................',
    '........sms.....................',
    '.......sms......................',
    '.......ss.......................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

  staff: [
    '................................',
    '................................',
    '................................',
    '................................',
    '...............oo...............',
    '.............ssAAss.............',
    '.............lAAlAs.............',
    '.............lmmmld.............',
    '.............dd.dmld............',
    '...............smmm.............',
    '..............sAAm..............',
    '..............mAms..............',
    '..............olmo..............',
    '..............oms...............',
    '...............sd...............',
    '...............ss...............',
    '...............sA...............',
    '...............oms..............',
    '...............olo..............',
    '...............mlo..............',
    '...............olo..............',
    '...............dlo..............',
    '...............As...............',
    '...............Am...............',
    '...............oo...............',
    '...............mm...............',
    '...............oo...............',
    '...............oo...............',
    '................................',
    '................................',
    '................................',
    '................................',
  ],

}


/**
 * Six values a set is painted in, plus `E` — the one that emits.
 *
 * `A` is trim, the brightest value in the metal; `E` is light, and only the two
 * top shapes use it. It is what turns a gem into a gem and an eye slit into an
 * eye, and it is why the last set stops looking like the first one in a
 * different colour.
 */
export const ARMOUR_PALETTES = {
  leather: { o: '#150e0a', s: '#3a2415', d: '#5c3a22', m: '#7d5233', l: '#a06b45', A: '#c9a227', E: '#e8c25c' },
  iron: { o: '#10131a', s: '#2a2f38', d: '#4a515e', m: '#6b7280', l: '#98a1ae', A: '#c3c9d4', E: '#dbe7f5' },
  bone: { o: '#191512', s: '#3a352c', d: '#8a8272', m: '#b5ad9b', l: '#ded7c6', A: '#6f6656', E: '#c8f0a8' },
  verdant: { o: '#0b1a18', s: '#113330', d: '#1f6b60', m: '#35a294', l: '#6fd7c6', A: '#d9b451', E: '#7ef2d8' },
  // The last set is not a colour of metal. Crystal shot through with violet,
  // traced in gold and lit from inside — the thing the whole road is for.
  gilded: { o: '#0e0620', s: '#331c5e', d: '#502d92', m: '#7d55cc', l: '#bda2f2', A: '#ffd77a', E: '#8ff8ff' },
}

/** One slot + one set = one sprite, built on demand. */
// The Founder's Cuirass — the beta gift, and the only piece of gear that is not
// part of a set.
export const FOUNDER_CHEST = {
  w: 32,
  h: 32,
  palette: {
    o: '#080a0e',
    d: '#22262e',
    m: '#3c424c',
    l: '#5e6674',
    A: '#c08a1c',
    s: '#f2ca55',
    k: '#0d0f14',
  },
  grid: [
    '................................',
    '................................',
    '...........oooooooooo...........',
    '....ooo...oAAssssssAAo...ooo....',
    '..oollloo.oAAAkkkkAAAo.oollloo..',
    '.omlllllmooAAAkkkkAAAoomlllllmo.',
    'omlllllllmommlkkkklmmomlllllllmo',
    'AmlllllllmommlkkkklmmomlllllllmA',
    'AmlllllllmmmmlkkkklmmmmlllllllmA',
    'AmlllllllmmmmllllllmmmmlllllllmA',
    'AmlllllllmmsmllllllsmmmlllllllmA',
    'AmmlllllmmmAmsllllsAmmmmlllllmmA',
    'AmmmlllmmmmmmAsllsAmmmmmmlllmmmA',
    'AmmmmmmmmmommllllllmmommmmmmmmmA',
    'ommmmmmmmmommmAssAmmmommmmmmmmmo',
    'AssssssssAommmmssmmmmoAssssssssA',
    'AAAAAAAAAAommmAkkAmmmoAAAAAAAAAA',
    'oddddddddoommmAkkAmmmooddddddddo',
    'oddddddddoommmmAAmmmmooddddddddo',
    'oddddddddoommmmmmmmmmooddddddddo',
    'oddddddddoosmmmmmmmsmooddddddddo',
    'odkkkkkkdooAmsmmmmsAmoodkkkkkkdo',
    '.oooooooo.ommAsmmsAmmo.oooooooo.',
    '..........ommmAssAmmmo..........',
    '..........ommmmAAmmmmo..........',
    '.........oommmmmmmmmmoo.........',
    '........oAAddddddddddAAo........',
    '........oAAddddddddddAAo........',
    '........oAAAAAAAAAAAAAAo........',
    '.........ooddssssssddoo.........',
    '...........oooooooooo...........',
    '................................',
  ],
}

/** Palette used when the Founder's Cuirass is drawn on the body. */
export const FOUNDER_PALETTE = FOUNDER_CHEST.palette

/** Special pieces carry their own art and palette instead of a set recolour. */
const SPECIAL_SPRITES = { founderChest: FOUNDER_CHEST }

export function armourSprite(slot, set = 'leather') {
  if (SPECIAL_SPRITES[slot]) return SPECIAL_SPRITES[slot]
  const grid = GEAR_ART[slot] ?? GEAR_ART.chest
  return { w: grid[0].length, h: grid.length, palette: ARMOUR_PALETTES[set] ?? ARMOUR_PALETTES.leather, grid }
}

// The treasure chest, imported from art/chest.png at 32x32.
export const CHEST_SPRITE = {
  w: 32,
  h: 32,
  palette: {
    a: '#341c0d',
    b: '#d69922',
    c: '#100b01',
    d: '#532d16',
    e: '#cf9220',
    f: '#402310',
    g: '#fbe560',
    h: '#874825',
    i: '#1b1006',
    j: '#f2c73f',
    k: '#6a391d',
    l: '#fbf5b6',
    m: '#e3ab29',
    n: '#2a170a',
    p: '#c68619',
    q: '#65400a',
    r: '#b67715',
    s: '#996b18',
    t: '#7f5813',
    u: '#887f4c',
  },
  grid: [
    '................................',
    '................................',
    '.....mmj.................mmj....',
    '....jlgdfddddddddddddddfagljg...',
    '...gjjpkhhhhhhhhhhhhhhhhkppjg...',
    '..mgjlakkkkkkkkkkkkkkkkkkfgjjg..',
    '..lggldhhhkkkhkhhhhhhhhhhfgljg..',
    '..glgjnhhhhhhhhhhahhhhhhhncgg...',
    '..gjgcdfdddddddddddddddddfagjj..',
    '..jjgckkkkkkkkkkkkkkkkkkkkdgjj..',
    '.rgjbcdddddddddddddddddddddbjjr.',
    '.pbbrciiiiiiiiiiiiiiiiiiiiirbbr.',
    '.ejercaaaaaafafffaaaafffaaapeep.',
    '.jmeennaaaaaaaaaaaaaaaaaaanbeej.',
    '.ggglgiiiiiiillllllciiiiiijlggg.',
    '.bpprglgjggjlleeeeeljggglllpppb.',
    '.jeeeeeeeeepgeqqqqelieeeeeeeeej.',
    '..c.qaacaaccgejjjjqgcccaccc...c.',
    '..lggmeeeepscqmjmmqcspbbbebmgl..',
    '..gmmbcccccccmbccmqcccccccbmmm..',
    '..bbbbinnnnncmesipqcnnnnnicbbb..',
    '..leecffffffceebmprcffffffceeg..',
    '..ubbciaaaaiicseesgiaaiaaicbbg..',
    '...bbcaaaaaaancmjgiaaaaaaanbbj..',
    '...bbcfffffaaannnnaafafffanbbj..',
    '...bbcifffffffffffffffffficbbj..',
    '..l..gcnaaaaaanaaaaaaaaancc..l..',
    '..jbbjccccccccccccccccccccjbbj..',
    '..jbbbtebeeebbebbeebbbbbetbbbj..',
    '..bmmbtbbbbbbbbbbbbbbbbbbtmmmb..',
    '................................',
    '................................',
  ],
}

// ----------------------------------------------------------------- STONE / GEM
// One 10x10 gem, recoloured per stone via the `A` accent slot.
export const STONE_SPRITE = {
  w: 10,
  h: 10,
  palette: { o: '#0d0a16', A: '#a855f7', h: '#ffffff', d: '#3b1d63' },
  grid: [
    '...oooo...',
    '..ohhAAo..',
    '.ohAAAAAo.',
    'ohAAAAAAAo',
    'oAAAAAAAdo',
    'oAAAAAAddo',
    '.oAAAAddo.',
    '..oAAddo..',
    '...oddo...',
    '....oo....',
  ],
}

// ------------------------------------------------------------------ WORLD BOSS
// The Couch Titan — the app-wide raid target.
export const BOSS_SPRITE = {
  w: 20,
  h: 16,
  palette: {
    o: '#160b16',
    b: '#5b2340', // upholstery
    l: '#7d3358',
    d: '#3a1229',
    e: '#f43f5e', // eyes
    y: '#fbbf24',
    s: '#241026',
  },
  grid: [
    '....................',
    '..oooo........oooo..',
    '.oblllo......oblllo.',
    '.obllllooooobbllllo.',
    '.obllllbbbbbbllllbo.',
    'oobllllllllllllllboo',
    'obllleollllllloelllo',
    'obllleollllllloelllo',
    'obllllllsssslllllllo',
    'obllllsyyyysslllllbo',
    'obllllsssssslllllllo',
    'obbllllllllllllllbbo',
    'obddbbbbbbbbbbbbddbo',
    'obddoooooooooooodddo',
    'oddo..........oddo..',
    'oo................oo',
  ],
}

// --------------------------------------------------------------- OGRE BOSS --
// Season 2's world boss. Bigger canvas than the pets because it carries a whole
// screen: heavy brow, sunken amber eyes, tusks over the top lip, and a club
// gripped in the right fist. Shaded with three greens rather than one so the
// mass reads at the size the raid card shows it.
export const OGRE_SPRITE = {
  w: 36,
  h: 39,
  palette: {
    o: '#101a0c', // outline
    g: '#5f8a3a', // skin
    l: '#7fae4e', // lit
    d: '#3d5c26', // shadow
    n: '#4c7230', // nose
    e: '#fbbf24', // eye
    k: '#0d1408', // socket
    t: '#f0e9cf', // tusks and teeth
    r: '#5e1c2b', // mouth
    b: '#6b4326', // loincloth
    w: '#7a5230', // club
    W: '#96683e',
    s: '#b9c0cc', // iron bands
  },
  grid: [
    '....................................',
    '...........................ooooooo..',
    '..............ooooooo.....owwwwwwwo.',
    '............oogggggggoo...owWWWWWwo.',
    '..........oogglllllllggoo.owssssswo.',
    '.........ogglllllllllllggoowWWWWWwo.',
    '........oglllllllllllllllgowssssswo.',
    '........oglllllllllllllllgowWWWWWwo.',
    '......oogglllllllllllllllggwwwwwwwo.',
    '.....ogggdddddddddddddddddgggwwwoo..',
    '....oggggdddddddddddddddddggggwwo...',
    '....oggggggkeekgggggkeekggggggwwo...',
    '.....ogggggkkkkgnnngkkkkgggggwwwo...',
    '......ooogttggggnnnggggttgooowwwo...',
    '........ogttggggnnnggggttgo.owwwo...',
    '.........ottrtrrtrrtrtrtto..owwwo...',
    '....oooooottgggggggggggttoooowwwo...',
    '...oggggggggggggggggggggggggowWwo...',
    '..oggggggglllllllllllllllgggowWwogo.',
    '..ogggggggggggggggggggggggggowWwogo.',
    '.oggggggdgggggggggggggggggdgowWwogo.',
    '.oggggggdgggggggggggggggggdgowWwogo.',
    '.oggggggdggggglllllllgggggdgowWwogo.',
    '.oggggggdgglllllllllllllggdgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdgglllllllllllllggdgodddddgo',
    'oggggggggggggglllllllggggggggldddlgo',
    'ogggggggggddddddddddddddddggdddddggo',
    'ogggggggggbbbbbbbbbbbbbbbbogggggggo.',
    '.ogggggggogggggggoogggggggoogggggo..',
    '..ogggggoogggggggoogggggggo.ooooo...',
    '...ooooo.ogdddddgoogdddddgo.........',
    '.........ogdddddgoogdddddgo.........',
    '........oogdddddgoogdddddgoo........',
    '.......oggggggggggggggggggggo.......',
    '.......oddddddddddddddddddddo.......',
    '........oooooooooooooooooooo........',
  ],
}

// ------------------------------------------------------------ CAMPAIGN BOSSES
// The story-mode ladder. Each one is an obstacle you actually meet — never a
// verdict on the player — so they are excuses, plateaus and sleep debt given a
// body, ending with the only thing left to beat: yourself, finished.

// The one that gets you before you have started. Hooded, half asleep, in no hurry.
export const WRAITH_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a1630',
    c: '#4c4a7a',
    d: '#35335c',
    l: '#6b6899',
    k: '#0e0c1c',
    e: '#67e8f9',
  },
  grid: [
    '..........ooooooo...........',
    '........oollllllloo.........',
    '.......olllllllllllo........',
    '......olllllllllllllo.......',
    '.....olllllllllllllllo......',
    '....oclllllllllllllllco.....',
    '....oclllllllllllllllco.....',
    '...occcllllkkkkkllllccco....',
    '...occcclkkkkkkkkklcccco....',
    '...occcckkkkkkkkkkkcccco....',
    '...occckkkkkkkkkkkkkccco....',
    '...occckeeekkkkkeeekccco....',
    '....occkkkkkkkkkkkkkcco.....',
    '....occckkkkkkkkkkkccco.....',
    '....ooccckkkkkkkkkcccoo.....',
    '...occccccckkkkkccccccco....',
    '...occccccccccccccccccco....',
    '...occdcccdcccccdcccdcco....',
    '...occdcccdcccccdcccdcco....',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '..ocoocoocoocoocoocoocooco..',
    '.o.ocoooco.oco.ocoooco.oco..',
    'odo.oodoo.odo..odo..odo.o...',
  ],
}

// Lit from below by a screen at 1am. Everything above the jaw is in shadow.
export const DOOMSCROLL_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#140f22',
    b: '#2a2440',
    d: '#1c1830',
    s: '#5b4d42',
    g: '#f5e7c2',
    G: '#6d7c99',
    p: '#e0f2fe',
    P: '#0b0715',
    e: '#0b0715',
    h: '#171226',
  },
  grid: [
    '............................',
    '..........ooooooo...........',
    '........oohhhhhhhoo.........',
    '.......ohhhhhhhhhhho........',
    '......ohhhhhhhhhhhhho.......',
    '.....ohhhhhhhhhhhhhhho......',
    '.....ohhhhhhhhhhhhhhho......',
    '.....ohhhhhhhhhhhhhhho......',
    '......ohhhhhhhhhhhhho.......',
    '......oshheehhheehhso.......',
    '......ossseehhheessso.......',
    '.......ossssssssssso........',
    '.......ossgggggggsso........',
    '........ossgggggsso.........',
    '......ooobbsssssbbooo.......',
    '....oobGGGGGGGGGGGGGboo.....',
    '...obbbbGGGGGGGGGGGbbbbo....',
    '..obbbbbbGGGGGGGGGbbbbbbo...',
    '.obbbbbbbbGGGGGGGbbbbbbbbo..',
    'obbbbbbbbbbGGGGGbbbbbbbbbbo.',
    'obbbbbbbPPPPPPPPPPPbbbbbbbo.',
    'obbbbbbbPpppppppppPbbbbbbbo.',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPPPPPPPPPPPddddbbo..',
    '.obbddddbbbbbbbbbbbddddbbo..',
    '.obbbbbbbbbbbbbbbbbbbbbbbo..',
    '.obbbbbbbbbbbbbbbbbbbbbbbo..',
  ],
}

// A power rack that grew a skull and bit down on the bar.
export const IRONJAW_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0d0f14',
    m: '#6b7280',
    h: '#a8aeb9',
    d: '#3f4550',
    e: '#f43f5e',
    r: '#fda4af',
    p: '#33333a',
    b: '#8b909b',
  },
  grid: [
    'dddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddd',
    'ddddoooooooooooooooooooodddd',
    'ddddo.....ooooooo......odddd',
    'dppdoooooommmmmmmooooooodppd',
    'ddddmhhhhhhhhhhhhhhhhhmodddd',
    'ddddmmmmmmmmmmmmmmmmmmmodddd',
    'ddddmdddddddddddddddddmodddd',
    'dppdmdddddddddddddddddmodppd',
    'ddddmmeeeeemmmmmeeeeemmodddd',
    'dddmmmerrremmmmmerrremmmdddd',
    'dddmmmerrremmmmmerrremmmdddd',
    'dppmmmeeeeemmmmmeeeeemmmdppd',
    'dddmmmmmmmmmmmmmmmmmmmmmdddd',
    'ddpppmmmmdddddddddmmmmmpppdd',
    'dpppppmmmdddddddddmmmmpppppd',
    'dpppppmhhmhhmhhmhhmhhmpppppd',
    'ppdddpphhdhhdhhdhhdhhppdddpp',
    'ppdddpphhmhhmhhmhhmhhppdddpp',
    'pdddddphhhhhhhhhhhhhhpdddddp',
    'pdddddpbbbbbbbbbbbbbbpdddddp',
    'pdddddpbbbbbbbbbbbbbbpdddddp',
    'ppdddppmmmmmmmmmmmmmmppdddpp',
    'ppdddppmmmmmmmmmmmmmmppdddpp',
    'dpppppoooooooooooooooopppppd',
    'dpppppo..............opppppd',
    'ddpppo................opppdd',
    'ddddo..................odddd',
    'ddddo..................odddd',
  ],
}

// Not a monster. A wall. That is the whole point of it.
export const WALL_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a0f0c',
    r: '#7f3d2e',
    R: '#96503c',
    m: '#463f3a',
    e: '#fbbf24',
    k: '#150e0a',
  },
  grid: [
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'RRRmRRRRRRmRRRRRRmRRRRRRmRRR',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmkkkkkmmmmmmmmkkkkkmmmmm',
    'RRRmRkeeekmRRRRRRmkeeekRmRRR',
    'rrrmrkeeekmrrrrrrmkeeekrmrrr',
    'rrrmrkkkkkmrrrrrrmkkkkkrmrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmkmmmmmmmmmmmkmmmmmmmm',
    'RRRmRRRkkkmRRRRRRkkkRRRRmRRR',
    'rrrmrrrrkkkkrkkrkkkrrrrrmrrr',
    'rrrmrrrrrrkkkkkkkmrrrrrrmrrr',
    'mmmmmmmmmmmmkmmkmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'RRRmRRRRRRmRRRRRRmRRRRRRmRRR',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
  ],
}

// Sleep debt with a crescent for a head and a night sky for a body.
export const NOX_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0a0a18',
    i: '#1e1b4b',
    d: '#141232',
    v: '#3730a3',
    m: '#f5f3ea',
    w: '#ffffff',
    e: '#312e81',
    k: '#090818',
  },
  grid: [
    '...............oooo.........',
    '.............oommmmo........',
    '............ommmmmo.........',
    '...........ommmmmo..........',
    '..........ommmmmo...........',
    '.........ommmmmmo...........',
    '.........ommmmmo............',
    '........ommmmmmo............',
    '........ommmmmmo............',
    '........ommmmmmo............',
    '........ommeeemo............',
    '........ommeeemmo...........',
    '.........ommmmmmo...........',
    '.........ommmmmmmo..........',
    '..........ommmmmmmo.........',
    '.......oooiiiiiiimmoo.......',
    '.....ooiivvvvvvvvviimo......',
    '....oiiivvvvvvvvvvviiio.....',
    '....oiiiiiiiiiiiiiiiiio.....',
    '....oiiiiiiiiiiiiiiiiio.....',
    '.....oiiiiddddddwiiiio......',
    '....oiiiwidddddddiiiiio.....',
    '....oiiiidddddwdddiiiio.....',
    '...oiiiiiddddddddwiiiwio....',
    '...oiiiiddddwddddddiiiio....',
    '..oiiiwidddddddddddiiiiio...',
    '.oiiiiiddwddddddddddiiiiio..',
    '.oiiwiidddddddddddddwiiiio..',
    'oiiiiidddddddddwdddddiiiiio.',
    'iiiiiidddddddddddddddiwiiiio',
  ],
}

// Wears your build and swings your numbers back at you.
export const MIRROR_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0d0b1a',
    s: '#8b8fa3',
    h: '#d6d9e8',
    d: '#494c5e',
    e: '#c084fc',
    g: '#a855f7',
    k: '#1b1a2b',
  },
  grid: [
    '...........ogggo............',
    '...........ogggo............',
    '..........ossssso...........',
    '.........ossssssso......ooo.',
    '........ohhhhhhhhho....ohsho',
    '.......ossssssssssso...ohsho',
    '......ossssssssssssso..ohsho',
    '......ossssssssssssso..ohsho',
    '......ossssssssssssso..ohsho',
    '......okkkkkkkkkkkkko..ohsho',
    '......okeeeeeeeeeeeko..ohsho',
    '......okkgggggggggkko..ohsho',
    '......okkkkkkkkkkkkko..ohsho',
    '...oooosssssssssssssoooohsho',
    '.oossssssssssssssssssssshsho',
    'ossssssssssssssssssssssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'osssssshddhhddhhddhhssssssss',
    '.oosssshddhhddhhddhhssssssss',
    '...oooohddhhddhhddhhoooohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '.......odddddoodddddo...ooo.',
    '.......odddddoodddddo.......',
    '.......odddddoodddddo.......',
    '.......odddddoodddddo.......',
  ],
}

// The coil that takes back every week you skip.
export const BACKSLIDE_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#100a1a',
    v: '#3b1f5c',
    g: '#5f3390',
    d: '#241239',
    l: '#a855f7',
    e: '#f43f5e',
    t: '#f0e9cf',
    r: '#fb7185',
    k: '#0b0612',
  },
  grid: [
    '............................',
    '..........ooooooo...........',
    '........oovvvvvvvoo.........',
    '......oovvgggggggvvoo.......',
    '.....odvvvvvvvvvvvvvdo......',
    '...oodvvveeevvveeevvvdoo....',
    '..odddvvveeevvveeevvvdddo...',
    '..odddvvvvvvvvvvvvvvvdddo...',
    '.odddddvvvvvvvvvvvvvdddddo..',
    '.oddddddvvvvvvvvvvvddddddo..',
    '.oddddddddttvvvttvvddddddo..',
    '..odddddddttvrvttvvvddddo...',
    '..oddddddddvvrvvvvvvddddo...',
    '...ooddddddvvrvvvvvvddoo....',
    '.....odddddvrvrvvvvvdo......',
    '......oooolvvvvvvvvvvooo....',
    '.........olvvvvvvvvvvvvvoo..',
    '........olvvvvvvvvvvvvvvvvo.',
    '.......ovlvvvvvvvvvvvgvvvvvo',
    '......ovlvvvvvvvvvvvvggggvvv',
    '......ovvgvvvvvvvvvvvgggggvv',
    '....ooovvvgggggggggggggggvvv',
    '..oovvvvvvvvvgggggggggvvvvvo',
    '.ovvvvdddddddddddddddddddvo.',
    'ovvvvdddddddddddddddddddoo..',
    'vvvgggggggggggggggggvvvo....',
    'vvgggggggggggggggggggvvo....',
    'vvvgggggggggggggggggvvvo....',
    'ovvvvvgggggggggggvvvvvo.....',
    '.ovvvvvvvvvvvvvvvvvvvo......',
  ],
}

// You, finished. The last thing in the game is the thing on the box.
export const LVL100_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a1206',
    a: '#fbbf24',
    A: '#fde68a',
    g: '#d4a017',
    h: '#f7d774',
    d: '#8a6510',
    w: '#ffffff',
    c: '#7c2d12',
  },
  grid: [
    '...........ooooo......a.....',
    '....A.....ogggggo...........',
    '.........ogaaaaago.......A..',
    '.a......ogggggggggo.........',
    '.......ogggggggggggo........',
    '.......ogggggggggggo.......a',
    'a......oggwwgggwwggo........',
    '.......ogggggggggggo........',
    '....ooooggdddddddggoooo.....',
    '...occcccgdddddddgccccco..A.',
    '.A.ogggggcgggggggcgggggo....',
    '..ogggggggggggggggggggggo...',
    '.oggggggggghhhhhgggggggggo..',
    '.ogggggggghhhhhhhggggggggo.a',
    'aoggggggghhhhhhhhhgggggggo..',
    '..ogggggghhhhhhhhhggggggo...',
    '.ocgggggghhhhhhhhhggggggco..',
    '.ocggggcgghhhhhhhggcggggcoA.',
    '.Acggggcggghhhhhgggcggggco..',
    '.ocggggcgggggggggggcggggco..',
    '.ocggggcgggggggggggcggggco..',
    'occggggcdddddddddddcggggccoa',
    'accggggcdddddddddddcggggcco.',
    'occcccccgggggdgggggccccccco.',
    'occcccccgggggdgggggccccccco.',
    'ccccccccgggggdgggggccccccaco',
    'ccacccccgggggdgggggcccccccco',
    'ccccccccgggggdgggggcccccccco',
    'ccccccccgggggdgggggcccccacco',
    'ccccAcccgggggdgggggcccccccco',
  ],
}

// Act I's boss, imported from art/warden.png. Sampled on the 8x grid it was
// drawn on, at 96x96 — the source carries more detail than the game's usual
// density and losing it made the crown and hammer read as mush.
export const GOLEM_SPRITE = {
  w: 96,
  h: 96,
  palette: {
    a: '#2e2830',
    b: '#343038',
    c: '#595356',
    d: '#211e24',
    e: '#26232b',
    f: '#0c080b',
    g: '#3b373e',
    h: '#121014',
    i: '#564f53',
    j: '#423e44',
    k: '#615a5d',
    l: '#958b89',
    m: '#807777',
    n: '#971719',
    p: '#5b151a',
    q: '#4b454a',
    r: '#1e1418',
    s: '#514b50',
    t: '#6f6768',
    u: '#e11614',
  },
  grid: [
    '................................................................................................',
    '................................................l...............................................',
    '................................................t...la..........................................',
    '...........................................kb..hsj..bg.i........................................',
    '...........................................mc.lmsabjjb.g........................................',
    '...........................................tckcmsbjjbbba........................................',
    '...........................................isksdedbddhhe........................................',
    '...........................................bbmtrasqqgapr........................................',
    '............................................crmkciqq..pn........................................',
    '............................................ffflfafpffd.........................................',
    '............................................jrlf.fuupfe.........................................',
    '............................................rpuf.fppqbe.........................................',
    '............................................hct...mkgreh........................................',
    '............................................eki...isdbee.......rt...............................',
    '.....................................f......cji...iqgbee......tlg...............................',
    '.....................................mb.....cic...tqdbee.....qlcba..............................',
    '....................................rmbe....cci...tqrbd.fa...lkbbbp.......ma....................',
    '...................................llcee.dsaelc...kqhb.agdbbmlcaah.f....elsr....................',
    '.............................l.....lcbe..ka..ti...k...tsfqb.mcbbhjkctt..mkb.....................',
    '.............................lk..ldlcb.dlamf........fisrck.jmcgascddfqtkagp.....................',
    '.............................acbljflibalqjmfssssssslikqkm..ligesllccqfgqqap.....................',
    '.............................rhlmtgtc.tklmlillllllhlmmmmb..lcfdttcccgghqqf......................',
    '..............................mtkjjmi.tlkckfffffffhcisqqee.lj.icccccggggqb......................',
    '.............................tkmsjjdk.tcccbdddudddhkcqqhhb.lgbicccccgggdbbp.....................',
    '............................rkkijgjfd.mmcc.ddduddddkisiagb.rdrhiccccggghbbp.....................',
    '............................fbicgjamt.gmichdduuuddddccdcjb.hmtsishhhhbbhbaa.....................',
    '............................kaqjghlic.sgmcdduddpudddc.jisb.hr.c.mlllmhfrhapn....................',
    '............................kajhhtf.k.qclcfndduddpdkc.iiba.trqdfsqqjjbbbqjfn....................',
    '............................ftttsc..k.qkkcfudduududrc.cibb.tbac.fnnnnpnnbbbb....................',
    '...........................stjnnpdscd.qifcdddduddudrc.iiba..db..........pnae....................',
    '...........................jnf........scschduddduddrc.jbbe......ebgbgaef..pp....................',
    '...........................n....beeeh.bbichdduuuddddcebbbee....ebrkccgee..ff....................',
    '.............................n.fgjhee..bfqdddduddddri.eeeeee...bcfmiccfbr.......................',
    '...............................misdbeh..tk.ddduddd.rg...deedrp.jckfmicgbp.......................',
    '..............................rmcksbee..bkjdddudddqig.ed..rpn..hccrmcibaa.......................',
    '..............................gicfcbade.fkcdddpdddkib.eehefff...qifkmlqba.......................',
    '.............................fmtksiaaep.bkbfdddddfggg.edfpp.....gcaba.er........................',
    '.............................fga.ajaedn.f..fdddddd.....hen......jae.ddh..ll.....................',
    '...............................hh.aaen...he.......fd.hh..........r..dad.lkgbh...................',
    '..............................hedh.fpn......lllll....ddhr...........e.b.mtgab...................',
    '...........................mlmb.hdd.p....mj.tajki.tth...............qlllmtqbbp..................',
    '...........................lccdmm.fp....aej.gkiqq.b.q.gahaaf.......mkkkchqgbbp..................',
    '..........................lmckhkcgd....jdtj.tgibc.ehr.bg.ean......cckekchqqbbp..................',
    '..........................lccdseegap...a.hr.kshci..t..bd..........secmmchqqabp..................',
    '..........................mccjibbdepn..b.kj.fcsjf.aqa...hlgq......bbccmchqqbbp..................',
    '..........................lircibbefn...c.rf.qrqqj.a.b.ddriaa......dgcccchqgbbr..................',
    '..........................tchibbaee...kf.kg.jn.pc.etj.eehmcaa......bdcccbjgbb...................',
    '.........................tccccbaeep...sf.mc.jndni..td.dehtiaap.....ajccchejab...................',
    '.........................khfhqbadpr..ri..hj.jndni..q...ertiaap......jgccgjbbb...................',
    '........................dlllqqhdep...ts..mg.jndns.bcq..fediiba......jmrrmchfe...................',
    '........................tkktqgbeap...th..kf.jndns.a.b.ehdrscaap....akmcccgjab...................',
    '........................j.....bap...rs.h.mb.jndns.etg.eahdbcaap....tic.....bap..................',
    '..........................tja...p...kg.b.hh.jndns..f..ajfd.sjaap...j...lgad..n..................',
    '.........................miae.......s.fb.kj.jndni.hib.aqadhfjbdp......lcjgge....................',
    '........................tcca..r.....j.hj.rf.gndni.a.b.aqsedr.baf...lk.ctjggaa...................',
    '........................tihk..fh...qh.qj.kb.indns.erj.ajsieehhbp..mms.kijggaa...................',
    '........................jrciqhbe...g.ssd.hc.gndnc..tf.aasshed..p..tga.hfjggaa...................',
    '........................r.qqgfed.....qse.hh.gndnc..i..abss.dde...rbe..mtfggaa...................',
    '.........................d..gfed.....ss..mr.jndni.mdg.aaiiqdddp..mb...mqgga.a...................',
    '..........................rr.frp.....bb..rf.indni.t.a.eaqggfddp..qb..dg.gbbar...................',
    '..........................ca.ef..........cg.bidni.dgj.eafff..ep..aa..lbf.faaa...................',
    '.........................gea.a....emmmmh.hh.gsnsj..f..efllllj.p.....abbhafh.p...................',
    '..................tlk....ma.......lcccqafkh..iis...ca..ktcccbb.p...gkbbbadar....................',
    '.................lktb...mge.......lcccqafhf..cic..bhs.ecccccba.....gadfapafa....................',
    '................mllea...aa........ccccaafcg...id..krb.jctcccba.gn.....apapff....................',
    '................aaaaa..ka.........cbgbaafmb...r....mj.jikbgsaa.app..............................',
    '................haapa..ae.........kbgbaa.hj........k..ebsbbban.ban..............................',
    '.................eeehclf..........ggbbah.kg.df..h..jj..abbbbbf.abp..............................',
    '.....................klah..........iggb.edf.ep.hh.k.b...hbbbn.gebp..............................',
    '................kcscl.aaa..............hdkb.ed.hh..gg.hb......baea..............................',
    '................i.cclbaab..........mmmfbbrchee.hd..sa.hbmhfbbgrbaap.............................',
    '...............llc.maa.aaf........rtiiggbfheee.dd..b..bbcthjcgbbben.............................',
    '...............sigkmaaafaa........riccggbeeeee.dd..kb.fbicjcckhbbaef............................',
    '.............hhrbdtbaaa.aaa.......tcccgbbeaeep.de...a..bcijcccabbae.............................',
    '.............mkddttaaaaafaaf......mccghgeaaeef.dd..jb..fbcafccifbbn.............................',
    '.............tiscmaaaaaa.aau.....fmicg.beaeef..dd..bf...bjcfcccbbbn.............................',
    '...........sllmedlaanuaanhn......riiib.beaed...dd.......bbchiicgbbn.............................',
    '..........flkkmflaaaunaan........hsiigbbeadn...r.........bcjiiihhban............................',
    '..........lmmlaamaanunap.........ffff.haeeen.............bsggggbfban............................',
    '..........daaaa.faaauaau.........mlkqgbeeep..............fbkf....han............................',
    '...........feega.paaaau.........mcccjgbedep..............fbglmtlggeaf...........................',
    '...........discadnaaaeu........ekcddgbbaadn..............bhmkcicggghp...........................',
    '...........ammjae.paan.........f......faer................tckddsbbbbn...........................',
    '............eeeaeafan...........ssqjbh..aadn.............rsk.......ban..........................',
    '.............eeeae.an..........tiiqgbbe..ren.............jg.fhhhhf..an..........................',
    '.............heeeprd...........ecehgbgee..hn.............q.emlccicb.............................',
    '..............aeen...........llclkjfgeee...................itkccccbbf.r.........................',
    '............................rkccgggbfeee.eep..............hcmkkiicbbppd.........................',
    '...........................hrrrrdjbaafdhfrepf.............hqrdrrdrfban..........................',
    '...........................tccccthbaefdfeeeen............gfmlccccqg.anr.........................',
    '...........................cccccgbfdee.feefen............betkcccccgbfnd.........................',
    '..........................kqqqqqaeeeee.de.fe..............ccjjjjggbbe.ef........................',
    '..........................kbggggaeedea..................h.qtjgggggpee.ep........................',
    '........................................................h.jkbaaaaapee.ep........................',
    '..........................................................jaaaaaaapa............................',
    '................................................................................................',
  ],
}

export const CAMPAIGN_SPRITES = { golem: GOLEM_SPRITE, wraith: WRAITH_SPRITE, doomscroll: DOOMSCROLL_SPRITE, ironjaw: IRONJAW_SPRITE, wall: WALL_SPRITE, nox: NOX_SPRITE, mirror: MIRROR_SPRITE, backslide: BACKSLIDE_SPRITE, lvl100: LVL100_SPRITE }

export const BOSS_SPRITES = { 'couch-titan': BOSS_SPRITE, ogre: OGRE_SPRITE }

// --------------------------------------------------------------------- AVATARS
// Compact 12x12 heads used for friends, leaderboard rows and feed posts. Two
// silhouettes x recolourable skin/hair keeps the roster varied without art debt.


// ------------------------------------------------------------------ THE HERO
// A full-body 16x24 character for the loadout screen. The 12x12 avatar is a
// head-and-shoulders bust — fine in a list row, but it crops to a face at the
// size the paper doll needs, so the hero gets its own taller sprite.
// The base character, transcribed from art/hero.png. The source is a
// soft-edged render rather than a true pixel export, so it was reconstructed:
// quantised to a small palette, then sampled by dominant colour per cell, which
// keeps the edges hard instead of muddy. See tools/png2grid.py.
const HERO_GRID = [
  '................oooooooo....................',
  '................ohhhhjjJoo.ooo..............',
  '................ohhhhjhJoo.ooo..............',
  '........oooooooooooHjhjhhHoojjo.............',
  '.........ohhhhhhhhhhhhhhhhhojjooooo.........',
  '.........oooHhhhhhhhhhhhjhhjHHHhhoo.........',
  '..........oohhjhhhhhhhhhJjhjHHohjJooo.......',
  '.........oojhjHhhjjhhJJHHJjjjjJhhjjjjo......',
  '.......oohhhjHhhhjjhhjJJhjhhhhhjhhooo.......',
  '......oJhhhjHJhhhjjhjHHhhjhhhjhhjJooo.......',
  '.......oooooJhhhhhhhHJJhhhjhHhhjhhjoo.......',
  '.........oHHhhHjjjhjHhhhhhhHohhhhjhoo.......',
  '........oJHhhHHjjjjHohhjjhJoohhhhHJJJo......',
  '........oJJJHHHHjjHoohhjHHodojjHjHoHHo......',
  '........oJJHHHHHJHodoJJHHoSdooHHHHHooo......',
  '.......oHHHoHHooooSSoHHooSSSSSoHHoHoo.......',
  '......ooJHHoHHSossSSSHHoSSSSSSSHHoHoo.......',
  '......ooooooHoSSssssSoodSssssSSoHoooo.......',
  '..........ooHoSssoossSSsssoosssoHoo.........',
  '.........ossoosssoosssssssoosssooso.........',
  '.........ooSdhsssoosssssssoosssddSo.........',
  '.........ooSdhsssoosssssssoosssddSo.........',
  '..........oodoSsssssssssssssssSooo..........',
  '...........oooSsssssssssssssssSooo..........',
  '.............oodsssssssssssSdooo............',
  '...............oodsssssssssdoo..............',
  '..............ooooooDDDDDoooooo.............',
  '..............ooooooDDDDDoooooo.............',
  '.............oBAbbodddddddobbbbo............',
  '............obaaaaAoSsssoAAaaaaAo...........',
  '............oaaaaaaAosSoAAaaaaaabo..........',
  '..........ooAaabaaaaADDoaaaaAbaabo..........',
  '.........ooBaaABaaaaAAoAaaaaBAAaabo.........',
  '.........oAAaaboaaaaaaBAaaaaabbaaAo.........',
  '.........oooBABoaaaaaaaaaaaaoBbAooo.........',
  '..........oodABoaaaaaaaaaaaaooBAdo..........',
  '..........oodoooAAaaaaaaaaaAoooodo..........',
  '.........oSSSSoBAAAaaaaaaaAABooSSSo.........',
  '.........osssdooBBbbAAAAAbbBBooSsso.........',
  '.........osssoooootBAAAAAbbTToossso.........',
  '........oSsssooUuttoooooooooTooossSoo.......',
  '........ossssoooooobAAAAAAAABbooSssoo.......',
  '........ossssoouottoaAAAAAaAbbossssoo.......',
  '........ossDsooooDbooaaaaaAoooossDsoo.......',
  '........oddSooooTooooTooooooTToooSdoo.......',
  '.........ooo..oTuooUUUUUTTuuUUo.ooo.........',
  '..............oUtutuToooTttttuo.............',
  '..............outtttToooTttttto.............',
  '.............oTttttuToooTtttuuoo............',
  '.............oUttutuTo.oTtttuTTo............',
  '.............oUtUUuTTo.oTTtuuUTo............',
  '..............ottoTUoo.ooTTUooTo............',
  '..............ooddoUoo.ooTTodoo.............',
  '...............oSSSo....oooSdoo.............',
  '...............osSSo.....oSSdoo.............',
  '..............osssSdo...odSssso.............',
  '.............osssssdo...odssssso............',
  '............oSSdssSo.....odsdSSSo...........',
  '............ooooooo.......ooooooo...........',
]


// ------------------------------------------------------- GEAR WORN ON THE HERO
// Same 16x24 frame as the hero, mostly transparent, so each piece lines up with
// the body when stacked on top. 'A' takes the item's rarity colour at render
// time — that is what makes a legendary visibly legendary on the character.
/**
 * Worn armour shares the body's frame so stacking lines it up exactly, and it
 * carries the set's own palette rather than a flat rarity tint — putting plate
 * on turns the character into a knight instead of colouring him in.
 */
/**
 * An overlay in the hero's frame, at whatever resolution it was authored.
 *
 * The generated armour is drawn at twice the character's logical pitch, so its
 * rows are twice as wide; the hand-drawn overlays that predate that — the
 * founder's plate, the weapons — are still at one. Both are accepted: the size
 * comes off the rows rather than off the body, and the upscaler brings the
 * coarser ones up on the way to the screen, so everything composites at the
 * same width and lines up.
 */
const worn = (rows) => {
  const w = Object.values(rows)[0].length
  const h = (HERO_GRID.length * w) / HERO_GRID[0].length
  const grid = Array.from({ length: h }, () => '.'.repeat(w))
  for (const [y, cells] of Object.entries(rows)) grid[y] = cells
  return { w, h, grid }
}

/**
 * What the armour looks like on the body, at four levels of ambition.
 *
 * Five sets used to share one silhouette and differ only by palette, so leather
 * and legendary were the same knight in two colours — a whole campaign of
 * grinding with nothing to see at the end of it. The shape escalates now, and
 * the shape is what reads first: a cap and soft pads, then a full harness, then
 * horns and raked spikes, and finally a crowned helm sealed over the face with
 * light where the eyes were.
 *
 * Only the top set takes the face away, and that is the point of it.
 */
export const WORN_MALE = {
  rough: {
    helm: worn({ 11: '...............................oooooooooooooooooooooooooooo.............................', 12: '..............................oollllllllllllllllllllllllldoo............................', 13: '.............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmdoo...........................', 14: '............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 15: '...........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo.........................', 16: '...........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 17: '..........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 18: '..........................olmmllllllllmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 19: '.........................oolmmllllllllmmmmmmmmmmmmmmmmmmmmmmmmdoo.......................', 20: '.........................olmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 21: '........................oolmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmmdoo......................', 22: '........................olmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmdo......................', 23: '........................olmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmdo......................', 24: '........................olmmmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmdo......................', 25: '.......................oolmmmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmdoo.....................', 26: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 27: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 28: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 29: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 30: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 31: '.....................ooolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdooo...................', 32: '.....................ollssssssssssssssssssssssssssssssssssssssssssldo...................', 33: '.....................olmssssssssssssssssssssssssssssssssssssssssssmdo...................', 34: '.....................oddddddddddddddddddddddddddddddddddddddddddddddo...................', 35: '.....................ossssddssssssddssssssddssssssddssssssddsssssssso...................', 36: '.....................oooooooooooooooooooooooooooooooooooooooooooooooo...................' }),
    chest: worn({ 57: '................oooooooooo.oooooooooooooooooooooooooooooooooooo.oooooooooo..............', 58: '...............oollllllldooollllllllllllllllllllllllllllllllldooollllllldoo.............', 59: '.............ooolmmmmmmmmdooommmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmooolmmmmmmmmdooo...........', 60: '............oollmmmmmmmmmmldoossssssssssssssssssssssssssssssoollmmmmmmmmmmldoo..........', 61: '...........oolmmmmmmmmmmmmmmdoossssssssssssssssssssssssssssoolmmmmmmmmmmmmmmdoo.........', 62: '..........oolmmmmmmmmmmmmmmmmdoommmmmmmmmmmmmmmmmmmmmmmmmmoolmmmmmmmmmmmmmmmmdoo........', 63: '.........oolmmmmmmmmmmmmmmmmmmdoommmmmmmmmmmmmmmmmmmmmmmmoolmmmmmmmmmmmmmmmmmmdoo.......', 64: '.........olmmmmmmmmmmmmmmmmmmmmdommmmmmmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.......', 65: '.........olmmmmmmmmmmmmmmmmmmmmdommmmmmmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.......', 66: '.........olmmmssssssssssssssmmmdommmmmddmmmmssmmmmddmmmmmolmmmssssssssssssssmmmdo.......', 67: '.........odmmmssssssssssssssmmmdommmmmddmmmmssmmmmddmmmmmodmmmssssssssssssssmmmdo.......', 68: '.........osdmmmmmmmmmmmmmmmmmmdsommmmmmmmmmmssmmmmmmmmmmmosdmmmmmmmmmmmmmmmmmmdso.......', 69: '.........oosdmmmmmmmmmmmmmmmmdsoommmmmmmmmmmssmmmmmmmmmmmoosdmmmmmmmmmmmmmmmmdsoo.......', 70: '..........oosdmmmmmmmmmmmmmmdsoommmmmmmmmmmmmmmmmmmmmmmmmmoosdmmmmmmmmmmmmmmdsoo........', 71: '...........oosddmmmmmmmmmmddsoommmmmmmmmmmmmmmmmmmmmmmmmmmmoosddmmmmmmmmmmddsoo.........', 72: '............oossdmmmmmmmmdssoommmmmmmmddmmmmssmmmmddmmmmmmmmoossdmmmmmmmmdssoo..........', 73: '.............ooosddmmmmddsooodmmmmmmmmddmmmmssmmmmddmmmmmmmmdooosddmmmmddsooo...........', 74: '...............oossddddssoo.osmmmmmmmmmmmmmmssmmmmmmmmmmmmmmso.oossddddssoo.............', 75: '................ooossssooo..oolmmmmmmmmmmmmmssmmmmmmmmmmmmmdoo..ooossssooo..............', 76: '..................oooooo.....olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....oooooo................', 77: '.............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo...........................', 78: '.............................ossssssssssssllllllsssssssssssso...........................', 79: '.............................ossssssssssssllllllsssssssssssso...........................', 80: '.............................oddddddddddddllllllddddddddddddo...........................', 81: '.............................oddddddddddddllllllddddddddddddo...........................', 82: '.............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo...........................', 83: '............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 84: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 85: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 86: '...........................oolssssssssssssssssssssssssssssssdoo.........................', 87: '...........................olmssssssssssssssssssssssssssssssmdo.........................', 88: '...........................oddddddddddddddddddddddddddddddddddo.........................', 89: '...........................osssssssssssssssssssssssssssssssssso.........................', 90: '...........................oooooooooooooooooooooooooooooooooooo.........................' }),
    legs: worn({ 91: '.........................oooooooooooooooooooooooooooooooooooooooo.......................', 92: '.........................osdlllllllllllllldsoosdlllllllllllllldso.......................', 93: '.........................oosmmmmmmmmmmmmmmsoooosmmmmmmmmmmmmmmsoo.......................', 94: '..........................oossssssssssssssoo..oossssssssssssssoo........................', 95: '..........................oossssssssssssssoo..oossssssssssssssoo........................', 96: '.........................oolmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmdoo.......................', 97: '.........................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 98: '.........................odmmmmmmmmmmmmmmmmdoodmmmmmmmmmmmmmmmmdo.......................', 99: '.........................osddmmmmmmmmmmmmddsoosddmmmmmmmmmmmmddso.......................', 100: '.........................oossmmmmmmmmmmmmssoooossmmmmmmmmmmmmssoo.......................', 101: '..........................ooolmmmmmmmmmmdooo..ooolmmmmmmmmmmdooo........................', 102: '...........................olmssssssssssmdo....olmssssssssssmdo.........................', 103: '...........................olmssssssssssmdo....olmssssssssssmdo.........................', 104: '...........................oddddddddddddddo....oddddddddddddddo.........................', 105: '...........................osssssssssssssso....osssssssssssssso.........................', 106: '...........................oooooooooooooooo....oooooooooooooooo.........................' }),
    gloves: worn({ 77: '.................oooooooooooo................................oooooooooooo...............', 78: '................oollllllllldoo..............................oollllllllldoo..............', 79: '................olmmmmmmmmmmdo..............................olmmmmmmmmmmdo..............', 80: '...............oolmmmmmmmmmmdoo............................oolmmmmmmmmmmdoo.............', 81: '..............oolmmmmmmmmmmmmdoo..........................oolmmmmmmmmmmmmdoo............', 82: '..............olssssssssssssssdo..........................olssssssssssssssdo............', 83: '.............oolssssssssssssssdoo........................oolssssssssssssssdoo...........', 84: '.............oddmmmmmmmmmmmmmmddo........................oddmmmmmmmmmmmmmmddo...........', 85: '.............ossmmmmmmmmmmmmmmsso........................ossmmmmmmmmmmmmmmsso...........', 86: '.............ooodmmmmmmmmmmmmdooo........................ooodmmmmmmmmmmmmdooo...........', 87: '...............osdmmmmmmmmmmdso............................osdmmmmmmmmmmdso.............', 88: '...............oosmmmmmmmmmmsoo............................oosmmmmmmmmmmsoo.............', 89: '................oolmmmmmmmmdoo..............................oolmmmmmmmmdoo..............', 90: '.................oddddddddddo................................oddddddddddo...............', 91: '.................osssssssssso................................osssssssssso...............', 92: '.................oooooooooooo................................oooooooooooo...............' }),
    boots: worn({ 107: '...........................oooooooooooooo........oooooooooooooo.........................', 108: '..........................oollllllllllldoo......oollllllllllldoo........................', 109: '.........................oolmmmmmmmmmmmmdoo....oolmmmmmmmmmmmmdoo.......................', 110: '.........................olmssssssssssssmdo....olmssssssssssssmdo.......................', 111: '.........................olmssssssssssssmdo....olmssssssssssssmdo.......................', 112: '........................oolmmmmmmmmmmmmmmdoo..oolmmmmmmmmmmmmmmdoo......................', 113: '.......................oolmmmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmmmdoo.....................', 114: '.......................olmmmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmmmdo.....................', 115: '.......................olmmmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmmmdo.....................', 116: '.......................oddssssssssssssssssddooddssssssssssssssssddo.....................', 117: '.......................ossssssssssssssssssssoosssssssssssssssssssso.....................' }),
    shield: worn({ 56: '...............oooooooooooo.............................................................', 57: '.............ooollllllllldooo...........................................................', 58: '............oollmmmmmmmmmmldoo..........................................................', 59: '...........oolmmmmmmmmmmmmmmdoo.........................................................', 60: '..........oolmmmmmmmmmmmmmmmmdoo........................................................', 61: '..........olmmmmmmmmmmmmmmmmmmdo........................................................', 62: '.........oolmmmmmmmmmmmmmmmmmmdoo.......................................................', 63: '.........olmmmmmmmmmmmmmmmmmmmmdo.......................................................', 64: '........oolmmmmmmmmmmmmmmmmmmmmdoo......................................................', 65: '........olmmmmmmmmmmmmmmmmmmmmmmdo......................................................', 66: '........olmmmmmmmmmmmmmmmmmmmmmmdo......................................................', 67: '.......oolmmmmmmmmmmmmmmmmmmmmmmdoo.....................................................', 68: '.......olmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 69: '.......olmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 70: '.......olmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 71: '.......olmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 72: '.......olmmmssssssllddllssssssmmmdo.....................................................', 73: '.......olmmmssssssllddllssssssmmmdo.....................................................', 74: '.......olmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 75: '.......odmmmmmmmmmllllllmmmmmmmmmdo.....................................................', 76: '.......osmmmmmmmmmllllllmmmmmmmmmso.....................................................', 77: '.......oolmmmmmmmmllllllmmmmmmmmdoo.....................................................', 78: '........odmmmmmmmmmmmmmmmmmmmmmmdo......................................................', 79: '........osmmmmmmmmmmmmmmmmmmmmmmso......................................................', 80: '........oodmmmmmmmmmmmmmmmmmmmmdoo......................................................', 81: '.........osmmmmmmmmmmmmmmmmmmmmso.......................................................', 82: '.........oodmmmmmmmmmmmmmmmmmmdoo.......................................................', 83: '..........osdmmmmmmmmmmmmmmmmdso........................................................', 84: '..........oosdmmmmmmmmmmmmmmdsoo........................................................', 85: '...........oosddmmmmmmmmmmddsoo.........................................................', 86: '............oossddddddddddssoo..........................................................', 87: '.............ooossssssssssooo...........................................................', 88: '...............oooooooooooo.............................................................' }),
  },
  plate: {
    helm: worn({ 7: '.........................................oooooooo.......................................', 8: '.........................................ollllldo.......................................', 9: '........................................oolmmmmdoo......................................', 10: '.......................................oolmmmmmmdoo.....................................', 11: '.....................................ooolmmmmmmmmdooo...................................', 12: '..................................oooololmmmmmmmmdodoooo................................', 13: '................................ooollloolmmmmmmmmdoolldooo..............................', 14: '...............................oollmmoolmmmmmmmmmmdoommldoo.............................', 15: '..............................oolmmmmolmmmmmmmmmmmmdommmmdoo............................', 16: '............................ooolllmmmoddddddddddddddommmmmdooo..........................', 17: '............................olllllmmmossssssssssssssommmmmmldo..........................', 18: '...........................oolllllllmoooooooooooooooommmmmmmdoo.........................', 19: '..........................oollllllllmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 20: '.........................oolmmllllllllmmmmmmmmmmmmmmmmmmmmmmmmdoo.......................', 21: '.........................olmmmllllllllmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 22: '........................oolmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmmdoo......................', 23: '........................olmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmmmdo......................', 24: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo......................', 25: '.......................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo.....................', 26: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 27: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 28: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 29: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 30: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 31: '.....................ooolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdooo...................', 32: '.....................ollssssssssssssssssssssssssssssssssssssssssssldo...................', 33: '.....................olmssssssssssssssssssssssssssssssssssssssssssmdo...................', 34: '.....................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...................', 35: '...................ooolmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdooo.................', 36: '...................oslmmmmmmmmmdoooooooooolmllddoooooooooolmmmmmmmmmlso.................', 37: '...................oodmmmmmmmmmdo........olmllddo........olmmmmmmmmmdoo.................', 38: '....................osmmmmmmmmmdo........olmllddo........olmmmmmmmmmso..................', 39: '....................oodmmmmmmmmdo........olmllddo........olmmmmmmmmdoo..................', 40: '.....................osmmmmmmmmdo........olmllddo........olmmmmmmmmso...................', 41: '.....................oodmmmmmmmdo........olmllddo........olmmmmmmmdoo...................', 42: '......................osdmmmmmmdo........olmllddo........olmmmmmmdso....................', 43: '......................oosmmmmmmdoooooooooolmllddoooooooooolmmmmmmsoo....................', 44: '.......................oodmmddddddddddddddddddddddddddddddddddmmdoo.....................', 45: '........................osmmddddddddddddddddddddddddddddddddddmmso......................', 46: '........................oodmmmllllllllllllllllllllllllllllllmmmdoo......................', 47: '.........................osmmmllllllllllllllllllllllllllllllmmmso.......................', 48: '.........................oodmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmdoo.......................', 49: '..........................osmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmso........................', 50: '..........................ooddddddddAAAAAAAAAAAAAAAAAAddddddddoo........................', 51: '...........................ossssssssAAAAAAAAAAAAAAAAAAsssssssso.........................', 52: '...........................oooooooooosddmmmmmmmmmmddsoooooooooo.........................', 53: '....................................oossmmmmmmmmmmssoo..................................', 54: '.....................................ooossssssssssooo...................................', 55: '.......................................osssssssssso.....................................', 56: '.......................................oooooooooooo.....................................' }),
    chest: worn({ 57: '............ooooooooooooooooooooooooo................ooooooooooooooooooooooooo..........', 58: '...........oollllllllllllllldoolllAAo................oAAllloollllllllllllllldoo.........', 59: '..........oolmmmmmmmmmmmmmmmmdoommAAooooo........oooooAAmmoolmmmmmmmmmmmmmmmmdoo........', 60: '..........olmmAAAAAAAAAAAAAAmmdommmmAAldo........ollAAmmmmolmmAAAAAAAAAAAAAAmmdo........', 61: '.........oolmmAAAAAAAAAAAAAAmmdoommmAAmdoooooooooolmAAmmmoolmmAAAAAAAAAAAAAAmmdoo.......', 62: '.........olmmmmmmmmmmmmmmmmmmmmdommmmmAAllldoollllAAmmmmmolmmmmmmmmmmmmmmmmmmmmdo.......', 63: '.........olmmmmmmmmmmmmmmmmmmmmdommmmmAAmmmdoolmmmAAmmmmmolmmmmmmmmmmmmmmmmmmmmdo.......', 64: '.........olmmmssssssssssssssmmmdommmmmmmAAmmllmmAAmmmmmmmolmmmssssssssssssssmmmdo.......', 65: '.........olmmmssssssssssssssmmmdommmmmmmAAmmmmmmAAmmmmmmmolmmmssssssssssssssmmmdo.......', 66: '.........odmmmllllllllllllllmmmdommmmmmmmmmmllddmmmmmmmmmodmmmllllllllllllllmmmdo.......', 67: '.........osmmmllllllllllllllmmmsommmmmmmmmmmllddmmmmmmmmmosmmmllllllllllllllmmmso.......', 68: '.........oolmmmmmmmmmmmmmmmmmmdooAmmmmmmmmmmllddmmmmmmmmAoolmmmmmmmmmmmmmmmmmmdoo.......', 69: '..........olmmmmmmmmmmmmmmmmmmdoAAmmmmmmmmmmllddmmmmmmmmAAolmmmmmmmmmmmmmmmmmmdo........', 70: '..........olmmssssssssssssssmmdommmmmmmmmmmmllddmmmmmmmmmmolmmssssssssssssssmmdo........', 71: '..........odmmssssssssssssssmmdommmmmmmmmmmmllddmmmmmmmmmmodmmssssssssssssssmmdo........', 72: '..........osmmllllllllllllllmmsoAAmmmmmmmmmmllddmmmmmmmmAAosmmllllllllllllllmmso........', 73: '..........oolmllllllllllllllmdooAAmmmmmmmmmmllddmmmmmmmmAAoolmllllllllllllllmdoo........', 74: '...........olmmmmmmmmmmmmmmmmdommmmmmmmmmmmmllddmmmmmmmmmmmolmmmmmmmmmmmmmmmmdo.........', 75: '...........olmmmmmmmmmmmmmmmmdommmmmmmmmmmmmllddmmmmmmmmmmmolmmmmmmmmmmmmmmmmdo.........', 76: '...........oddddddddddddddddddommmmmmmmmmmmmllddmmmmmmmmmmmoddddddddddddddddddo.........', 77: '...........ossssssssssssssssssommmmmmmmmmmmmllddmmmmmmmmmmmosssssssssssssssssso.........', 78: '...........oooooooooooooooooooommmmmmmmmmmmmllddmmmmmmmmmmmoooooooooooooooooooo.........', 79: '.............................olmmmmmmmmmmmmmllddmmmmmmmmmmmdo...........................', 80: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 81: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 82: '.............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo...........................', 83: '............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 84: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 85: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 86: '...........................oossssssssssssssssssssssssssssssssoo.........................', 87: '...........................osssssssssssssssssssssssssssssssssso.........................', 88: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 89: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 90: '...........................oooooooooooooooooooooooooooooooooooo.........................' }),
    legs: worn({ 91: '.........................oooooooooooooooooooooooooooooooooooooooo.......................', 92: '.........................osdAAAAAAAAAAAAAAdsoosdAAAAAAAAAAAAAAdso.......................', 93: '.........................oosAAAAAAAAAAAAAAsoooosAAAAAAAAAAAAAAsoo.......................', 94: '..........................oossssssssssssssoo..oossssssssssssssoo........................', 95: '........................ooolssssssssssssssdoooolssssssssssssssdooo......................', 96: '.......................oollmmmmmmmmmmmmmmmmoollmmmmmmmmmmmmmmmmldoo.....................', 97: '.......................olmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.....................', 98: '.......................odmmmmmmmmmmmmmmmmmmodmmmmmmmmmmmmmmmmmmmmdo.....................', 99: '.......................osddmmmmmmmmmmmmmmmmosddmmmmmmmmmmmmmmmmddso.....................', 100: '.......................oossdmmmmmmmmmmmmmmdoossdmmmmmmmmmmmmmmdssoo.....................', 101: '........................ooosmmmmmmmmmmmmmmsoooosmmmmmmmmmmmmmmsooo......................', 102: '..........................oolmAAAAAAAAAAmdoo..oolmAAAAAAAAAAmdoo........................', 103: '...........................olmAAAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 104: '...........................oddddddddddddddo....oddddddddddddddo.........................', 105: '...........................osssssssssssssso....osssssssssssssso.........................', 106: '...........................oooooooooooooooo....oooooooooooooooo.........................' }),
    gloves: worn({ 77: '.................oooooooooooo................................oooooooooooo...............', 78: '................ooAAAAAAAAAAoo..............................ooAAAAAAAAAAoo..............', 79: '................olAAAAAAAAAAdo..............................olAAAAAAAAAAdo..............', 80: '...............oolmmmmmmmmmmdoo............................oolmmmmmmmmmmdoo.............', 81: '..............oolmmmmmmmmmmmmdoo..........................oolmmmmmmmmmmmmdoo............', 82: '..............olmmmmmmmmmmmmmmdo..........................olmmmmmmmmmmmmmmdo............', 83: '.............oolmmmmmmmmmmmmmmdoo........................oolmmmmmmmmmmmmmmdoo...........', 84: '.............osssssssssssssssssso........................osssssssssssssssssso...........', 85: '.............osssssssssssssssssso........................osssssssssssssssssso...........', 86: '.............ooodmmmmmmmmmmmmdooo........................ooodmmmmmmmmmmmmdooo...........', 87: '...............osdmmmmmmmmmmdso............................osdmmmmmmmmmmdso.............', 88: '...............oosmmmmmmmmmmsoo............................oosmmmmmmmmmmsoo.............', 89: '................oolmmmmmmmmdoo..............................oolmmmmmmmmdoo..............', 90: '.................oddddddddddo................................oddddddddddo...............', 91: '.................osssssssssso................................osssssssssso...............', 92: '.................oooooooooooo................................oooooooooooo...............' }),
    boots: worn({ 107: '...........................oooooooooooooo........oooooooooooooo.........................', 108: '..........................ooAAAAAAAAAAAAoo......ooAAAAAAAAAAAAoo........................', 109: '.........................oolAAAAAAAAAAAAdoo....oolAAAAAAAAAAAAdoo.......................', 110: '.........................olmmmmmmmmmmmmmmdo....olmmmmmmmmmmmmmmdo.......................', 111: '.........................olmmmmmmmmmmmmmmdo....olmmmmmmmmmmmmmmdo.......................', 112: '........................oossssssssssssssssoo..oossssssssssssssssoo......................', 113: '.......................oolssssssssssssssssdoooolssssssssssssssssdoo.....................', 114: '.......................olmllllllllllllllllmdoolmllllllllllllllllmdo.....................', 115: '.......................olmllllllllllllllllmdoolmllllllllllllllllmdo.....................', 116: '.......................oddAAAAAAAAAAAAAAAAddooddAAAAAAAAAAAAAAAAddo.....................', 117: '.......................ossAAAAAAAAAAAAAAAAssoossAAAAAAAAAAAAAAAAsso.....................' }),
    shield: worn({ 55: '.......oooooooooooooooooooooooooooo.....................................................', 56: '.......ollAAAAAAAAAAAAAAAAAAAAAAldo.....................................................', 57: '.......olmAAAAAAAAAAAAAAAAAAAAAAmdo.....................................................', 58: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 59: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 60: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 61: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 62: '.......olmmmmmmmoooooooooommmmmmmdo.....................................................', 63: '.......olmmmmmmoollllllldoommmmmmdo.....................................................', 64: '.......olmmmmmoolmmmmmmmmdoommmmmdo.....................................................', 65: '.......olmmmmoolmmmmmmmmmmdoommmmdo.....................................................', 66: '.......olmmmmolmmmmmmmmmmmmdommmmdo.....................................................', 67: '.......olmmmmolmmmmmmmmmmmmdommmmdo.....................................................', 68: '.......olmmmmolmmmmmAAmmmmmdommmmdo.....................................................', 69: '.......olmmmmodmmmmmAAmmmmmdommmmdo.....................................................', 70: '.......olmmmmosdmmmmmmmmmmdsommmmdo.....................................................', 71: '.......olmmmmoosdmmmmmmmmdsoommmmdo.....................................................', 72: '.......olmmmmmoosddddddddsoommmmmdo.....................................................', 73: '.......olmmmmmmoossssssssoommmmmmdo.....................................................', 74: '.......olmmmmmmmoooooooooommmmmmmdo.....................................................', 75: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 76: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 77: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 78: '.......odmmmmmmmmmmmllddmmmmmmmmmdo.....................................................', 79: '.......osmmmmmmmmmmmllddmmmmmmmmmso.....................................................', 80: '.......oolmmmmmmmmmmllddmmmmmmmmdoo.....................................................', 81: '........odmmmmmmmmmmllddmmmmmmmmdo......................................................', 82: '........osmmmmmmmmmmllddmmmmmmmmso......................................................', 83: '........oodmmmmmmmmmllddmmmmmmmdoo......................................................', 84: '.........osdmmmmmmmmllddmmmmmmdso.......................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo.......................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo........................................................', 87: '...........oosddmmmmmmmmmmddsoo.........................................................', 88: '............oossdddmmmmdddssoo..........................................................', 89: '.............ooosssmmmmsssooo...........................................................', 90: '...............ooooddddoooo.............................................................', 91: '..................osssso................................................................', 92: '..................oooooo................................................................' }),
  },
  spiked: {
    helm: worn({ 2: '......oooo......................................................................oooo....', 3: '......osdoo....................................................................oolso....', 4: '......ooddoo..................................................................ooldoo....', 5: '.......osddoo............................oooooooo............................ooldso.....', 6: '.......oosmdooo..........................ollllldo..........................ooolmsoo.....', 7: '........oodmldoo........................oolmmmmdoo........................oollmdoo......', 8: '.........osmmmdoo.......................olmmmmmmdo.......................oolmmmso.......', 9: '.........oodmmmdoo.....................oolmmmmmmdoo.....................oolmmmdoo.......', 10: '..........osmmmmdoo....................olmmmmmmmmdo....................oolmmmmso........', 11: '..........oodmmmmdooo................ooolmmmmmmmmdooo................ooolmmmmdoo........', 12: '...........osmmmmmldoo............oooooolmmmmmmmmdoooooo............oollmmmmmso.........', 13: '...........oodmmmmmmdoo.........ooolllolmmmmmmmmmmdolldooo.........oolmmmmmmdoo.........', 14: '............osdmmmmmmdoo.......oollmmoolmmmmmmmmmmdoommldoo.......oolmmmmmmdso..........', 15: '............oosmmmmmmmdooo....oolmmmmolmmmmmmmmmmmmdommmmdoo....ooolmmmmmmmsoo..........', 16: '.............oodmmmmmmmldoo.ooolllmmmoddddddddddddddommmmmdooo.oollmmmmmmmdoo...........', 17: '..............osmmmmmmmmmdooolllllmmmossssssssssssssommmmmmldooolmmmmmmmmmso............', 18: '..............oodmmmmmmmmmdoolllllllmoooooooooooooooommmmmmmdoolmmmmmmmmmdoo............', 19: '...............osmmmmmmmmmmdllllllllmmmmmmmmmmmmmmmmmmmmmmmooolmmmmmmmmmmso.............', 20: '...............oodmmmmmmmmmmldllllllllmmmmmmmmmmmmmmmmmmmmoollmmmmmmmmmmdoo.............', 21: '................osddddddddddddllllllllmmmmmmmmmmmmmmmmmmmoodddddddddddddso..............', 22: '................oossssssssssssssllllllllmmmmmmmmmmmmmmmmmossssssssssssssoo..............', 23: '.................ooooooooooooooollllllllmmmmmmmmmmmmmmmmmoooooooooooooooo...............', 24: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo......................', 25: '.......................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo.....................', 26: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 27: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 28: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 29: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 30: '.......................olmmmmmmmmmmmmmmmmmmmAAmmmmmmmmmmmmmmmmmmmdo.....................', 31: '.....................ooolmmmmmmmmmmmmmmmmmmmAAmmmmmmmmmmmmmmmmmmmdooo...................', 32: '.....................ollssssssssssssssssssssssssssssssssssssssssssldo...................', 33: '.....................olmssssssssssssssssssssssssssssssssssssssssssmdo...................', 34: '.....................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...................', 35: '...................ooolmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdooo.................', 36: '...................oslmmmmmmmmmdoooooooooolmllddoooooooooolmmmmmmmmmlso.................', 37: '...................oodmmmmmmmmmdo........olmllddo........olmmmmmmmmmdoo.................', 38: '....................osmmmmmmmmmdo........olmllddo........olmmmmmmmmmso..................', 39: '....................oodmmmmmmmmdo........olmllddo........olmmmmmmmmdoo..................', 40: '.....................osmmmmmmmmdo........olmllddo........olmmmmmmmmso...................', 41: '.....................oodmmmmmmmdo........olmllddo........olmmmmmmmdoo...................', 42: '......................osdmmmmmmdo........olmllddo........olmmmmmmdso....................', 43: '......................oosmmmmmmdoooooooooolmllddoooooooooolmmmmmmsoo....................', 44: '.......................oodmmddddddddddddddddddddddddddddddddddmmdoo.....................', 45: '........................osmmddddddddddddddddddddddddddddddddddmmso......................', 46: '........................oodmmmllllllllllllllllllllllllllllllmmmdoo......................', 47: '.........................osmmmllllllllllllllllllllllllllllllmmmso.......................', 48: '.........................oodmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmdoo.......................', 49: '..........................osmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmso........................', 50: '..........................ooddddddddAAAAAAAAAAAAAAAAAAddddddddoo........................', 51: '...........................ossssssssAAAAAAAAAAAAAAAAAAsssssssso.........................', 52: '...........................oooooooooosddmmmmmmmmmmddsoooooooooo.........................', 53: '....................................oossmmmmmmmmmmssoo..................................', 54: '.....................................ooossssssssssooo...................................', 55: '.......................................osssssssssso.....................................', 56: '.......................................oooooooooooo.....................................' }),
    chest: worn({ 42: '......oooo......................................................................oooo....', 43: '......oldo......................................................................oldo....', 44: '.oooo.oldo......................................................................oldo.ooo', 45: '.osdoooldoo....................................................................ooldoools', 46: '.ooldoolmdoo..................................................................oolmdooldo', 47: '..oldoodmmdo..................................................................olmmdooldo', 48: '..odmdosmmdo..................................................................olmmsolmdo', 49: '..osmmdolmdoo................................................................oolmdolmmso', 50: '..oodmmlmmmdo................................................................olmmmlmmdoo', 51: '...osmmmmmmdoo..............................................................oolmmmmmmso.', 52: '.oooolmmmmmmdo..............................................................olmmmmmmdooo', 53: '.oddodmmmmmmdoo............................................................oolmmmmmmdold', 54: '.osdosmmmmmmmdo............................................................olmmmmmmmsols', 55: '.ooddolmmmmmmdoo..........................................................oolmmmmmmdoldo', 56: '..osmlmmmmmmmmdo..........................................................olmmmmmmmmlmso', 57: '..oodmmmmmmmmmdoooooooooooooooooooooo................oooooooooooooooooooooolmmmmmmmmmdoo', 58: '...osmmmmmmmmmmdollllllllllldoolllAAo................oAAllloollllllllllllolmmmmmmmmmmso.', 59: '...oodmmmmmmmmmdoommmmmmmmmmmdoommAAooooo........oooooAAmmoolmmmmmmmmmmmoodmmmmmmmmmdoo.', 60: '....osmmmmmmmmmssoAAAAAAAAAAmmdommmmAAldo........ollAAmmmmolmmAAAAAAAAAAossmmmmmmmmmso..', 61: '....oodmmmmmmmdoooAAAAAAAAAAmmdoommmAAmdoooooooooolmAAmmmoolmmAAAAAAAAAAooolmmmmmmmdoo..', 62: '.....osmmmmmmmmdommmmmmmmmmmmmmdommmmmAAloollldoolAAmmmmmolmmmmmmmmmmmmmmolmmmmmmmmso...', 63: '.....oodmmmmmmddoommmmmmmmmmmmmdommmmmAAoolmmmmdooAAmmmmmolmmmmmmmmmmmmmooddmmmmmmdoo...', 64: '......osmmmmmmsssossssssssssmmmdommmmmmmolmmmmmmdommmmmmmolmmmssssssssssosssmmmmmmso....', 65: '......oodmmmmdoooossssssssssmmmdommmmmmoolmmmmmmdoommmmmmolmmmssssssssssoooolmmmmdoo....', 66: '.......osmmmmmdoolllllllllllmmmdommmmmoolmmmmmmmmdoommmmmodmmmllllllllllloolmmmmmso.....', 67: '.......oodddddddoollllllllllmmmsommmmoolmmmmmmmmmmdoommmmosmmmlllllllllloodddddddoo.....', 68: '........ossssssssommmmmmmmmmmmdooAmmoolmmmmmmmmmmmmdoommAoolmmmmmmmmmmmmosssssssso......', 69: '........oooooooooommmmmmmmmmmmdoAAmoolmmmmmmmmmmmmmmdoomAAolmmmmmmmmmmmmoooooooooo......', 70: '..........olmmssssssssssssssmmdommmosdmmmmmmmmmmmmmmdsommmolmmssssssssssssssmmdo........', 71: '..........odmmssssssssssssssmmdommmoosdmmmmmmmmmmmmdsoommmodmmssssssssssssssmmdo........', 72: '..........osmmllllllllllllllmmsoAAmmoosdmmmmmmmmmmdsoommAAosmmllllllllllllllmmso........', 73: '..........oolmllllllllllllllmdooAAmmmoosdmmmmmmmmdsoommmAAoolmllllllllllllllmdoo........', 74: '...........olmmmmmmmmmmmmmmmmdommmmmmmoosmmmmmmmmsoommmmmmmolmmmmmmmmmmmmmmmmdo.........', 75: '...........olmmmmmmmmmmmmmmmmdommmmmmmmoodmmmmmmdoommmmmmmmolmmmmmmmmmmmmmmmmdo.........', 76: '...........oddddddddddddddddddommmmmmmmmosdmmmmdsommmmmmmmmoddddddddddddddddddo.........', 77: '...........ossssssssssssssssssommmmmmmmmoosddddsoommmmmmmmmosssssssssssssssssso.........', 78: '...........oooooooooooooooooooommmmmmmmmmoossssoommmmmmmmmmoooooooooooooooooooo.........', 79: '.............................olmmmmmmmmmmmoooooommmmmmmmmmmdo...........................', 80: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 81: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 82: '.............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo...........................', 83: '............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 84: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 85: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 86: '...........................oossssssssssssssssssssssssssssssssoo.........................', 87: '...........................osssssssssssssssssssssssssssssssssso.........................', 88: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 89: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 90: '...........................oooooooooooooooooooooooooooooooooooo.........................' }),
    legs: worn({ 82: '.................................oooo................oooo...............................', 83: '.................................oldo................oldo...............................', 84: '.................................oldo................oldo...............................', 85: '................................ooldoo..............ooldoo..............................', 86: '...............................oolmmdoo............oolmmdoo.............................', 87: '...............................olmmmmdo............olmmmmdo.............................', 88: '...............................olmmmmdo............olmmmmdo.............................', 89: '..............................oolmmmmdoo..........oolmmmmdoo............................', 90: '.............................oolmmmmmmdoo........oolmmmmmmdoo...........................', 91: '.........................oooooddddddddddooooooooooddddddddddooooo.......................', 92: '.........................osdAossssssssssoAdsoosdAossssssssssoAdso.......................', 93: '.........................oosAooooooooooooAsoooosAooooooooooooAsoo.......................', 94: '..........................oossssssssssssssoo..oossssssssssssssoo........................', 95: '........................ooolssssssssssssssdoooolssssssssssssssdooo......................', 96: '.......................oollmmmmmmmmmmmmmmmmoollmmmmmmmmmmmmmmmmldoo.....................', 97: '.......................olmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.....................', 98: '.......................odmmmmmmmmmmmmmmmmmmodmmmmmmmmmmmmmmmmmmmmdo.....................', 99: '.......................osddmmmmmmmmmmmmmmmmosddmmmmmmmmmmmmmmmmddso.....................', 100: '.......................oossdmmmmmmmmmmmmmmdoossdmmmmmmmmmmmmmmdssoo.....................', 101: '........................ooosmmmmmmmmmmmmmmsoooosmmmmmmmmmmmmmmsooo......................', 102: '..........................oolmAAAAAAAAAAmdoo..oolmAAAAAAAAAAmdoo........................', 103: '...........................olmAAAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 104: '...........................oddddddddddddddo....oddddddddddddddo.........................', 105: '...........................osssssssssssssso....osssssssssssssso.........................', 106: '...........................oooooooooooooooo....oooooooooooooooo.........................' }),
    gloves: worn({ 76: '...............oooo..oooo..oooo................................oooo..oooo..oooo.........', 77: '...............osdoooosdoooosdoo.............................ooolsoooolso.oolso.........', 78: '...............ooldooooldooooldoo...........................oooldooooldooooldoo.........', 79: '..............oolmmdoolmmdoolmmdoo..........................oolmmdoolmmdoolmmdoo........', 80: '..............olmmmmllmmmmllmmmmdooo......................ooolmmmmllmmmmllmmmmdo........', 81: '.............ooddddddddddddddddddddoo....................ooddddddddddddddddddddoo.......', 82: '.............osssssssssssssssssssssso....................osssssssssssssssssssssso.......', 83: '.............oooooooooooooooooooooooo....................oooooooooooooooooooooooo.......', 84: '.............osssssssssssssssssso........................osssssssssssssssssso...........', 85: '.............osssssssssssssssssso........................osssssssssssssssssso...........', 86: '.............ooodmmmmmmmmmmmmdooo........................ooodmmmmmmmmmmmmdooo...........', 87: '...............osdmmmmmmmmmmdso............................osdmmmmmmmmmmdso.............', 88: '...............oosmmmmmmmmmmsoo............................oosmmmmmmmmmmsoo.............', 89: '................oolmmmmmmmmdoo..............................oolmmmmmmmmdoo..............', 90: '.................oddddddddddo................................oddddddddddo...............', 91: '.................osssssssssso................................osssssssssso...............', 92: '.................oooooooooooo................................oooooooooooo...............' }),
    boots: worn({ 107: '...........................oooooooooooooo........oooooooooooooo.........................', 108: '..........................ooAAAAAAAAAAAAoo......ooAAAAAAAAAAAAoo........................', 109: '.........................oolAAAAAAAAAAAAdoo....oolAAAAAAAAAAAAdoo.......................', 110: '.........................olmmmmmmmmmmmmmmdo....olmmmmmmmmmmmmmmdo.......................', 111: '.........................olmmmmmmmmmmmmmmdo....olmmmmmmmmmmmmmmdo.......................', 112: '........................oossssssssssssssssoo..oossssssssssssssssoo......................', 113: '....................oooooooooossssssssssssdoooolssssssssssssoooooooooo..................', 114: '....................olllllldsollllllllllllmdoolmllllllllllllosdllllldo..................', 115: '...................oolmmmddsoollllllllllllmdoolmlllllllllllloosddmmmdoo.................', 116: '...................odddddssooAAAAAAAAAAAAAddooddAAAAAAAAAAAAAoossdddddo.................', 117: '...................osssssoooAAAAAAAAAAAAAAssoossAAAAAAAAAAAAAAooossssso.................' }),
    shield: worn({ 48: 'ooo....................................oooo.............................................', 49: 'ddo....................................oldo.............................................', 50: 'sdooo................................ooolso.............................................', 51: 'olldoo..............................oolldoo.............................................', 52: 'odmmdoo............................oolmmdo..............................................', 53: 'osmmmdooo........................ooolmmmso..............................................', 54: 'oolmmmldoo......................oollmmmdoo..............................................', 55: '.olmmmmmdoooooooooooooooooooooooolmmmmmdo...............................................', 56: '.olmmmmmmdooAAAAAAAAAAAAAAAAAAoolmmmmmmdo...............................................', 57: '.odmmmmmmmdooAAAAAAAAAAAAAAAAoolmmmmmmmdo...............................................', 58: '.osmmmmmmmmdooommmmmllddmmmooolmmmmmmmmso...............................................', 59: '.oodddddddddddoommmmllddmmoodddddddddddoo...............................................', 60: 'ooossssssssssssommmmllddmmossssssssssssoooo.............................................', 61: 'ddoooooooooooooommmmllddmmooooooooooooooldo.............................................', 62: 'sdooo..olmmmmmmmoooooooooommmmmmmdo..ooolso.............................................', 63: 'olldoo.olmmmmmmoollllllldoommmmmmdo.oolldoo.............................................', 64: 'odmmdooolmmmmmoolmmmmmmmmdoommmmmdooolmmdo..............................................', 65: 'osmmmdooommmmoolmmmmmmmmmmdoommmmooolmmmso..............................................', 66: 'oolmmmldoommmolmmmmmmmmmmmmdommmoollmmmdoo..............................................', 67: '.olmmmmmdoommolmmmmmmmmmmmmdommoolmmmmmdo...............................................', 68: '.olmmmmmmdoomolmmmmmAAmmmmmdomoolmmmmmmdo...............................................', 69: '.odmmmmmmmdooodmmmmmAAmmmmmdooolmmmmmmmdo...............................................', 70: 'oosmmmmmmmmdooodmmmmmmmmmmdooolmmmmmmmmsooo.............................................', 71: 'ddolddddddddddoodmmmmmmmmdoodddddddddddoldo.............................................', 72: 'sdolsssssssssssosddddddddsosssssssssssdolso.............................................', 73: 'olldooooooooooooossssssssooooooooooooolldoo.............................................', 74: 'odmmdooolmmmmmmmoooooooooommmmmmmdooolmmdo..............................................', 75: 'osmmmdooommmmmmmmmmmllddmmmmmmmmmooolmmmso..............................................', 76: 'oolmmmldoommmmmmmmmmllddmmmmmmmmoollmmmdoo..............................................', 77: '.olmmmmmdoommmmmmmmmllddmmmmmmmoolmmmmmdo...............................................', 78: '.olmmmmmmdoommmmmmmmllddmmmmmmoolmmmmmmdo...............................................', 79: '.odmmmmmmmdoommmmmmmllddmmmmmoolmmmmmmmdo...............................................', 80: '.osmmmmmmmmdooommmmmllddmmmooolmmmmmmmmso...............................................', 81: '.oodddddddddddoommmmllddmmoodddddddddddoo...............................................', 82: '..ossssssssssssommmmllddmmosssssssssssso................................................', 83: '..oooooooooooooommmmllddmmoooooooooooooo................................................', 84: '.........osdmmmmmmmmllddmmmmmmdso.......................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo.......................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo........................................................', 87: '...........oosddmmmmmmmmmmddsoo.........................................................', 88: '............oossdddmmmmdddssoo..........................................................', 89: '.............ooosssmmmmsssooo...........................................................', 90: '...............ooooddddoooo.............................................................', 91: '..................osssso................................................................', 92: '..................oooooo................................................................' }),
  },
  regal: {
    helm: worn({ 0: '...........................................oooo.........................................', 1: '...........................................oldo.........................................', 2: '...........................................oldo.........................................', 3: '..........................................ooldoo........................................', 4: '.oooo.....................................olmmdo.....................................ooo', 5: '.osdoE....................................olmmdo....................................oods', 6: '.oosdoo.......................oooo.......oolmmdoo.......oooo.......................oolso', 7: '..ooddooo.....................osdoo......olmmmmdo......oolso.....................oooldoo', 8: '...osdldoo....................ooldo......olmmmmdo......oldoo....................oolldso.', 9: '...oosmmdoo...................olmdoo..E..olmmmmdo.....oolmdo...................oolmmsoo.', 10: '....oodmmdoo..................olmmdo....oolmmmmdoo....olmmdo..................oolmmdoo..', 11: '.....osdmmdooo................olmmdoooooolmmmmmmdoooooolmmdo.................oolmmdso...', 12: '.....oosmmmldoo.....oooo......olmmmdoollolmmmmmmdoldoolmmmdo......oooo.....ooolmmmsoo...', 13: '......oodmmmmdoo....osdoo.....olmmmmdomoolmmmmmmdoomolmmmmdo.....oolso....oollmmmdoo....', 14: '.......osdmmmmdoo...ooldoo...oolmmmmdooolmmmmmmmmdooolmmmmdoo...ooldoo...oolmmmmdso.....', 15: '.......oosmmmmmdooo..olmdoo..olmmmmmmdoolmmmmmmmmdoolmmmmmmdo..oolmdo..ooolmmmmmsoo.....', 16: '........oodmmmmmldoo.olmmdoooollllmmmmdolmmmmmmmmdolmmmmmmmdoooolmmdo.oollmmmmmdoo......', 17: '.........osmmmmmmmdooolmmmloolllllddddddddddddddddddddddddddooolmmmdooolmmmmmmmso.......', 18: '.........oodmmmmmmmdoolmmmmdolllllllssssssssssssssssssssssssoolmmmmdoolmmmmmmmdoo.......', 19: '..........osdmmmmmmmdolmmmmmllllllllooooooooooooooooooooooooolmmmmmdolmmmmmmmdso........', 20: '..........oosmmmmmmmmlmmmmmmmdllllllllmmmmmmmmmmmmmmmmmmmmoolmmmmmmmlmmmmmmmmsoo........', 21: '.......E...oodmmmmmmmmmmmmddddllllllllmmmmmmmmmmmmmmmmmmmoodddddmmmmmmmmmmmmdoo.........', 22: '............osdmmmmmmmmmmmssssssllllllllmmmmmmmmmmmmmmmmmossssssmmmmmmmmmmmdso..........', 23: '............oosmmmmmmmmmmdoooooollllllllmmmmmmmmmmmmmmmmmooooooolmmmmmmmmmmsoo..........', 24: '.............oodmmmmmmmmmmldoommmmmmmmmmmmmmmmmmmmmmmmmmmmmmooolmmmmmmmmmmdoo...........', 25: '..............osdddddddddddddoommmmmmmmmmmmmmmmmmmmmmmmmmmmoodddddddddddddso............', 26: '..............oossssssssssssssommmmmmmmmmmmmmmmmmmmmmmmmmmmossssssssssssssoo............', 27: '...............oooooooooooooooommmmmmmmmmmmmmmmmmmmmmmmmmmmoooooooooooooooo.............', 28: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 29: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.....................', 30: '.......................olmmmmmmmmmmmmmmmmmmmEEmmmmmmmmmmmmmmmmmmmdo.....................', 31: '.....................ooolmmmmmmmmmmmmmmmmmmmEEmmmmmmmmmmmmmmmmmmmdooo...................', 32: '.....................ollssssssssssssssssssssssssssssssssssssssssssldo...................', 33: '.....................olmssssssssssssssssssssssssssssssssssssssssssmdo...................', 34: '.....................olmAAAAAAAAAAAAEEAAAAAAAAAAAAAAEEAAAAAAAAAAAAmdo...................', 35: '...................ooolmAAAAAAAAAAAAEEAAAAAAAAAAAAAAEEAAAAAAAAAAAAmdooo.................', 36: '...................osdmmmmmmmmssssssssssssmmllddssssssssssssmmmmmmmmdso.................', 37: '...................oosdmmmmmmmssssssssssssmmllddssssssssssssmmmmmmmdsoo.................', 38: '....................oosdmmmmmmmmEEEEEEEEmmmmllddmmEEEEEEEEmmmmmmmmdsoo..................', 39: '.....................oosdmmmmmmmEEEEEEEEmmmmllddmmEEEEEEEEmmmmmmmdsoo...................', 40: '......................oosdmmmmmmEEEEEEEEmmmmllddmmEEEEEEEEmmmmmmdsoo....................', 41: '.......................oosdmmmmmEEEEEEEEmmmmllddmmEEEEEEEEmmmmmdsoo.....................', 42: '........................oosdmmmmEEEEddssmmmmllddmmssddEEEEmmmmdsoo......................', 43: '.........................oosdmmmEEEEddssmmmmllddmmssddEEEEmmmdsoo.......................', 44: '..........................oosdssssddssssssmmllddssssssddssssdsoo........................', 45: '...........................oosssssddssssssmmllddssssssddsssssoo.........................', 46: '............................oosdddssmmmmmmmmllddmmmmmmssdddsoo..........................', 47: '.............................oosddssmmmmmmmmllddmmmmmmssddsoo...........................', 48: '..............................oossmmmmmmmmmmllddmmmmmmmmssoo............................', 49: '...............................oosmmmmmmmmmmllddmmmmmmmmsoo.............................', 50: '................................ooddAAAAAAAAAAAAAAAAAAddoo..............................', 51: '.................................ossAAAAAAAAAAAAAAAAAAsso...............................', 52: '.................................oooosddmmmmmmmmmmddsoooo...............................', 53: '....................................oossmmmmmmmmmmssoo..................................', 54: '.....................................ooossssssssssooo...................................', 55: '.......................................osssssssssso.....................................', 56: '.......................................oooooooooooo.....................................' }),
    chest: worn({ 30: '..E.....................................................................................', 33: '..........................................E.............................................', 34: '.........................................E..............................................', 36: '.....oooo........................................................................oooo...', 37: '.E...oldo........................................................................oldo...', 38: 'ooo..oldo........................................................................oldo...', 39: 'ddo..oldoo......................................................................ooldo...', 40: 'sdoo.olmdoo....................................................................oolmdo.oo', 41: 'oddooodmmdo....................................................................olmmdoood', 42: 'osmdoosmmdo....................................................................olmmsoold', 43: 'ooldooolmdoo..................................................................oolmdooold', 44: '.odmdoolmmdo..................................................................olmmdoolmd', 45: '.osmmdolmmdoo................................................................oolmmdolmms', 46: '.oolmdodmmmdo................................................................olmmmdolmdo', 47: '..odmmlsmmmdo................................................................olmmmslmmdo', 48: 'ooosmmdolmmdoo..............................................................oolmmdolmmso', 49: 'dooolmmlmmmmdo..............................................................olmmmmlmmdoo', 50: 'dooodmmmmmmmdoo............................................................oolmmmmmmmdo.', 51: 'ldoosmmmmmmmmdo............................................................olmmmmmmmmsoo', 52: 'dmdoolmmmmmmmdoo..........................................................oolmmmmmmmdood', 53: 'sdmdodmmmmmmmmdo..........................................................olmmmmmmmmdold', 54: 'osmmlsmmmmmmmmdoo........................................................oolmmmmmmmmslmd', 55: 'oodmdolmmmmmmmmdo........................................................olmmmmmmmmdolmd', 56: '.osmmlmmmmmmmmmdoo......................................................oolmmmmmmmmmlmms', 57: '.oodmmmmmmmmmmdddoooooooooooooooooooo................oooooooooooooooooooodddmmmmmmmmmmdo', 58: '..osmmmmmmmmmmsssolllllllllldoolllAAo................oAAllloolllllllllllosssmmmmmmmmmmso', 59: '..oodmmmmmmmmdoooommmmmmmmmmmdoommAAooooo........oooooAAmmoolmmmmmmmmmmmoooolmmmmmmmmdoo', 60: 'oooosmmmmmmmmmdoAAAAAAAAAAAAmmdommmmAAldo........ollAAmmmmolmmAAAAAAAAAAAAolmmmmmmmmmso.', 61: 'sdooodmmmmmmmmdooAAAAAAAAAAAmmdoommmAAmdoooooooooolmAAmmmoolmmAAAAAAAAAAAoolmmmmmmmmdooo', 62: 'osdoosmmmmmmmmmdommmmmmmmmmmmmmdommmmmAAloollldoolAAmmmmmolmmmmmmmmmmmmmmolmmmmmmmmmsood', 63: 'ooddoodmmmmmmdddoommmmmmmmmmmmmdommmmmAAoolmmmmdooAAmmmmmolmmmmmmmmmmmmmoodddmmmmmmdoold', 64: '.osmdosmmmmmmssssossssssssssmmmdommmmmmmolmmmmmmdommmmmmmolmmmssssssssssossssmmmmmmsolms', 65: '.oodmdolmmmmdooooossssssssssmmmdommmmmmoolmmmmmmdoommmmmmolmmmssssssssssooooolmmmmdolmdo', 66: '..osmmlmmmmmmdoollllllllllllmmmdommmmmoolmmmmmmmmdoommmmmodmmmlllllllllllloolmmmmmmlmmso', 67: '..oodmmmmmmmmmdollllllllllllmmmsommmmoolmmmmmmmmmmdoommmmosmmmllllllllllllolmmmmmmmmmdoo', 68: '...osdmmmmmmmmdoommmmmmmmmmmmmdooAmmoolmmmmmmmmmmmmdoommAoolmmmmmmmmmmmmmoolmmmmmmmmdso.', 69: '...oosmmmmmmddddoommmmmmmmmmmmdoAAmoolmmmmmmmmmmmmmmdoomAAolmmmmmmmmmmmmooddddmmmmmmsoo.', 70: '....oodmmmmmsssssossssssssssmmdoAAmosdmmmmmmmmmmmmmmdsomAAolmmssssssssssosssssmmmmmdoo..', 71: '.....osmmmmdoooooossssssssssmmdoAAmoosdmmmmmmmmmmmmdsoomAAodmmssssssssssoooooolmmmmso...', 72: '.....oodmmmmdoolllllllllllllmmsoEEmmoosdmmmmmmmmmmdsoommEEosmmllllllllllllloolmmmmdoo...', 73: '......osmmmmmdoollllllllllllmdooEEmmmoosdmmmmmmmmdsoommmEEoolmlllllllllllloolmmmmmso....', 74: '......oodmmmmmdoommmmmmmmmmmmdomAAmmmmoosmmmmmmmmsoommmmAAmolmmmmmmmmmmmmoolmmmmmdoo....', 75: '.......osdddddddoommmmmmmmmmmdomAAmmmmmoodmmmmmmdoommmmmAAmolmmmmmmmmmmmoodddddddso.....', 76: '.......oossssssssoddddddddddddomAAmmmmmmosdmmmmdsommmmmmAAmoddddddddddddossssssssoo.....', 77: '........oooooooooossssssssssssomAAmmmmmmoosddddsoommmmmmAAmossssssssssssoooooooooo......', 78: '...........oooooooooooooooooooommmmmmmmmmoossssoommmmmmmmmmoooooooooooooooooooo.........', 79: '.............................olmmmmmmmmmmmoooooommmmmmmmmmmdo...........................', 80: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 81: '.............................olmAAAAAAAAAAAAAAAAAAAAAAAAAAmdo...........................', 82: '.............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo...........................', 83: '............................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 84: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 85: '............................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 86: '...........................oossssssssssssssssssssssssssssssssoo.........................', 87: '...........................osssssssssssssssssssssssssssssssssso.........................', 88: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 89: '...........................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.........................', 90: '...........................oooooooooooooooooooooooooooooooooooo.........................' }),
    legs: worn({ 91: '.........................oooooooooooooooooooooooooooooooooooooooo.......................', 92: '.........................osdAAAAAAAAAAAAAAdsoosdAAAAAAAAAAAAAAdso.......................', 93: '.........................oosAAAAAAAAAAAAAAsoooosAAAAAAAAAAAAAAsoo.......................', 94: '..........................oossssssssssssssoo..oossssssssssssssoo........................', 95: '........................ooolssssssssssssssdoooolssssssssssssssdooo......................', 96: '.......................oollmmmmmmmAAmmmmmmmoollmmmmmmmAAmmmmmmmldoo.....................', 97: '.......................olmmmmmmmmmAAmmmmmmmolmmmmmmmmmAAmmmmmmmmmdo.....................', 98: '.......................odmmmmmmmmmEEmmmmmmmodmmmmmmmmmEEmmmmmmmmmdo.....................', 99: '.......................osddmmmmmmmEEmmmmmmmosddmmmmmmmEEmmmmmmmddso.....................', 100: '.......................oossdmmmmmmmmmmmmmmdoossdmmmmmmmmmmmmmmdssoo.....................', 101: '........................ooosmmmmmmmmmmmmmmsoooosmmmmmmmmmmmmmmsooo......................', 102: '..........................oolmAAAAAAAAAAmdoo..oolmAAAAAAAAAAmdoo........................', 103: '...........................olmAAAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 104: '...........................oddddddddddddddo....oddddddddddddddo.........................', 105: '...........................osssssssssssssso....osssssssssssssso.........................', 106: '...........................oooooooooooooooo....oooooooooooooooo.........................' }),
    gloves: worn({ 76: '...............oooo..oooo..oooo................................oooo..oooo..oooo.........', 77: '...............osdoooosdoooosdoo.............................ooolsoooolso.oolso.........', 78: '...............ooldooooldooooldoo...........................oooldooooldooooldoo.........', 79: '..............oolmmdoolmmdoolmmdoo.........................ooolmmdoolmmdoolmmdoo........', 80: '..............olmmmmllmmmmllmmmmdooo......................ooolmmmmllmmmmllmmmmdo........', 81: '.............ooddddddddddddddddddddoo....................ooddddddddddddddddddddoo.......', 82: '............oosssssssssssssssssssssso...................oosssssssssssssssssssssso.......', 83: '...........oooooooooooooooooooooooooo..................oooooooooooooooooooooooooo.......', 84: '...........oddssssssssssssssssssddo....................oddssssssssssssssssssddo.........', 85: '...........osssssssssssssssssssssso....................osssssssssssssssssssssso.........', 86: '...........ooooodmmmmmEEmmmmmdooooo....................ooooodmmmmmEEmmmmmdooooo.........', 87: '...............osdmmmmEEmmmmdso............................osdmmmmEEmmmmdso.............', 88: '...............oosmmmmmmmmmmsoo............................oosmmmmmmmmmmsoo.............', 89: '................oolmmmmmmmmdoo..............................oolmmmmmmmmdoo..............', 90: '.................oddddddddddo................................oddddddddddo...............', 91: '.................osssssssssso................................osssssssssso...............', 92: '.................oooooooooooo................................oooooooooooo...............' }),
    boots: worn({ 98: '.............oooo........................................................oooo...........', 99: '.............osdoo......................................................oolso...........', 100: '.............ooddoo....................................................ooldoo...........', 101: '..............osmdoo..................................................oolmso............', 102: '..............oolmdoo................................................oolmdoo............', 103: '...............odmmdooo............................................ooolmmdo.............', 104: '...............osmmmldoo..........................................oollmmmso.............', 105: '...............oolmmmmdoo........................................oolmmmmdoo.............', 106: '................odmmmmmdoo......................................oolmmmmmdo..............', 107: '................osmmmmmmdoooooooooooooooo........oooooooooooooooolmmmmmmso..............', 108: '................oolmmmmmmdoooAAAAAAAAAAAoo......ooAAAAAAAAAAAooolmmmmmmdoo..............', 109: '.................odmmmmmmmldooAAAAAAAAAAdoo....oolAAAAAAAAAAoollmmmmmmmdo...............', 110: '.................osmmmmmmmmmdoomEEmmmmmmmdo....olmmmmmEEmmmoolmmmmmmmmmso...............', 111: '.................oodddddddddddooEEmmmmmmmdo....olmmmmmEEmmoodddddddddddoo...............', 112: '..................ossssssssssssossssssssssoo..oossssssssssosssssssssssso................', 113: '..................oooooooooooooossssssssssdoooolssssssssssoooooooooooooo................', 114: '.......................olmllllllllllllllllmdoolmllllllllllllllllmdo.....................', 115: '.......................olmllllllllllllllllmdoolmllllllllllllllllmdo.....................', 116: '.......................oddAAAAAAAAAAAAAAAAddooddAAAAAAAAAAAAAAAAddo.....................', 117: '.......................ossAAAAAAAAAAAAAAAAssoossAAAAAAAAAAAAAAAAsso.....................' }),
    shield: worn({ 32: 'E.......................................................................................', 38: '....................E...................................................................', 42: '............................................oooo........................................', 43: '...........................................oodso........................................', 44: '..........................................oolsoo........................................', 45: 'oo......................................oooldoo.........................................', 46: 'doo....................................oollmdo..........................................', 47: 'ldoo..................................oolmmmso..........................................', 48: 'lmdoo................................oolmmmdoo..........................................', 49: 'lmmdooo............................ooolmmmmso...........................................', 50: 'lmmmldoo..........................oollmmmmdoo...........................................', 51: 'lmmmmmdoo........................oolmmmmmmdo............................................', 52: 'lmmmmmmdooo....................ooolmmmmmmmso............................................', 53: 'dmmmmmmmldoo..................oollmmmmmmmdoo............................................', 54: 'smmmmmmmmmdoo................oolmmmmmmmmmso.oooo........................................', 55: 'odmmmmmmmmmdoooooooooooooooooolmmmmmmmmmdoooodso........................................', 56: 'osmmmmmmmmmmdoooAAAAAAAAAAooolmmmmmmmmmmsooolsoo........................................', 57: 'oodddddddddddddooAAAAAAAAoodddddddddddddoooldoo.........................................', 58: 'dossssssssssssssommmllddmossssssssssssssollmdo..........................................', 59: 'ldooooooooooooooommmllddmooooooooooooooolmmmso..........................................', 60: 'lmdoo..olmmmmmmmmmmmllddmmmmmmmmmdo..oolmmmdoo..........................................', 61: 'lmmdoooolmmmmmmmmmmmllddmmmmmmmmmdoooolmmmmso...........................................', 62: 'lmmmldoolmmmmmmmoooooooooommmmmmmdoollmmmmdoo...........................................', 63: 'lmmmmmdoommmmmmoollllllldoommmmmmoolmmmmmmdo............................................', 64: 'lmmmmmmdooommmoolmmmmmmmmdoommmooolmmmmmmmsooooo........................................', 65: 'dmmmmmmmldoomoolmmmmmmmmmmdoomoollmmmmmmmdooodso........................................', 66: 'smmmmmmmmmdooolmmmEEEEEEmmmdooolmmmmmmmmmsoolsoo........................................', 67: 'olmmmmmmmmmdoolmmmEEEEEEmmmdoolmmmmmmmmmdooldoo.........................................', 68: 'lmmmmmmmmmmmdooommEEEEEEmmooolmmmmmmmmmmmllmdo..........................................', 69: 'lmmmdddddddddddoomEEEEEEmoodddddddddddmmmmmmso..........................................', 70: 'lmmmssssssssssssomEEEEEEmossssssssssssmmmmmdoo..........................................', 71: 'lmmdooooooooooooomEEEEEEmooooooooooooolmmmmso...........................................', 72: 'lmmmldoolmmmmmoosddddddddsoommmmmdoollmmmmdoo...........................................', 73: 'lmmmmmdoommmmmmoossssssssoommmmmmoolmmmmmmdo............................................', 74: 'lmmmmmmdooommmmmoooooooooommmmmooolmmmmmmmso............................................', 75: 'dmmmmmmmldoommmmmmmmllddmmmmmmoollmmmmmmmdoo............................................', 76: 'smmmmmmmmmdoommmmmmmllddmmmmmoolmmmmmmmmmso.............................................', 77: 'odmmmmmmmmmdoommmmmmllddmmmmoolmmmmmmmmmdoo.............................................', 78: 'osmmmmmmmmmmdooommmmllddmmooolmmmmmmmmmmso..............................................', 79: 'oodddddddddddddoommmllddmoodddddddddddddoo..............................................', 80: '.ossssssssssssssommmllddmosssssssssssssso...............................................', 81: '.oooooooooooooooommmllddmoooooooooooooooo...............................................', 82: '........osmmmmmmmmmmllddmmmmmmmmso......................................................', 83: '........oodmmmmmmmmmllddmmmmmmmdoo......................................................', 84: '.........osdmmmmmmmmllddmmmmmmdso.......................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo.......................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo........................................................', 87: '...........oosddmmmmmmmmmmddsoo.........................................................', 88: '............oossdddmmmmdddssoo..........................................................', 89: '.............ooosssmmmmsssooo...........................................................', 90: '...............ooooddddoooo.............................................................', 91: '..................osssso................................................................', 92: '..................oooooo................................................................' }),
  },
}


const HERO_BASE = [
  '................oooooooo....................',
  '................ohhhhjjJoo.ooo..............',
  '................ohhhhjhJoo.ooo..............',
  '........oooooooooooHjhjhhHoojjo.............',
  '.........ohhhhhhhhhhhhhhhhhojjooooo.........',
  '.........oooHhhhhhhhhhhhjhhjHHHhhoo.........',
  '..........oohhjhhhhhhhhhJjhjHHohjJooo.......',
  '.........oojhjHhhjjhhJJHHJjjjjJhhjjjjo......',
  '.......oohhhjHhhhjjhhjJJhjhhhhhjhhooo.......',
  '......oJhhhjHJhhhjjhjHHhhjhhhjhhjJooo.......',
  '.......oooooJhhhhhhhHJJhhhjhHhhjhhjoo.......',
  '.........oHHhhHjjjhjHhhhhhhHohhhhjhoo.......',
  '........oJHhhHHjjjjHohhjjhJoohhhhHJJJo......',
  '........oJJJHHHHjjHoohhjHHodojjHjHoHHo......',
  '........oJJHHHHHJHodoJJHHoSdooHHHHHooo......',
  '.......oHHHoHHooooSSoHHooSSSSSoHHoHoo.......',
  '......ooJHHoHHSoSsSSSHHoSSSSSSSHHoHoo.......',
  '......ooooooHoSSssssSoodSssssSSoHoooo.......',
  '..........ooHoSsSooSsSSssSooSsSoHoo.........',
  '.........oSSooSsSooSsssssSooSsSooSo.........',
  '.........ooSdhssSooSsssssSooSssddSo.........',
  '.........ooSdhssSooSsssssSooSssddSo.........',
  '..........oodoSsssssssssssssssSooo..........',
  '...........oooSsssssssssssssssSooo..........',
  '.............oodsssssssssssSdooo............',
  '...............oodsssssssssdoo..............',
  '..............ooooooDDDDDoooooo.............',
  '..............oSsSooDDDDDooSsSo.............',
  '.............oSssssdddddddssssSo............',
  '............oSssssssSssssssssssSo...........',
  '............oSssssssssSsssssssssSo..........',
  '..........ooSssssssssDDsssssssssSo..........',
  '.........oSssssssssssssssssssssssSo.........',
  '.........oSssssssssssssssssssssssSo.........',
  '.........oSssssssssssssssssssssssSo.........',
  '..........oodsssssssssssssssssssdo..........',
  '..........oodsssssssssssssssSoSsdo..........',
  '.........oSSSSsssssssssssssssSoSSSo.........',
  '.........oSssdoSsssssssssssssSoSsSo.........',
  '.........oSsSooSsssssssssssssSoSsSo.........',
  '........oSssSoSssssssssssssssSooSsSoo.......',
  '........oSssSooSssssssssssssssSoSsSoo.......',
  '........oSssSoSsssssssssssssssssssSoo.......',
  '........oSsDSooSsDsssssssssssSoSsDSoo.......',
  '........oddSoooSssssssssssssssSooSdoo.......',
  '.........ooo..oSsssssssssssssSo.ooo.........',
  '..............oSsssssssssssssSo.............',
  '..............oSsssssSoSsssssSo.............',
  '.............oSssssssSoSssssssSo............',
  '.............oSsssssSo.oSsssssSo............',
  '.............oSsssssSo.oSsssssSo............',
  '..............oSssssSo.oSsssssSo............',
  '..............oSddsSoo.oSsssdoo.............',
  '...............oSSSo....oSsSdoo.............',
  '...............oSSSo.....oSSdoo.............',
  '..............oSssSdo...odSssSo.............',
  '.............oSssssdo...odssssSo............',
  '............oSSdssSo.....odsdSSSo...........',
  '............ooooooo.......ooooooo...........',
]


/**
 * Clothes are a layer, not part of the body. Each one is only drawn when that
 * slot has no armour in it — which is what stops a tunic sleeve poking out from
 * under a breastplate.
 */
export const HERO_CLOTHES = {
  chest: [
    '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '..............oooo.........oooo.............',
  '.............oBAbbo.......obbbbo............',
  '............obaaaaAo....oAAaaaaAo...........',
  '............oaaaaaaAo..oAAaaaaaabo..........',
  '...........oAaabaaaaA..oaaaaAbaabo..........',
  '..........oBaaABaaaaAAoAaaaaBAAaabo.........',
  '.........oAAaaboaaaaaaBAaaaaabbaaAo.........',
  '..........ooBABoaaaaaaaaaaaaoBbAoo..........',
  '.............ABoaaaaaaaaaaaaooBA............',
  '.............oooAAaaaaaaaaaAo.oo............',
  '..............oBAAAaaaaaaaAABo..............',
  '...............oBBbbAAAAAbbBBo..............',
  '................oo.BAAAAAbb.................',
  '...................ooooooooo.o..............',
  '..................obAAAAAAAABbo.............',
  '...................oaAAAAAaAbbo.............',
  '..................booaaaaaAooo..............',
  '..................o...ooooo.................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  ],
  legs: [
    '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '...............ooot........TTo..............',
  '..............oUutto.......oTo..............',
  '...............oooo.........................',
  '..............ouotto........................',
  '...............oo...........oo..............',
  '...............oTo.ooTooooooTTo.............',
  '..............oTuooUUUUUTTuuUUo.............',
  '..............oUtutuToooTttttuo.............',
  '..............outtttTo.oTttttto.............',
  '.............oTttttuTo.oTtttuuo.............',
  '.............oUttutuTo.oTtttuTTo............',
  '.............oUtUUuTTo.oTTtuuUTo............',
  '..............ottoTUo...oTTUooTo............',
  '...............o..oUo...oTTo..o.............',
  '...................o.....oo.................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  ],
}

/**
 * The hero's palette is generated, not written down.
 *
 * Shaded character art uses a ramp per material — a few tones of hair, of skin,
 * of cloth — but the player only ever picks one colour for each. RAMPS maps
 * every palette slot to the material it belongs to and how far off the base it
 * sits, so one picked colour fills the whole ramp and drop-in art can be
 * annotated instead of recoloured by hand.
 *
 * Offsets are percentages toward white (positive) or black (negative).
 */
const HERO_RAMPS = {
  skin: { s: 0, S: -17, d: -29, D: -54 },
  hair: { h: 0, H: -29, j: -6, J: -21 },
  tunic: { a: 0, A: -27, b: -40, B: -54 },
}

/** Slots that never change with the player's choices. */
/** Outline, trousers and belt — not offered as choices, so not derived. */
const HERO_FIXED = { o: '#0a0604', t: '#522f17', T: '#371f10', u: '#4a2a15', U: '#412513' }

/**
 * The hair keys in the hero ramp.
 *
 * A helm replaces the hairstyle rather than sitting on top of it. You cannot
 * wear a helmet and a haircut at the same time, and a fringe coming through a
 * steel dome is the single thing that made a full set read as dress-up instead
 * of as armour.
 */
const HAIR_KEYS = new Set(['h', 'H', 'j', 'J'])
const shaved = new WeakMap()

export function underHelm(sprite) {
  let grid = shaved.get(sprite.grid)
  if (!grid) {
    const cells = sprite.grid.map((row) => [...row].map((c) => (HAIR_KEYS.has(c) ? '.' : c)))
    const h = cells.length
    const w = cells[0].length
    // The hair was wearing an outline, and an outline is the shared colour
    // rather than a hair key — so cutting the hair leaves a black scribble
    // hanging in the air. Erode outline that no longer borders anything solid,
    // repeatedly, because a spike of hair leaves a chain of it.
    for (let pass = 0; pass < 40; pass++) {
      let cut = false
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (cells[y][x] !== 'o') continue
          const holds = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dy, dx]) => {
            const c = cells[y + dy]?.[x + dx]
            return c && c !== '.' && c !== 'o'
          })
          if (!holds) {
            cells[y][x] = '.'
            cut = true
          }
        }
      }
      if (!cut) break
    }
    // Cutting the hair keys leaves two kinds of litter behind: the outline the
    // hair was wearing, which is the shared outline colour rather than a hair
    // key, and the odd cell of another ramp the transcription borrowed inside
    // the fringe. Both end up as islands floating clear of the body, so rather
    // than chase keys, keep only what is still joined to the character. The
    // feet are the one place guaranteed to be part of it.
    const keep = Array.from({ length: h }, () => new Array(w).fill(false))
    const stack = []
    for (let x = 0; x < w; x++) {
      if (cells[h - 1][x] !== '.') stack.push([x, h - 1])
      if (cells[h - 2]?.[x] !== '.') stack.push([x, h - 2])
    }
    while (stack.length) {
      const [x, y] = stack.pop()
      if (x < 0 || y < 0 || x >= w || y >= h || keep[y][x] || cells[y][x] === '.') continue
      keep[y][x] = true
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    grid = cells.map((row, y) => row.map((c, x) => (keep[y][x] ? c : '.')).join(''))
    shaved.set(sprite.grid, grid)
  }
  return { ...sprite, grid }
}

export function heroPalette(skin = SKIN_BASE, hair = HAIR_BASE, shirt = TUNIC) {
  const palette = { ...HERO_FIXED }
  for (const [key, off] of Object.entries(HERO_RAMPS.skin)) palette[key] = shade(skin, off)
  for (const [key, off] of Object.entries(HERO_RAMPS.hair)) palette[key] = shade(hair, off)
  for (const [key, off] of Object.entries(HERO_RAMPS.tunic)) palette[key] = shade(shirt, off)
  return palette
}

// ---------------------------------------------------------------------------
// The female character, transcribed from art/female avatar.png by
// tools/import_female.py. Her frame is 30 x 65, not the male's 32 x 59 — she is
// taller and narrower, and squashing her into his made her stubby, which is not
// the art that was sent. Colours are the shared hero palette keys, so skin and
// hair colour still apply, and the split into shirt and legs is what lets
// armour replace one without the other showing through.

const HERO_F = [
  '...........ooooo..........................',
  '..........oHJJHHo.........................',
  '.........oJJJJHooo........................',
  '........oJJJJHHddoo.......................',
  '.......ooJJJHHdSooooooooo.................',
  '.......ojjHHHoboHHHHHHHHHoo...............',
  '......oojJHHHooHJJJHHHHHHHHo..............',
  '......oJJJHHoHJJJJJJJHHHHHHHoo............',
  '......oJJHHoHJJJJJJJJJJHHHHJJHo...........',
  '......oJHHoHJJJJJJJJJJJJHJJJHHo...........',
  '......oJHHoJJJjJJJJJJJJJHJJJJHo...........',
  '.....oHHHoHJHhhJJJJHJJJJHHJJhHHo..........',
  '.....oHHHoHHhJJJhhHHJJJHooJhJjHoo.........',
  '.....oJJHoHHJJJJhhHJJJHoSoJhJJHHo.........',
  '....oJJJHoHHJJHJJHoJJHHoSSoHHJHHo.........',
  '....oJJJHoHHJHHJHHoJJHoSssSHHHHHo.........',
  '....oJHHHooHJHHHHoSHHoSsDDSoHHooo.........',
  '......oJHooHHoHooSsHoSssssSSoHoo..........',
  '......oJHHoHHooSsssoSssssssSoHoo..........',
  '......oHHoSHHoSSoosSssssooSsoHooo.........',
  '......oHHoSHHossoossssssoossoHooo.........',
  '......oHHoSHHossoossssssoosshHoo..........',
  '......oHHooHHdssoossssssoossdHoo..........',
  '.....HooHooHHoSssssssssssssSoHo...........',
  '....oo.oHo.HHoDssssssssssssDoHo...........',
  '.......Ho..oHooDssssssssssdooHo...........',
  '.......Ho..oo..ooodssssDooo..o............',
  '...........o....oooDDDDooo...o............',
  '.............ooobdDSdddDooooo.............',
  '............oAaaAoSSSSSooDaaDo............',
  '...........oAaaaaAossssoaaaaabo...........',
  '..........ooaaaaaaosssooaaaaaao...........',
  '..........oaaaaaaaosssoaaaaaaao...........',
  '.........ooaaaDaaaaoSoaaaaDaaaaoo.........',
  '.........oaaaAoaaaaaoaaaaaoDaaaoo.........',
  '.........oobaDoaaaaaDaaaaaooAaoo..........',
  '..........oDoboDaaaaaaaaaaooooD...........',
  '..........oddoobDaaaaaaaaDoooDdo..........',
  '..........oSSDobDAaaaaaADbooDSSo..........',
  '.........oSssDooobbbbbbbboooDssdo.........',
  '.........ossSoTuboTooooUTTTooSsso.........',
  '.........sssDooTtTUUUUUTTooTodsso.........',
  '.........ssSo.oDtoADAAAADDDo.ssso.........',
  '........ossSo.oDDbooaaaaADoo.ossS.........',
  '.......oossstoToDooTooooooToosssso........',
  '.......oosssuoToooUtooooouTTosssso........',
  '.......oosdsooTToTttUtttttuTosssso........',
  '........odsDooUtUtttuttttttUooDsdo........',
  '.........ooo.outtttUoTUttttuo.ooo.........',
  '.............ottttuToTtttttuo.............',
  '............oTttttuo.outttttTo............',
  '............oUttttUo.oUtttttUo............',
  '............outtttTo.oTtttttUo............',
  '............oUuttUTo.oTTtttuUo............',
  '............oTuUtTTo..TUuttTTo............',
  '.............oUoUTo...oTTooTo.............',
  '.............oodooo...ooooooo.............',
  '.............ooSodo...ooooSo..............',
  '..............osSD.....oDSso..............',
  '..............ossD.....oSsso..............',
  '.............osssd.....oSsso..............',
  '.............sssSd.....odssso.............',
  '............sssssdo....ossssso............',
  '...........ossssSo.....oSssssso...........',
  '...........oooooo.......ooooooo...........',
]

const HERO_BASE_F = [
  '...........ooooo..........................',
  '..........oHJJHHo.........................',
  '.........oJJJJHooo........................',
  '........oJJJJHHddoo.......................',
  '.......ooJJJHHdSooooooooo.................',
  '.......ojjHHHodoHHHHHHHHHoo...............',
  '......oojJHHHooHJJJHHHHHHHHo..............',
  '......oJJJHHoHJJJJJJJHHHHHHHoo............',
  '......oJJHHoHJJJJJJJJJJHHHHJJHo...........',
  '......oJHHoHJJJJJJJJJJJJHJJJHHo...........',
  '......oJHHoJJJjJJJJJJJJJHJJJJHo...........',
  '.....oHHHoHJHhhJJJJHJJJJHHJJhHHo..........',
  '.....oHHHoHHhJJJhhHHJJJHooJhJjHoo.........',
  '.....oJJHoHHJJJJhhHJJJHoSoJhJJHHo.........',
  '....oJJJHoHHJJHJJHoJJHHoSSoHHJHHo.........',
  '....oJJJHoHHJHHJHHoJJHoSssSHHHHHo.........',
  '....oJHHHooHJHHHHoSHHoSsDDSoHHooo.........',
  '......oJHooHHoHooSsHoSssssSSoHoo..........',
  '......oJHHoHHooSsssoSssssssSoHoo..........',
  '......oHHoSHHoSSoosSssssooSsoHooo.........',
  '......oHHoSHHossoossssssoossoHooo.........',
  '......oHHoSHHossoossssssoosshHoo..........',
  '......oHHooHHdssoossssssoossdHoo..........',
  '.....HooHooHHoSssssssssssssSoHo...........',
  '....oo.oHo.HHoDssssssssssssDoHo...........',
  '.......Ho..oHooDssssssssssdooHo...........',
  '.......Ho..oo..ooodssssDooo..o............',
  '...........o....oooDDDDooo...o............',
  '.............oooddDSdddDooooo.............',
  '............oSssSoSSSSSooDssDo............',
  '...........oSssssSossssosssssdo...........',
  '..........oossssssosssoosssssso...........',
  '..........osssssssosssossssssso...........',
  '.........oosssDssssoSossssDssssoo.........',
  '.........osssSosssssosssssoDsssoo.........',
  '.........oodsDosssssDsssssooSsoo..........',
  '..........oDodoDssssssssssooooD...........',
  '..........oddoodDssssssssDoooDdo..........',
  '..........oSSDodDSsssssSDdooDSSo..........',
  '.........oSssDoooddddddddoooDssdo.........',
  '.........ossSoSddoSooooDSSSooSsso.........',
  '.........sssDooSsSDDDDDSSooSodsso.........',
  '.........ssSo.oDsoSDSSSSDDDo.ssso.........',
  '........ossSo.oDDdoossssSDoo.ossS.........',
  '.......oossssoSoDooSooooooSoosssso........',
  '.......oosssdoSoooDsooooodSSosssso........',
  '.......oosdsooSSoSssDsssssdSosssso........',
  '........odsDooDsDsssdssssssDooDsdo........',
  '.........ooo.odssssDoSDssssdo.ooo.........',
  '.............ossssdSoSsssssdo.............',
  '............oSssssdo.odsssssSo............',
  '............oDssssDo.oDsssssDo............',
  '............odssssSo.oSsssssDo............',
  '............oDdssDSo.oSSsssdDo............',
  '............oSdDsSSo..SDdssSSo............',
  '.............oDoDSo...oSSooSo.............',
  '.............oodooo...ooooooo.............',
  '.............ooSodo...ooooSo..............',
  '..............osSD.....oDSso..............',
  '..............ossD.....oSsso..............',
  '.............osssd.....oSsso..............',
  '.............sssSd.....odssso.............',
  '............sssssdo....ossssso............',
  '...........ossssSo.....oSssssso...........',
  '...........oooooo.......ooooooo...........',
]

const HERO_F_SHIRT = [
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..............b...........................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '................b.........................',
  '.............AaaA.........aa..............',
  '............AaaaaA......aaaaab............',
  '............aaaaaa......aaaaaa............',
  '...........aaaaaaa.....aaaaaaa............',
  '...........aaa.aaaa...aaaa.aaaa...........',
  '..........aaaA.aaaaa.aaaaa..aaa...........',
  '...........ba..aaaaa.aaaaa..Aa............',
  '.............b..aaaaaaaaaa................',
  '...............b.aaaaaaaa.................',
  '...............b.AaaaaaA.b................',
  '.................bbbbbbbb.................',
  '................b.........................',
  '..........................................',
  '..................A.AAAA..................',
  '.................b..aaaaA.................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
]

const HERO_F_LEGS = [
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..............Tu..T....UTTT...............',
  '...............TtTUUUUUTT..T..............',
  '................t.........................',
  '..........................................',
  '............t.T....T......T...............',
  '............u.T...Ut.....uTT..............',
  '..............TT.TttUtttttuT..............',
  '..............UtUtttuttttttU..............',
  '..............uttttU.TUttttu..............',
  '..............ttttuT.Ttttttu..............',
  '.............Tttttu...utttttT.............',
  '.............UttttU...UtttttU.............',
  '.............uttttT...TtttttU.............',
  '.............UuttUT...TTtttuU.............',
  '.............TuUtTT...TUuttTT.............',
  '..............U.UT.....TT..T..............',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
  '..........................................',
]

/** The clothes layer for a build. Hers came out of her own art, split by
 *  where each garment sits, so a breastplate replaces her shirt and nothing
 *  else. */
export function heroClothes(body = 'male') {
  return body === 'female' ? { chest: HERO_F_SHIRT, legs: HERO_F_LEGS } : HERO_CLOTHES
}

/** The same trick on her frame, which is 30 x 65 rather than 32 x 59. */
const wornF = (rows) => {
  const w = Object.values(rows)[0].length
  const h = (HERO_F.length * w) / HERO_F[0].length
  const grid = Array.from({ length: h }, () => '.'.repeat(w))
  for (const [y, cells] of Object.entries(rows)) grid[y] = cells
  return { w, h, grid }
}

/**
 * What the character is holding.
 *
 * Weapons live apart from the worn set because they are a different problem: a
 * breastplate has to be cut to a silhouette, but a sword only has to line up
 * with a fist. That is why both builds can carry the whole rack while only one
 * of them has armour drawn for it yet.
 *
 * Every one of them is ringed in the set's outline colour. Without it a gilded
 * blade held across gilded plate is gold on gold, which is exactly how a sword
 * could be equipped and simply not be there.
 */
export const WEAPON_OVERLAYS = {
  male: {
  sword: worn({ 15: '................................oo..........', 16: '...............................ommo.........', 17: '..............................odlmdo........', 18: '..............................odlmdo........', 19: '..............................odlmdo........', 20: '..............................odlmdo........', 21: '..............................odlmdo........', 22: '..............................odlmdo........', 23: '..............................odlmdo........', 24: '..............................odlmdo........', 25: '..............................odlmdo........', 26: '..............................odlmdo........', 27: '..............................odlmdo........', 28: '..............................odlmdo........', 29: '..............................odlmdo........', 30: '..............................odlmdo........', 31: '..............................odlmdo........', 32: '..............................odlmdo........', 33: '..............................odlmdo........', 34: '..............................odlmdo........', 35: '..............................odlmdo........', 36: '..............................odlmdo........', 37: '.............................oAAAAAAo.......', 38: '.............................oAAAAAAo.......', 39: '..............................oossoo........', 40: '...............................osso.........', 41: '...............................osso.........', 42: '...............................osso.........', 43: '...............................osso.........', 44: '...............................osso.........', 45: '...............................osso.........', 46: '...............................osso.........', 47: '..............................oAAAAo........', 48: '...............................oooo.........' }),
  shield: worn({ 28: '.......ooooooo..............................', 29: '......olmmmmddo.............................', 30: '......olmmmmddo.............................', 31: '......olmmmmddo.............................', 32: '......olmmmmddo.............................', 33: '......olmAAAddo.............................', 34: '......olmAAAddo.............................', 35: '......olmAAAddo.............................', 36: '......olmAAAddo.............................', 37: '......olmAAAddo.............................', 38: '......ommmmmddo.............................', 39: '.......ommmmdo..............................', 40: '........ommmo...............................', 41: '.........omo................................', 42: '..........o.................................' }),
  axe: worn({ 9: '..............................oooooo........', 10: '.............................ommddmmo.......', 11: '............................ommlddlmmo......', 12: '............................oAmlddlmAo......', 13: '............................oAmlddlmAo......', 14: '............................oAmlddlmAo......', 15: '............................ommmddmmmo......', 16: '.............................ommddmmo.......', 17: '..............................ooddoo........', 18: '...............................oddo.........', 19: '...............................oddo.........', 20: '...............................osso.........', 21: '...............................osso.........', 22: '...............................osso.........', 23: '...............................osso.........', 24: '...............................osso.........', 25: '...............................osso.........', 26: '...............................osso.........', 27: '...............................osso.........', 28: '...............................osso.........', 29: '...............................osso.........', 30: '...............................osso.........', 31: '...............................osso.........', 32: '...............................osso.........', 33: '...............................osso.........', 34: '...............................osso.........', 35: '...............................osso.........', 36: '...............................osso.........', 37: '...............................osso.........', 38: '...............................osso.........', 39: '...............................osso.........', 40: '...............................osso.........', 41: '...............................osso.........', 42: '...............................osso.........', 43: '...............................osso.........', 44: '...............................osso.........', 45: '...............................osso.........', 46: '...............................osso.........', 47: '...............................osso.........', 48: '...............................osso.........', 49: '..............................oddddo........', 50: '...............................oooo.........' }),
  dagger: worn({ 26: '................................oo..........', 27: '...............................olmo.........', 28: '..............................ommmmo........', 29: '..............................odlmdo........', 30: '..............................odlmdo........', 31: '..............................odlmdo........', 32: '..............................odlmdo........', 33: '..............................odlmdo........', 34: '..............................odlmdo........', 35: '..............................odlmdo........', 36: '..............................odlmdo........', 37: '.............................oAAAAAAo.......', 38: '.............................oAAAAAAo.......', 39: '..............................oossoo........', 40: '...............................osso.........', 41: '...............................osso.........', 42: '...............................osso.........', 43: '...............................osso.........', 44: '...............................osso.........', 45: '..............................oAAAAo........', 46: '...............................oooo.........' }),
  spear: worn({ 4: '................................oo..........', 5: '...............................oAAo.........', 6: '...............................olmo.........', 7: '...............................ommo.........', 8: '..............................omlmmo........', 9: '..............................omlmmo........', 10: '..............................omlmmo........', 11: '..............................omlmmo........', 12: '..............................omlmmo........', 13: '..............................omlmmo........', 14: '..............................oAAAAo........', 15: '...............................osso.........', 16: '...............................osso.........', 17: '...............................osso.........', 18: '...............................osso.........', 19: '...............................osso.........', 20: '...............................osso.........', 21: '...............................osso.........', 22: '...............................osso.........', 23: '...............................osso.........', 24: '...............................osso.........', 25: '...............................osso.........', 26: '...............................osso.........', 27: '...............................osso.........', 28: '...............................osso.........', 29: '...............................osso.........', 30: '...............................osso.........', 31: '...............................osso.........', 32: '...............................osso.........', 33: '...............................osso.........', 34: '...............................osso.........', 35: '...............................osso.........', 36: '...............................osso.........', 37: '...............................osso.........', 38: '...............................osso.........', 39: '...............................osso.........', 40: '...............................osso.........', 41: '...............................osso.........', 42: '...............................osso.........', 43: '...............................osso.........', 44: '...............................osso.........', 45: '...............................osso.........', 46: '...............................osso.........', 47: '...............................osso.........', 48: '...............................osso.........', 49: '...............................osso.........', 50: '...............................osso.........', 51: '...............................osso.........', 52: '..............................oddddo........', 53: '...............................oooo.........' }),
  bow: worn({ 18: '...............................ooo..........', 19: '..............................oAAmo.........', 20: '..............................oldmo.........', 21: '..............................olodmo........', 22: '..............................olodmo........', 23: '..............................olodmo........', 24: '..............................oloodmo.......', 25: '..............................oloodmo.......', 26: '..............................oloodmo.......', 27: '..............................oloodmo.......', 28: '..............................olo.odmo......', 29: '..............................olo.odmo......', 30: '..............................olo.odmo......', 31: '..............................olo.osso......', 32: '..............................olo.osso......', 33: '..............................olo.osso......', 34: '..............................olo.osso......', 35: '..............................olo.odmo......', 36: '..............................olo.odmo......', 37: '..............................olo.odmo......', 38: '..............................oloodmo.......', 39: '..............................oloodmo.......', 40: '..............................oloodmo.......', 41: '..............................oloodmo.......', 42: '..............................olodmo........', 43: '..............................olodmo........', 44: '..............................olodmo........', 45: '..............................oldmo.........', 46: '..............................oAAmo.........', 47: '...............................ooo..........' }),
  staff: worn({ 8: '................................oo..........', 9: '...............................ommo.........', 10: '..............................olllmo........', 11: '.............................omlAAmmo.......', 12: '.............................ommAAmmo.......', 13: '..............................ommmmo........', 14: '...............................ommo.........', 15: '..............................oddddo........', 16: '...............................osso.........', 17: '...............................osso.........', 18: '...............................osso.........', 19: '...............................osso.........', 20: '...............................osso.........', 21: '...............................osso.........', 22: '...............................osso.........', 23: '...............................osso.........', 24: '...............................osso.........', 25: '...............................osso.........', 26: '...............................osso.........', 27: '...............................osso.........', 28: '...............................osso.........', 29: '...............................osso.........', 30: '...............................osso.........', 31: '...............................osso.........', 32: '...............................osso.........', 33: '...............................osso.........', 34: '...............................osso.........', 35: '...............................osso.........', 36: '...............................osso.........', 37: '...............................osso.........', 38: '...............................osso.........', 39: '...............................osso.........', 40: '...............................osso.........', 41: '...............................osso.........', 42: '...............................osso.........', 43: '...............................osso.........', 44: '...............................osso.........', 45: '...............................osso.........', 46: '...............................osso.........', 47: '...............................osso.........', 48: '...............................osso.........', 49: '...............................osso.........', 50: '...............................osso.........', 51: '...............................osso.........', 52: '...............................osso.........', 53: '...............................osso.........', 54: '...............................osso.........', 55: '..............................oddddo........', 56: '...............................oooo.........' }),
  },
  female: {
  sword: wornF({ 21: '............................oo............', 22: '...........................ommo...........', 23: '..........................odlmdo..........', 24: '..........................odlmdo..........', 25: '..........................odlmdo..........', 26: '..........................odlmdo..........', 27: '..........................odlmdo..........', 28: '..........................odlmdo..........', 29: '..........................odlmdo..........', 30: '..........................odlmdo..........', 31: '..........................odlmdo..........', 32: '..........................odlmdo..........', 33: '..........................odlmdo..........', 34: '..........................odlmdo..........', 35: '..........................odlmdo..........', 36: '..........................odlmdo..........', 37: '..........................odlmdo..........', 38: '..........................odlmdo..........', 39: '..........................odlmdo..........', 40: '..........................odlmdo..........', 41: '..........................odlmdo..........', 42: '..........................odlmdo..........', 43: '.........................oAAAAAAo.........', 44: '.........................oAAAAAAo.........', 45: '..........................oossoo..........', 46: '...........................osso...........', 47: '...........................osso...........', 48: '...........................osso...........', 49: '...........................osso...........', 50: '...........................osso...........', 51: '...........................osso...........', 52: '...........................osso...........', 53: '..........................oAAAAo..........', 54: '...........................oooo...........' }),
  shield: wornF({ 34: '.....ooooooo..............................', 35: '....olmmmmddo.............................', 36: '....olmmmmddo.............................', 37: '....olmmmmddo.............................', 38: '....olmmmmddo.............................', 39: '....olmAAAddo.............................', 40: '....olmAAAddo.............................', 41: '....olmAAAddo.............................', 42: '....olmAAAddo.............................', 43: '....olmAAAddo.............................', 44: '....ommmmmddo.............................', 45: '.....ommmmdo..............................', 46: '......ommmo...............................', 47: '.......omo................................', 48: '........o.................................' }),
  axe: wornF({ 15: '.........................oooooo...........', 16: '........................ommddmmo..........', 17: '.......................ommlddlmmo.........', 18: '.......................oAmlddlmAo.........', 19: '.......................oAmlddlmAo.........', 20: '.......................oAmlddlmAo.........', 21: '.......................ommmddmmmo.........', 22: '........................ommddmmo..........', 23: '.........................ooddoo...........', 24: '..........................oddo............', 25: '..........................oddo............', 26: '..........................osso............', 27: '..........................osso............', 28: '..........................osso............', 29: '..........................osso............', 30: '..........................osso............', 31: '..........................osso............', 32: '..........................osso............', 33: '..........................osso............', 34: '..........................osso............', 35: '..........................osso............', 36: '..........................osso............', 37: '..........................osso............', 38: '..........................osso............', 39: '..........................osso............', 40: '..........................osso............', 41: '..........................osso............', 42: '..........................osso............', 43: '..........................osso............', 44: '..........................osso............', 45: '..........................osso............', 46: '..........................osso............', 47: '..........................osso............', 48: '..........................osso............', 49: '..........................osso............', 50: '..........................osso............', 51: '..........................osso............', 52: '..........................osso............', 53: '..........................osso............', 54: '..........................osso............', 55: '.........................oddddo...........', 56: '..........................oooo............' }),
  dagger: wornF({ 32: '............................oo............', 33: '...........................olmo...........', 34: '..........................ommmmo..........', 35: '..........................odlmdo..........', 36: '..........................odlmdo..........', 37: '..........................odlmdo..........', 38: '..........................odlmdo..........', 39: '..........................odlmdo..........', 40: '..........................odlmdo..........', 41: '..........................odlmdo..........', 42: '..........................odlmdo..........', 43: '.........................oAAAAAAo.........', 44: '.........................oAAAAAAo.........', 45: '..........................oossoo..........', 46: '...........................osso...........', 47: '...........................osso...........', 48: '...........................osso...........', 49: '...........................osso...........', 50: '...........................osso...........', 51: '..........................oAAAAo..........', 52: '...........................oooo...........' }),
  spear: wornF({ 10: '............................oo............', 11: '...........................oAAo...........', 12: '...........................olmo...........', 13: '...........................ommo...........', 14: '..........................omlmmo..........', 15: '..........................omlmmo..........', 16: '..........................omlmmo..........', 17: '..........................omlmmo..........', 18: '..........................omlmmo..........', 19: '..........................omlmmo..........', 20: '..........................oAAAAo..........', 21: '...........................osso...........', 22: '...........................osso...........', 23: '...........................osso...........', 24: '...........................osso...........', 25: '...........................osso...........', 26: '...........................osso...........', 27: '...........................osso...........', 28: '...........................osso...........', 29: '...........................osso...........', 30: '...........................osso...........', 31: '...........................osso...........', 32: '...........................osso...........', 33: '...........................osso...........', 34: '...........................osso...........', 35: '...........................osso...........', 36: '...........................osso...........', 37: '...........................osso...........', 38: '...........................osso...........', 39: '...........................osso...........', 40: '...........................osso...........', 41: '...........................osso...........', 42: '...........................osso...........', 43: '...........................osso...........', 44: '...........................osso...........', 45: '...........................osso...........', 46: '...........................osso...........', 47: '...........................osso...........', 48: '...........................osso...........', 49: '...........................osso...........', 50: '...........................osso...........', 51: '...........................osso...........', 52: '...........................osso...........', 53: '...........................osso...........', 54: '...........................osso...........', 55: '...........................osso...........', 56: '...........................osso...........', 57: '...........................osso...........', 58: '..........................oddddo..........', 59: '...........................oooo...........' }),
  bow: wornF({ 24: '...........................ooo............', 25: '..........................oAAmo...........', 26: '..........................oldmo...........', 27: '..........................olodmo..........', 28: '..........................olodmo..........', 29: '..........................olodmo..........', 30: '..........................oloodmo.........', 31: '..........................oloodmo.........', 32: '..........................oloodmo.........', 33: '..........................oloodmo.........', 34: '..........................olo.odmo........', 35: '..........................olo.odmo........', 36: '..........................olo.odmo........', 37: '..........................olo.osso........', 38: '..........................olo.osso........', 39: '..........................olo.osso........', 40: '..........................olo.osso........', 41: '..........................olo.odmo........', 42: '..........................olo.odmo........', 43: '..........................olo.odmo........', 44: '..........................oloodmo.........', 45: '..........................oloodmo.........', 46: '..........................oloodmo.........', 47: '..........................oloodmo.........', 48: '..........................olodmo..........', 49: '..........................olodmo..........', 50: '..........................olodmo..........', 51: '..........................oldmo...........', 52: '..........................oAAmo...........', 53: '...........................ooo............' }),
  staff: wornF({ 14: '............................oo............', 15: '...........................ommo...........', 16: '..........................olllmo..........', 17: '.........................omlAAmmo.........', 18: '.........................ommAAmmo.........', 19: '..........................ommmmo..........', 20: '...........................ommo...........', 21: '..........................oddddo..........', 22: '...........................osso...........', 23: '...........................osso...........', 24: '...........................osso...........', 25: '...........................osso...........', 26: '...........................osso...........', 27: '...........................osso...........', 28: '...........................osso...........', 29: '...........................osso...........', 30: '...........................osso...........', 31: '...........................osso...........', 32: '...........................osso...........', 33: '...........................osso...........', 34: '...........................osso...........', 35: '...........................osso...........', 36: '...........................osso...........', 37: '...........................osso...........', 38: '...........................osso...........', 39: '...........................osso...........', 40: '...........................osso...........', 41: '...........................osso...........', 42: '...........................osso...........', 43: '...........................osso...........', 44: '...........................osso...........', 45: '...........................osso...........', 46: '...........................osso...........', 47: '...........................osso...........', 48: '...........................osso...........', 49: '...........................osso...........', 50: '...........................osso...........', 51: '...........................osso...........', 52: '...........................osso...........', 53: '...........................osso...........', 54: '...........................osso...........', 55: '...........................osso...........', 56: '...........................osso...........', 57: '...........................osso...........', 58: '...........................osso...........', 59: '...........................osso...........', 60: '...........................osso...........', 61: '..........................oddddo..........', 62: '...........................oooo...........' }),
  },
}

/**
 * Her armour, cut to her own silhouette.
 *
 * Recolouring her shirt in the metal was a stopgap and it looked like one: gold
 * cloth is not a breastplate, and there was nothing at all on her hands or her
 * feet. These are drawn against the shape of the body underneath — pauldrons on
 * the tops of her arms, a cuirass that follows her waist in, greaves on the legs
 * the art actually has.
 *
 * Her helm is open-faced where his is a closed bucket, on purpose: the profile
 * picture is her face, and a helmet that erases it undoes what the character
 * screen is for.
 */
/** The same four, cut to her frame. */
export const WORN_FEMALE = {
  rough: {
    helm: wornF({ 11: '............................oooooooooooooooooooooooooo..............................', 12: '...........................oollllllllllllllllllllllldoo.............................', 13: '..........................oolmmmmmmmmmmmmmmmmmmmmmmmmdoo............................', 14: '..........................olmmmmmmmmmmmmmmmmmmmmmmmmmmdo............................', 15: '.........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmdoo...........................', 16: '........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo..........................', 17: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 18: '.......................oolllllllllmmmmmmmmmmmmmmmmmmmmmmdoo.........................', 19: '.......................olmllllllllmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 20: '.......................olmmmllllllllmmmmmmmmmmmmmmmmmmmmmdo.........................', 21: '......................oolmmmllllllllmmmmmmmmmmmmmmmmmmmmmdoo........................', 22: '......................olmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmdo........................', 23: '......................olmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmdo........................', 24: '.....................oolmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmdoo.......................', 25: '.....................olmmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmdo.......................', 26: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 27: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 28: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 29: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 30: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 31: '...................ooolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdooo.....................', 32: '...................ollssssssssssssssssssssssssssssssssssssssldo.....................', 33: '...................olmssssssssssssssssssssssssssssssssssssssmdo.....................', 34: '...................oddddddddddddddddddddddddddddddddddddddddddo.....................', 35: '...................ossssddssssssddssssssddssssssddssssssddsssso.....................', 36: '...................oooooooooooooooooooooooooooooooooooooooooooo.....................' }),
    chest: wornF({ 57: '..............oooooooooooooooooooooooooooooooooooooooooooooooooooooo................', 58: '.............oollllllldoolllllllllllllllllllllllllllllllloollllllldoo...............', 59: '...........ooolmmmmmmmmdooommmmmmmmmmmmmmmmmmmmmmmmmmmmooolmmmmmmmmdooo.............', 60: '..........oollmmmmmmmmmmldoossssssssssssssssssssssssssoollmmmmmmmmmmldoo............', 61: '.........oolmmmmmmmmmmmmmmdoossssssssssssssssssssssssoolmmmmmmmmmmmmmmdoo...........', 62: '........oolmmmmmmmmmmmmmmmmdoommmmmmmmmmmmmmmmmmmmmmoolmmmmmmmmmmmmmmmmdoo..........', 63: '.......oolmmmmmmmmmmmmmmmmmmdoommmmmmmmmmmmmmmmmmmmoolmmmmmmmmmmmmmmmmmmdoo.........', 64: '.......olmmmmmmmmmmmmmmmmmmmmdommmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.........', 65: '.......olmmmmmmmmmmmmmmmmmmmmdommmmmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.........', 66: '.......olmmmssssssssssssssmmmdommmddmmmmssmmmmddmmmolmmmssssssssssssssmmmdo.........', 67: '.......odmmmssssssssssssssmmmdommmddmmmmssmmmmddmmmodmmmssssssssssssssmmmdo.........', 68: '.......osdmmmmmmmmmmmmmmmmmmdsommmmmmmmmssmmmmmmmmmosdmmmmmmmmmmmmmmmmmmdso.........', 69: '.......oosdmmmmmmmmmmmmmmmmdsoommmmmmmmmssmmmmmmmmmoosdmmmmmmmmmmmmmmmmdsoo.........', 70: '........oosdmmmmmmmmmmmmmmdsoommmmmmmmmmmmmmmmmmmmmmoosdmmmmmmmmmmmmmmdsoo..........', 71: '.........oosddmmmmmmmmmmddsoommmmmmmmmmmmmmmmmmmmmmmmoosddmmmmmmmmmmddsoo...........', 72: '..........oossdmmmmmmmmdssoommmmmmddmmmmssmmmmddmmmmmmoossdmmmmmmmmdssoo............', 73: '...........ooosddmmmmddsooommmmmmmddmmmmssmmmmddmmmmmmmooosddmmmmddsooo.............', 74: '.............oossddddssoodmmmmmmmmmmmmmmssmmmmmmmmmmmmmmmoossddddssoo...............', 75: '..............ooossssoooosmmmmmmmmmmmmmmssmmmmmmmmmmmmmmmmooossssooo................', 76: '................oooooo..oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoooooooo..................', 77: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 78: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 79: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 80: '.........................ossssssssssssllllllsssssssssssssso.........................', 81: '.........................ossssssssssssllllllsssssssssssssso.........................', 82: '.........................oddddddddddddllllllddddddddddddddo.........................', 83: '.........................oddddddddddddllllllddddddddddddddo.........................', 84: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 85: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 86: '........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 87: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 88: '........................olssssssssssssssssssssssssssssssssdo........................', 89: '.......................oolssssssssssssssssssssssssssssssssdoo.......................', 90: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 91: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 92: '.......................oddddddddddddddddddddddddddddddddddddo.......................', 93: '.......................osssssssssssssssssssssssssssssssssssso.......................', 94: '.......................oooooooooooooooooooooooooooooooooooooo.......................' }),
    legs: wornF({ 95: '.......................oooooooooooooooooooooooooooooooooooooo.......................', 96: '.......................odlllllllllllllldoodlllllllllllllllldo.......................', 97: '.......................osdmmmmmmmmmmmmdsoosdmmmmmmmmmmmmmmdso.......................', 98: '.......................oosmmmmmmmmmmmmsoooosmmmmmmmmmmmmmmsoo.......................', 99: '........................oolmmmmmmmmmmdoo..oolmmmmmmmmmmmmdoo........................', 100: '.........................osssssssssssso....osssssssssssssso.........................', 101: '........................oosssssssssssso...oossssssssssssssoo........................', 102: '.......................oolmmmmmmmmmmdoo..oolmmmmmmmmmmmmmmdoo.......................', 103: '.......................olmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmmmdo.......................', 104: '.......................odmmmmmmmmmmmmdo..odmmmmmmmmmmmmmmmmdo.......................', 105: '.......................osdmmmmmmmmmmdso..osddmmmmmmmmmmmmddso.......................', 106: '.......................oosmmmmmmmmmmsoo..oossmmmmmmmmmmmmssoo.......................', 107: '........................oolmmmmmmmmdooo...ooolmmmmmmmmmmdooo........................', 108: '.........................olmssssssssldo....olmssssssssssmdo.........................', 109: '.........................olmssssssssmdo....olmssssssssssmdo.........................', 110: '.........................oddddddddddddo....oddddddddddddddo.........................', 111: '.........................osssssssssssso....osssssssssssssso.........................', 112: '.........................oooooooooooooo....oooooooooooooooo.........................' }),
    gloves: wornF({ 77: '...............oooooooooooooo........................oooooooooooooo.................', 78: '..............oollllllllllldoo......................oollllllllllldoo................', 79: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 80: '.............oolmmmmmmmmmmmmdoo....................oolmmmmmmmmmmmmdoo...............', 81: '............oolmmmmmmmmmmmmmmdoo..................oolmmmmmmmmmmmmmmdoo..............', 82: '............olssssssssssssssssdo..................olssssssssssssssssdo..............', 83: '...........oolssssssssssssssssdoo................oolssssssssssssssssdoo.............', 84: '...........oddmmmmmmmmmmmmmmmmddo................oddmmmmmmmmmmmmmmmmddo.............', 85: '...........ossmmmmmmmmmmmmmmmmsso................ossmmmmmmmmmmmmmmmmsso.............', 86: '...........ooolmmmmmmmmmmmmmmdooo................ooolmmmmmmmmmmmmmmdooo.............', 87: '.............odmmmmmmmmmmmmmmdo....................odmmmmmmmmmmmmmmdo...............', 88: '.............osmmmmmmmmmmmmmmso....................osmmmmmmmmmmmmmmso...............', 89: '.............oolmmmmmmmmmmmmdoo....................oolmmmmmmmmmmmmdoo...............', 90: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 91: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 92: '..............odmmmmmmmmmmmmdo......................odmmmmmmmmmmmmdo................', 93: '..............osmmmmmmmmmmmmso......................osmmmmmmmmmmmmso................', 94: '..............oolmmmmmmmmmmdoo......................oolmmmmmmmmmmdoo................', 95: '...............olmmmmmmmmmmdo........................olmmmmmmmmmmdo.................', 96: '...............oddddddddddddo........................oddddddddddddo.................', 97: '...............osssssssssssso........................osssssssssssso.................', 98: '...............oooooooooooooo........................oooooooooooooo.................' }),
    boots: wornF({ 113: '.........................oooooooooooo........oooooooooooo...........................', 114: '........................oollllllllldoo......oollllllllldoo..........................', 115: '.......................oolmmmmmmmmmmdoo....oolmmmmmmmmmmdoo.........................', 116: '.......................olmssssssssssmdo....olmssssssssssmdo.........................', 117: '.......................olmssssssssssmdo....olmssssssssssmdo.........................', 118: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 119: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 120: '......................oolmmmmmmmmmmmmdoo..oolmmmmmmmmmmmmdoo........................', 121: '......................olmmmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmdo........................', 122: '......................olmmmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmdo........................', 123: '.....................oolmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmdoo.......................', 124: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 125: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 126: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 127: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 128: '.....................oddssssssssssssssddooddssssssssssssssddo.......................', 129: '.....................ossssssssssssssssssoosssssssssssssssssso.......................' }),
    shield: wornF({ 56: '...............oooooooooooo.........................................................', 57: '.............ooollllllllldooo.......................................................', 58: '............oollmmmmmmmmmmldoo......................................................', 59: '...........oolmmmmmmmmmmmmmmdoo.....................................................', 60: '..........oolmmmmmmmmmmmmmmmmdoo....................................................', 61: '..........olmmmmmmmmmmmmmmmmmmdo....................................................', 62: '.........oolmmmmmmmmmmmmmmmmmmdoo...................................................', 63: '.........olmmmmmmmmmmmmmmmmmmmmdo...................................................', 64: '........oolmmmmmmmmmmmmmmmmmmmmdoo..................................................', 65: '........olmmmmmmmmmmmmmmmmmmmmmmdo..................................................', 66: '........olmmmmmmmmmmmmmmmmmmmmmmdo..................................................', 67: '.......oolmmmmmmmmmmmmmmmmmmmmmmdoo.................................................', 68: '.......olmmmmmmmmmllllllmmmmmmmmmdo.................................................', 69: '.......olmmmmmmmmmllllllmmmmmmmmmdo.................................................', 70: '.......olmmmmmmmmmllllllmmmmmmmmmdo.................................................', 71: '.......olmmmmmmmmmllllllmmmmmmmmmdo.................................................', 72: '.......olmmmssssssllddllssssssmmmdo.................................................', 73: '.......olmmmssssssllddllssssssmmmdo.................................................', 74: '.......olmmmmmmmmmllllllmmmmmmmmmdo.................................................', 75: '.......odmmmmmmmmmllllllmmmmmmmmmdo.................................................', 76: '.......osmmmmmmmmmllllllmmmmmmmmmso.................................................', 77: '.......oolmmmmmmmmllllllmmmmmmmmdoo.................................................', 78: '........odmmmmmmmmmmmmmmmmmmmmmmdo..................................................', 79: '........osmmmmmmmmmmmmmmmmmmmmmmso..................................................', 80: '........oodmmmmmmmmmmmmmmmmmmmmdoo..................................................', 81: '.........osmmmmmmmmmmmmmmmmmmmmso...................................................', 82: '.........oodmmmmmmmmmmmmmmmmmmdoo...................................................', 83: '..........osdmmmmmmmmmmmmmmmmdso....................................................', 84: '..........oosdmmmmmmmmmmmmmmdsoo....................................................', 85: '...........oosddmmmmmmmmmmddsoo.....................................................', 86: '............oossddddddddddssoo......................................................', 87: '.............ooossssssssssooo.......................................................', 88: '...............oooooooooooo.........................................................' }),
  },
  plate: {
    helm: wornF({ 7: '.....................................oooooooo.......................................', 8: '.....................................ollllldo.......................................', 9: '....................................oolmmmmdoo......................................', 10: '...................................oolmmmmmmdoo.....................................', 11: '..................................oolmmmmmmmmdoo....................................', 12: '...............................ooooolmmmmmmmmdooooo.................................', 13: '.............................ooolloolmmmmmmmmdooldooo...............................', 14: '............................oollmoolmmmmmmmmmmdoomldoo..............................', 15: '...........................oolmmmolmmmmmmmmmmmmdommmdoo.............................', 16: '..........................oollmmmoddddddddddddddommmmdoo............................', 17: '.........................oolllmmmossssssssssssssommmmmdoo...........................', 18: '........................oollllllmoooooooooooooooommmmmmdoo..........................', 19: '........................olllllllmmmmmmmmmmmmmmmmmmmmmmmmdo..........................', 20: '.......................oolllllllllmmmmmmmmmmmmmmmmmmmmmmdoo.........................', 21: '.......................olmllllllllmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 22: '......................oolmmmllllllllmmmmmmmmmmmmmmmmmmmmmdoo........................', 23: '......................olmmmmllllllllmmmmmmmmmmmmmmmmmmmmmmdo........................', 24: '......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 25: '.....................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo.......................', 26: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 27: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 28: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 29: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 30: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 31: '...................ooolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdooo.....................', 32: '...................ollssssssssssssssssssssssssssssssssssssssldo.....................', 33: '...................olmssssssssssssssssssssssssssssssssssssssmdo.....................', 34: '...................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.....................', 35: '...............ooooolmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdooooo.................', 36: '...............oslllmmmmmmmdoooooooooolmllddoooooooooolmmmmmmmlllso.................', 37: '...............oodmmmmmmmmmdo........olmllddo........olmmmmmmmmmdoo.................', 38: '................osmmmmmmmmmdo........olmllddo........olmmmmmmmmmso..................', 39: '................oodmmmmmmmmdo........olmllddo........olmmmmmmmmdoo..................', 40: '.................osmmmmmmmmdo........olmllddo........olmmmmmmmmso...................', 41: '.................oodmmmmmmmdo........olmllddo........olmmmmmmmdoo...................', 42: '..................osdmmmmmmdo........olmllddo........olmmmmmmdso....................', 43: '..................oosmmmmmmdoooooooooolmllddoooooooooolmmmmmmsoo....................', 44: '...................oodmmddddddddddddddddddddddddddddddddddmmdoo.....................', 45: '....................osmmddddddddddddddddddddddddddddddddddmmso......................', 46: '....................oodmmmllllllllllllllllllllllllllllllmmmdoo......................', 47: '.....................osmmmllllllllllllllllllllllllllllllmmmso.......................', 48: '.....................oodmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmdoo.......................', 49: '......................osmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmso........................', 50: '......................ooddddddddAAAAAAAAAAAAAAAAAAddddddddoo........................', 51: '.......................ossssssssAAAAAAAAAAAAAAAAAAsssssssso.........................', 52: '.......................oooooooooosddmmmmmmmmmmddsoooooooooo.........................', 53: '................................oossmmmmmmmmmmssoo..................................', 54: '.................................ooossssssssssooo...................................', 55: '...................................osssssssssso.....................................', 56: '...................................oooooooooooo.....................................' }),
    chest: wornF({ 57: '..........ooooooooooooooooooooooo................ooooooooooooooooooooooo............', 58: '.........oollllllllllllllldoolAAo................oAAloollllllllllllllldoo...........', 59: '........oolmmmmmmmmmmmmmmmmdooAAooooo........oooooAAoolmmmmmmmmmmmmmmmmdoo..........', 60: '........olmmAAAAAAAAAAAAAAmmdommAAldo........ollAAmmolmmAAAAAAAAAAAAAAmmdo..........', 61: '.......oolmmAAAAAAAAAAAAAAmmdoomAAmdoooooooooolmAAmoolmmAAAAAAAAAAAAAAmmdoo.........', 62: '.......olmmmmmmmmmmmmmmmmmmmmdommmAAllldoollllAAmmmolmmmmmmmmmmmmmmmmmmmmdo.........', 63: '.......olmmmmmmmmmmmmmmmmmmmmdommmAAmmmdoolmmmAAmmmolmmmmmmmmmmmmmmmmmmmmdo.........', 64: '.......olmmmssssssssssssssmmmdommmmmAAmmllmmAAmmmmmolmmmssssssssssssssmmmdo.........', 65: '.......olmmmssssssssssssssmmmdommmmmAAmmmmmmAAmmmmmolmmmssssssssssssssmmmdo.........', 66: '.......odmmmllllllllllllllmmmdommmmmmmmmllddmmmmmmmodmmmllllllllllllllmmmdo.........', 67: '.......osmmmllllllllllllllmmmsommmmmmmmmllddmmmmmmmosmmmllllllllllllllmmmso.........', 68: '.......oolmmmmmmmmmmmmmmmmmmdoommmmmmmmmllddmmmmmmmoolmmmmmmmmmmmmmmmmmmdoo.........', 69: '........olmmmmmmmmmmmmmmmmmmdommmmmmmmmmllddmmmmmmmmolmmmmmmmmmmmmmmmmmmdo..........', 70: '........olmmssssssssssssssmmdommmmmmmmmmllddmmmmmmmmolmmssssssssssssssmmdo..........', 71: '........odmmssssssssssssssmmdommmmmmmmmmllddmmmmmmmmodmmssssssssssssssmmdo..........', 72: '........osmmllllllllllllllmmsommmmmmmmmmllddmmmmmmmmosmmllllllllllllllmmso..........', 73: '........oolmllllllllllllllmdoommmmmmmmmmllddmmmmmmmmoolmllllllllllllllmdoo..........', 74: '.........olmmmmmmmmmmmmmmmmdoAmmmmmmmmmmllddmmmmmmmmmolmmmmmmmmmmmmmmmmdo...........', 75: '.........olmmmmmmmmmmmmmmmmdoAmmmmmmmmmmllddmmmmmmmmmolmmmmmmmmmmmmmmmmdo...........', 76: '.........oddddddddddddddddddommmmmmmmmmmllddmmmmmmmmmoddddddddddddddddddo...........', 77: '.........ossssssssssssssssssommmmmmmmmmmllddmmmmmmmmmosssssssssssssssssso...........', 78: '.........oooooooooooooooooooommmmmmmmmmmllddmmmmmmmmmoooooooooooooooooooo...........', 79: '.........................olmmmmmmmmmmmmmllddmmmmmmmmmmmmmdo.........................', 80: '.........................olmmmmmmmmmmmmmllddmmmmmmmmmmmmmdo.........................', 81: '.........................olmmmmmmmmmmmmmllddmmmmmmmmmmmmmdo.........................', 82: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 83: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 84: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 85: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 86: '........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 87: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 88: '........................osssssssssssssssssssssssssssssssssso........................', 89: '.......................oossssssssssssssssssssssssssssssssssoo.......................', 90: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 91: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 92: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 93: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 94: '.......................oooooooooooooooooooooooooooooooooooooo.......................' }),
    legs: wornF({ 95: '.......................oooooooooooooooooooooooooooooooooooooo.......................', 96: '.......................odlAAAAAAAAAAAAldoodlAAAAAAAAAAAAAAldo.......................', 97: '.......................osdAAAAAAAAAAAAdsoosdAAAAAAAAAAAAAAdso.......................', 98: '.......................oosmmmmllmmmmmmsoooosmmmmmmllmmmmmmsoo.......................', 99: '........................oolmmmllmmmmmdoo..oolmmmmmllmmmmmdoo........................', 100: '........................oosssssssssssso...oossssssssssssssoo........................', 101: '......................ooolssssssssssssooooolssssssssssssssdooo......................', 102: '.....................oollmmmmmmmmmmmmmdoollmmmmmmmmmmmmmmmmldoo.....................', 103: '.....................olmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.....................', 104: '.....................odmmmmmmmmmmmmmmmmodmmmmmmmmmmmmmmmmmmmmdo.....................', 105: '.....................osddmmmmmmmmmmmmddosddmmmmmmmmmmmmmmmmddso.....................', 106: '.....................oossdmmmmmmmmmmmssoossdmmmmmmmmmmmmmmdssoo.....................', 107: '......................ooosmmmmmmmmmmdoooooosmmmmmmmmmmmmmmsooo......................', 108: '........................oolmAAAAAAAAmdo...oolmAAAAAAAAAAmdoo........................', 109: '.........................olmAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 110: '.........................oddddddddddddo....oddddddddddddddo.........................', 111: '.........................osssssssssssso....osssssssssssssso.........................', 112: '.........................oooooooooooooo....oooooooooooooooo.........................' }),
    gloves: wornF({ 77: '...............oooooooooooooo........................oooooooooooooo.................', 78: '..............ooAAAAAAAAAAAAoo......................ooAAAAAAAAAAAAoo................', 79: '..............olAAAAAAAAAAAAdo......................olAAAAAAAAAAAAdo................', 80: '.............oolmmmmmmmmmmmmdoo....................oolmmmmmmmmmmmmdoo...............', 81: '............oolmmmmmmmmmmmmmmdoo..................oolmmmmmmmmmmmmmmdoo..............', 82: '............olmmmmmmmmmmmmmmmmdo..................olmmmmmmmmmmmmmmmmdo..............', 83: '...........oolmmmmmmmmmmmmmmmmdoo................oolmmmmmmmmmmmmmmmmdoo.............', 84: '...........osssssssssssssssssssso................osssssssssssssssssssso.............', 85: '...........osssssssssssssssssssso................osssssssssssssssssssso.............', 86: '...........ooolmmmmmmmmmmmmmmdooo................ooolmmmmmmmmmmmmmmdooo.............', 87: '.............odmmmmmmmmmmmmmmdo....................odmmmmmmmmmmmmmmdo...............', 88: '.............osmmmmmmmmmmmmmmso....................osmmmmmmmmmmmmmmso...............', 89: '.............oolmmmmmmmmmmmmdoo....................oolmmmmmmmmmmmmdoo...............', 90: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 91: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 92: '..............odmmmmmmmmmmmmdo......................odmmmmmmmmmmmmdo................', 93: '..............osmmmmmmmmmmmmso......................osmmmmmmmmmmmmso................', 94: '..............oolmmmmmmmmmmdoo......................oolmmmmmmmmmmdoo................', 95: '...............olmmmmmmmmmmdo........................olmmmmmmmmmmdo.................', 96: '...............oddddddddddddo........................oddddddddddddo.................', 97: '...............osssssssssssso........................osssssssssssso.................', 98: '...............oooooooooooooo........................oooooooooooooo.................' }),
    boots: wornF({ 113: '.........................oooooooooooo........oooooooooooo...........................', 114: '........................ooAAAAAAAAAAoo......ooAAAAAAAAAAoo..........................', 115: '.......................oolAAAAAAAAAAdoo....oolAAAAAAAAAAdoo.........................', 116: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 117: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 118: '.......................osssssssssssssso....osssssssssssssso.........................', 119: '.......................osssssssssssssso....osssssssssssssso.........................', 120: '......................oolllllllllllllloo..oolllllllllllllloo........................', 121: '......................ollllllllllllllldo..ollllllllllllllldo........................', 122: '......................olmmmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmdo........................', 123: '.....................oolmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmdoo.......................', 124: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 125: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 126: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 127: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 128: '.....................oddAAAAAAAAAAAAAAddooddAAAAAAAAAAAAAAddo.......................', 129: '.....................ossAAAAAAAAAAAAAAssoossAAAAAAAAAAAAAAsso.......................' }),
    shield: wornF({ 55: '.......oooooooooooooooooooooooooooo.................................................', 56: '.......ollAAAAAAAAAAAAAAAAAAAAAAldo.................................................', 57: '.......olmAAAAAAAAAAAAAAAAAAAAAAmdo.................................................', 58: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 59: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 60: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 61: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 62: '.......olmmmmmmmoooooooooommmmmmmdo.................................................', 63: '.......olmmmmmmoollllllldoommmmmmdo.................................................', 64: '.......olmmmmmoolmmmmmmmmdoommmmmdo.................................................', 65: '.......olmmmmoolmmmmmmmmmmdoommmmdo.................................................', 66: '.......olmmmmolmmmmmmmmmmmmdommmmdo.................................................', 67: '.......olmmmmolmmmmmmmmmmmmdommmmdo.................................................', 68: '.......olmmmmolmmmmmAAmmmmmdommmmdo.................................................', 69: '.......olmmmmodmmmmmAAmmmmmdommmmdo.................................................', 70: '.......olmmmmosdmmmmmmmmmmdsommmmdo.................................................', 71: '.......olmmmmoosdmmmmmmmmdsoommmmdo.................................................', 72: '.......olmmmmmoosddddddddsoommmmmdo.................................................', 73: '.......olmmmmmmoossssssssoommmmmmdo.................................................', 74: '.......olmmmmmmmoooooooooommmmmmmdo.................................................', 75: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 76: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 77: '.......olmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 78: '.......odmmmmmmmmmmmllddmmmmmmmmmdo.................................................', 79: '.......osmmmmmmmmmmmllddmmmmmmmmmso.................................................', 80: '.......oolmmmmmmmmmmllddmmmmmmmmdoo.................................................', 81: '........odmmmmmmmmmmllddmmmmmmmmdo..................................................', 82: '........osmmmmmmmmmmllddmmmmmmmmso..................................................', 83: '........oodmmmmmmmmmllddmmmmmmmdoo..................................................', 84: '.........osdmmmmmmmmllddmmmmmmdso...................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo...................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo....................................................', 87: '...........oosddmmmmmmmmmmddsoo.....................................................', 88: '............oossdddmmmmdddssoo......................................................', 89: '.............ooosssmmmmsssooo.......................................................', 90: '...............ooooddddoooo.........................................................', 91: '..................osssso............................................................', 92: '..................oooooo............................................................' }),
  },
  spiked: {
    helm: wornF({ 2: '....oooo..................................................................oooo......', 3: '....osdoo................................................................oolso......', 4: '....ooddoo..............................................................ooldoo......', 5: '.....osddoo..........................oooooooo..........................ooldso.......', 6: '.....oosmdooo........................ollllldo........................ooolmsoo.......', 7: '......oodmldoo......................oolmmmmdoo......................oollmdoo........', 8: '.......osmmmdoo.....................olmmmmmmdo.....................oolmmmso.........', 9: '.......oodmmmdoo...................oolmmmmmmdoo...................oolmmmdoo.........', 10: '........osmmmmdoo..................olmmmmmmmmdo..................oolmmmmso..........', 11: '........oodmmmmdooo...............oolmmmmmmmmdoo...............ooolmmmmdoo..........', 12: '.........osmmmmmldoo...........ooooolmmmmmmmmdooooo...........oollmmmmmso...........', 13: '.........oodmmmmmmdoo........ooollolmmmmmmmmmmdoldooo........oolmmmmmmdoo...........', 14: '..........osdmmmmmmdoo......oollmoolmmmmmmmmmmdoomldoo......oolmmmmmmdso............', 15: '..........oosmmmmmmmdooo...oolmmmolmmmmmmmmmmmmdommmdoo...ooolmmmmmmmsoo............', 16: '...........oodmmmmmmmlloo.oollmmmoddddddddddddddommmmdoo.oollmmmmmmmdoo.............', 17: '............osmmmmmmmmllooolllmmmossssssssssssssommmmmdooolmmmmmmmmmso..............', 18: '............oodmmmmmmmmmlollllllmoooooooooooooooommmmmmoolmmmmmmmmmdoo..............', 19: '.............osmmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmmmmooolmmmmmmmmmmso...............', 20: '.............oodmmmmmmmmmmllllllllmmmmmmmmmmmmmmmmmmoollmmmmmmmmmmdoo...............', 21: '..............osddddddddddllllllllmmmmmmmmmmmmmmmmmoodddddddddddddso................', 22: '..............oossssssssssssllllllllmmmmmmmmmmmmmmmossssssssssssssoo................', 23: '...............ooooooooooooollllllllmmmmmmmmmmmmmmmoooooooooooooooo.................', 24: '......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 25: '.....................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo.......................', 26: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 27: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 28: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 29: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 30: '.....................olmmmmmmmmmmmmmmmmmAAmmmmmmmmmmmmmmmmmdo.......................', 31: '...................ooolmmmmmmmmmmmmmmmmmAAmmmmmmmmmmmmmmmmmdooo.....................', 32: '...................ollssssssssssssssssssssssssssssssssssssssldo.....................', 33: '...................olmssssssssssssssssssssssssssssssssssssssmdo.....................', 34: '...................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.....................', 35: '...............ooooolmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdooooo.................', 36: '...............oslllmmmmmmmdoooooooooolmllddoooooooooolmmmmmmmlllso.................', 37: '...............oodmmmmmmmmmdo........olmllddo........olmmmmmmmmmdoo.................', 38: '................osmmmmmmmmmdo........olmllddo........olmmmmmmmmmso..................', 39: '................oodmmmmmmmmdo........olmllddo........olmmmmmmmmdoo..................', 40: '.................osmmmmmmmmdo........olmllddo........olmmmmmmmmso...................', 41: '.................oodmmmmmmmdo........olmllddo........olmmmmmmmdoo...................', 42: '..................osdmmmmmmdo........olmllddo........olmmmmmmdso....................', 43: '..................oosmmmmmmdoooooooooolmllddoooooooooolmmmmmmsoo....................', 44: '...................oodmmddddddddddddddddddddddddddddddddddmmdoo.....................', 45: '....................osmmddddddddddddddddddddddddddddddddddmmso......................', 46: '....................oodmmmllllllllllllllllllllllllllllllmmmdoo......................', 47: '.....................osmmmllllllllllllllllllllllllllllllmmmso.......................', 48: '.....................oodmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmdoo.......................', 49: '......................osmmmmmmmmmmmmmmmmllddmmmmmmmmmmmmmmso........................', 50: '......................ooddddddddAAAAAAAAAAAAAAAAAAddddddddoo........................', 51: '.......................ossssssssAAAAAAAAAAAAAAAAAAsssssssso.........................', 52: '.......................oooooooooosddmmmmmmmmmmddsoooooooooo.........................', 53: '................................oossmmmmmmmmmmssoo..................................', 54: '.................................ooossssssssssooo...................................', 55: '...................................osssssssssso.....................................', 56: '...................................oooooooooooo.....................................' }),
    chest: wornF({ 42: '....oooo..................................................................oooo......', 43: '....oldo..................................................................oldo......', 44: 'ooo.oldo..................................................................oldo.oooo.', 45: 'sdoooldoo................................................................ooldooolso.', 46: 'oldoolmdoo..............................................................oolmdooldoo.', 47: 'oldoodmmdo..............................................................olmmdooldo..', 48: 'odmdosmmdo..............................................................olmmsolmdo..', 49: 'osmmdolmdoo............................................................oolmdolmmso..', 50: 'oodmmlmmmdo............................................................olmmmlmmdoo..', 51: '.osmmmmmmdoo..........................................................oolmmmmmmso...', 52: 'ooolmmmmmmdo..........................................................olmmmmmmdoooo.', 53: 'ddodmmmmmmdoo........................................................oolmmmmmmdoldo.', 54: 'sdosmmmmmmmdo........................................................olmmmmmmmsolso.', 55: 'oddolmmmmmmdoo......................................................oolmmmmmmdoldoo.', 56: 'osmlmmmmmmmmdo......................................................olmmmmmmmmlmso..', 57: 'oodmmmmmmmmmdoooooooooooooooooooo................oooooooooooooooooooolmmmmmmmmmdoo..', 58: '.osmmmmmmmmmmdollllllllllldoolAAo................oAAloollllllllllllolmmmmmmmmmmso...', 59: '.oodmmmmmmmmmdoommmmmmmmmmmdooAAooooo........oooooAAoolmmmmmmmmmmmoodmmmmmmmmmdoo...', 60: '..osmmmmmmmmmssoAAAAAAAAAAmmdommAAldo........ollAAmmolmmAAAAAAAAAAossmmmmmmmmmso....', 61: '..oodmmmmmmmdoooAAAAAAAAAAmmdoomAAmdoooooooooolmAAmoolmmAAAAAAAAAAooolmmmmmmmdoo....', 62: '...osmmmmmmmmdommmmmmmmmmmmmmdommmAAllldoollllAAmmmolmmmmmmmmmmmmmmolmmmmmmmmso.....', 63: '...oodmmmmmmddoommmmmmmmmmmmmdommmAAmmoooooommAAmmmolmmmmmmmmmmmmmooddmmmmmmdoo.....', 64: '....osmmmmmmsssossssssssssmmmdommmmmAoollldooAmmmmmolmmmssssssssssosssmmmmmmso......', 65: '....oodmmmmdoooossssssssssmmmdommmmmoolmmmmdoommmmmolmmmssssssssssoooolmmmmdoo......', 66: '.....osmmmmmdoolllllllllllmmmdommmmmolmmmmmmdommmmmodmmmllllllllllloolmmmmmso.......', 67: '.....oodddddddoollllllllllmmmsommmmoolmmmmmmdoommmmosmmmlllllllllloodddddddoo.......', 68: '......ossssssssommmmmmmmmmmmdoommmoolmmmmmmmmdoommmoolmmmmmmmmmmmmosssssssso........', 69: '......oooooooooommmmmmmmmmmmdommmoolmmmmmmmmmmdoommmolmmmmmmmmmmmmoooooooooo........', 70: '........olmmssssssssssssssmmdommoolmmmmmmmmmmmmdoommolmmssssssssssssssmmdo..........', 71: '........odmmssssssssssssssmmdomoolmmmmmmmmmmmmmmdoomodmmssssssssssssssmmdo..........', 72: '........osmmllllllllllllllmmsomosdmmmmmmmmmmmmmmdsomosmmllllllllllllllmmso..........', 73: '........oolmllllllllllllllmdoomoosdmmmmmmmmmmmmdsoomoolmllllllllllllllmdoo..........', 74: '.........olmmmmmmmmmmmmmmmmdoAmmoosdmmmmmmmmmmdsoommmolmmmmmmmmmmmmmmmmdo...........', 75: '.........olmmmmmmmmmmmmmmmmdoAmmmoosdmmmmmmmmdsoommmmolmmmmmmmmmmmmmmmmdo...........', 76: '.........oddddddddddddddddddommmmmoosmmmmmmmmsoommmmmoddddddddddddddddddo...........', 77: '.........ossssssssssssssssssommmmmmoodmmmmmmdoommmmmmosssssssssssssssssso...........', 78: '.........oooooooooooooooooooommmmmmmosdmmmmdsommmmmmmoooooooooooooooooooo...........', 79: '.........................olmmmmmmmmmoosddddsoommmmmmmmmmmdo.........................', 80: '.........................olmmmmmmmmmmoossssoommmmmmmmmmmmdo.........................', 81: '.........................olmmmmmmmmmmmoooooommmmmmmmmmmmmdo.........................', 82: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 83: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 84: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 85: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 86: '........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 87: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 88: '........................osssssssssssssssssssssssssssssssssso........................', 89: '.......................oossssssssssssssssssssssssssssssssssoo.......................', 90: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 91: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 92: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 93: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 94: '.......................oooooooooooooooooooooooooooooooooooooo.......................' }),
    legs: wornF({ 88: '.............................oooo................oooo...............................', 89: '.............................oldo................oldo...............................', 90: '.............................oldo................oldo...............................', 91: '............................ooldoo..............ooldoo..............................', 92: '...........................oolmmdoo............oolmmdoo.............................', 93: '...........................olmmmmdo............olmmmmdo.............................', 94: '...........................olmmmmdo............olmmmmdo.............................', 95: '.......................ooooolmmmmdoooooooooooooolmmmmdooooooo.......................', 96: '.......................odoolmmmmmmdooAldoodlAoolmmmmmmdooAldo.......................', 97: '.......................osoddddddddddoAdsoosdAoddddddddddoAdso.......................', 98: '.......................ooossssssssssomsoooosmossssssssssomsoo.......................', 99: '........................ooooooooooooodoo..ooloooooooooooodoo........................', 100: '........................oosssssssssssso...oossssssssssssssoo........................', 101: '......................ooolssssssssssssooooolssssssssssssssdooo......................', 102: '.....................oollmmmmmmmmmmmmmdoollmmmmmmmmmmmmmmmmldoo.....................', 103: '.....................olmmmmmmmmmmmmmmmmolmmmmmmmmmmmmmmmmmmmmdo.....................', 104: '.....................odmmmmmmmmmmmmmmmmodmmmmmmmmmmmmmmmmmmmmdo.....................', 105: '.....................osddmmmmmmmmmmmmddosddmmmmmmmmmmmmmmmmddso.....................', 106: '.....................oossdmmmmmmmmmmmssoossdmmmmmmmmmmmmmmdssoo.....................', 107: '......................ooosmmmmmmmmmmdoooooosmmmmmmmmmmmmmmsooo......................', 108: '........................oolmAAAAAAAAmdo...oolmAAAAAAAAAAmdoo........................', 109: '.........................olmAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 110: '.........................oddddddddddddo....oddddddddddddddo.........................', 111: '.........................osssssssssssso....osssssssssssssso.........................', 112: '.........................oooooooooooooo....oooooooooooooooo.........................' }),
    gloves: wornF({ 77: '...............oooooooooooooo........................oooooooooooooo.................', 78: '..............ooAAAAAAAAAAAAoo......................ooAAAAAAAAAAAAoo................', 79: '..............olAAAAAAAAAAAAdo......................olAAAAAAAAAAAAdo................', 80: '.............oolmmmmmmmmmmmmdoo....................oolmmmmmmmmmmmmdoo...............', 81: '............oolmmmmmmmmmmmmmmdoo..................oolmmmmmmmmmmmmmmdoo..............', 82: '............ooooommoooommoooomdo..................olmmmoooommoooommoooo.............', 83: '...........ooosdoomosdoomosdoodoo................oolmmoolsomoolsomoolso.............', 84: '...........osooldooooldooooldooso................osssooldooooldooooldoo.............', 85: '...........ooolmmdoolmmdoolmmdooo................ossoolmmdoolmmdoolmmdoo............', 86: '...........oolmmmmllmmmmllmmmmdooo...............oooolmmmmllmmmmllmmmmdo............', 87: '...........ooddddddddddddddddddddoo..............ooddddddddddddddddddddoo...........', 88: '...........osssssssssssssssssssssso..............osssssssssssssssssssssso...........', 89: '...........oooooooooooooooooooooooo..............oooooooooooooooooooooooo...........', 90: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 91: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 92: '..............odmmmmmmmmmmmmdo......................odmmmmmmmmmmmmdo................', 93: '..............osmmmmmmmmmmmmso......................osmmmmmmmmmmmmso................', 94: '..............oolmmmmmmmmmmdoo......................oolmmmmmmmmmmdoo................', 95: '...............olmmmmmmmmmmdo........................olmmmmmmmmmmdo.................', 96: '...............oddddddddddddo........................oddddddddddddo.................', 97: '...............osssssssssssso........................osssssssssssso.................', 98: '...............oooooooooooooo........................oooooooooooooo.................' }),
    boots: wornF({ 113: '.........................oooooooooooo........oooooooooooo...........................', 114: '........................ooAAAAAAAAAAoo......ooAAAAAAAAAAoo..........................', 115: '.......................oolAAAAAAAAAAdoo....oolAAAAAAAAAAdoo.........................', 116: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 117: '.......................olmmmmmmmmmmmmdo....olmmmmmmmmmmmmdo.........................', 118: '.......................osssssssssssssso....osssssssssssssso.........................', 119: '.......................osssssssssssssso....osssssssssssssso.........................', 120: '......................oolllllllllllllloo..oolllllllllllllloo........................', 121: '......................ollllllllllllllldo..ollllllllllllllldo........................', 122: '......................olmmmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmdo........................', 123: '.....................oolmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmdoo.......................', 124: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 125: '..................oooooooooommmmmmmmmmmdoolmmmmmmmmmmmoooooooooo....................', 126: '..................olllllldsommmmmmmmmmmdoolmmmmmmmmmmmosdllllldo....................', 127: '.................oolmmmddsoommmmmmmmmmmdoolmmmmmmmmmmmoosddmmmdoo...................', 128: '.................odddddssooAAAAAAAAAAAddooddAAAAAAAAAAAoossdddddo...................', 129: '.................osssssoooAAAAAAAAAAAAssoossAAAAAAAAAAAAooossssso...................' }),
    shield: wornF({ 48: 'ooo....................................oooo.........................................', 49: 'ddo....................................oldo.........................................', 50: 'sdooo................................ooolso.........................................', 51: 'olldoo..............................oolldoo.........................................', 52: 'odmmdoo............................oolmmdo..........................................', 53: 'osmmmdooo........................ooolmmmso..........................................', 54: 'oolmmmldoo......................oollmmmdoo..........................................', 55: '.olmmmmmdoooooooooooooooooooooooolmmmmmdo...........................................', 56: '.olmmmmmmdooAAAAAAAAAAAAAAAAAAoolmmmmmmdo...........................................', 57: '.odmmmmmmmdooAAAAAAAAAAAAAAAAoolmmmmmmmdo...........................................', 58: '.osmmmmmmmmdooommmmmllddmmmooolmmmmmmmmso...........................................', 59: '.oodddddddddddoommmmllddmmoodddddddddddoo...........................................', 60: 'ooossssssssssssommmmllddmmossssssssssssoooo.........................................', 61: 'ddoooooooooooooommmmllddmmooooooooooooooldo.........................................', 62: 'sdooo..olmmmmmmmoooooooooommmmmmmdo..ooolso.........................................', 63: 'olldoo.olmmmmmmoollllllldoommmmmmdo.oolldoo.........................................', 64: 'odmmdooolmmmmmoolmmmmmmmmdoommmmmdooolmmdo..........................................', 65: 'osmmmdooommmmoolmmmmmmmmmmdoommmmooolmmmso..........................................', 66: 'oolmmmldoommmolmmmmmmmmmmmmdommmoollmmmdoo..........................................', 67: '.olmmmmmdoommolmmmmmmmmmmmmdommoolmmmmmdo...........................................', 68: '.olmmmmmmdoomolmmmmmAAmmmmmdomoolmmmmmmdo...........................................', 69: '.odmmmmmmmdooodmmmmmAAmmmmmdooolmmmmmmmdo...........................................', 70: 'oosmmmmmmmmdooodmmmmmmmmmmdooolmmmmmmmmsooo.........................................', 71: 'ddolddddddddddoodmmmmmmmmdoodddddddddddoldo.........................................', 72: 'sdolsssssssssssosddddddddsosssssssssssdolso.........................................', 73: 'olldooooooooooooossssssssooooooooooooolldoo.........................................', 74: 'odmmdooolmmmmmmmoooooooooommmmmmmdooolmmdo..........................................', 75: 'osmmmdooommmmmmmmmmmllddmmmmmmmmmooolmmmso..........................................', 76: 'oolmmmldoommmmmmmmmmllddmmmmmmmmoollmmmdoo..........................................', 77: '.olmmmmmdoommmmmmmmmllddmmmmmmmoolmmmmmdo...........................................', 78: '.olmmmmmmdoommmmmmmmllddmmmmmmoolmmmmmmdo...........................................', 79: '.odmmmmmmmdoommmmmmmllddmmmmmoolmmmmmmmdo...........................................', 80: '.osmmmmmmmmdooommmmmllddmmmooolmmmmmmmmso...........................................', 81: '.oodddddddddddoommmmllddmmoodddddddddddoo...........................................', 82: '..ossssssssssssommmmllddmmosssssssssssso............................................', 83: '..oooooooooooooommmmllddmmoooooooooooooo............................................', 84: '.........osdmmmmmmmmllddmmmmmmdso...................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo...................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo....................................................', 87: '...........oosddmmmmmmmmmmddsoo.....................................................', 88: '............oossdddmmmmdddssoo......................................................', 89: '.............ooosssmmmmsssooo.......................................................', 90: '...............ooooddddoooo.........................................................', 91: '..................osssso............................................................', 92: '..................oooooo............................................................' }),
  },
  regal: {
    helm: wornF({ 0: '.......................................oooo.........................................', 1: '.......................................oldo.........................................', 2: '.......................................oldo.........................................', 3: '......................................ooldoo........................................', 4: 'ooo...................................olmmdo...................................oooo.', 5: 'sdooE.................................olmmdo..................................oodso.', 6: 'osdoo.....................oooo.......oolmmdoo.......oooo.....................oolsoo.', 7: 'ooddooo...................osdoo......olmmmmdo......oolso...................oooldoo..', 8: '.osdldoo..................ooldo......olmmmmdo......oldoo..................oolldso...', 9: '.oosmmdoo.................olmdoo...E.olmmmmdo.....oolmdo.................oolmmsoo...', 10: '..oodmmdoo................olmmdo....oolmmmmdoo....olmmdo................oolmmdoo....', 11: '...osdmmdooo..............olmmdoo.ooolmmmmmmdooo.oolmmdo...............oolmmdso.....', 12: '...oosmmmldoo...oooo......olmmmdooololmmmmmmdodooolmmmdo......oooo...ooolmmmsoo.....', 13: '....oodmmmmdoo..osdoo.....olmmmmdoloolmmmmmmdoololmmmmdo.....oolso..oollmmmdoo......', 14: '.....osdmmmmdoo.ooldoo...oolmmmmdooolmmmmmmmmdooolmmmmdoo...ooldoo.oolmmmmdso.......', 15: '.....oosmmmmmdoooolmdoo..olmmmmmmdoolmmmmmmmmdoolmmmmmmdo..oolmdoooolmmmmmsoo.......', 16: '......oodmmmmmldoolmmdoo.ollllmmmmdolmmmmmmmmdolmmmmmmmdo.oolmmdoollmmmmmdoo........', 17: '.......osmmmmmmmdolmmmlooollllddddddddddddddddddddddddddooolmmmdolmmmmmmmso.........', 18: '.......oodmmmmmmmlmmmmmdoollllllssssssssssssssssssssssssoolmmmmmlmmmmmmmdoo.........', 19: '........osdmmmmmmmmmmmmmllllllllooooooooooooooooooooooooolmmmmmmmmmmmmmdso..........', 20: '........oosmmmmmmmmmmmmmmdllllllllmmmmmmmmmmmmmmmmmmmmoolmmmmmmmmmmmmmmsoo..........', 21: '......E..oodmmmmmmmmmmmmddllllllllmmmmmmmmmmmmmmmmmmmoodddmmmmmmmmmmmmdoo...........', 22: '..........osdmmmmmmmmmmmssssllllllllmmmmmmmmmmmmmmmmmossssmmmmmmmmmmmdso............', 23: '..........oosmmmmmmmmmmdoooollllllllmmmmmmmmmmmmmmmmmooooolmmmmmmmmmmsoo............', 24: '...........oodmmmmmmmmmmldoommmmmmmmmmmmmmmmmmmmmmmmmmoollmmmmmmmmmmdoo.............', 25: '............osdddddddddddddoommmmmmmmmmmmmmmmmmmmmmmmoodddddddddddddso..............', 26: '............oossssssssssssssommmmmmmmmmmmmmmmmmmmmmmmossssssssssssssoo..............', 27: '.............oooooooooooooooommmmmmmmmmmmmmmmmmmmmmmmoooooooooooooooo...............', 28: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 29: '.....................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 30: '.....................olmmmmmmmmmmmmmmmmmEEmmmmmmmmmmmmmmmmmdo.......................', 31: '...................ooolmmmmmmmmmmmmmmmmmEEmmmmmmmmmmmmmmmmmdooo.....................', 32: '...................ollssssssssssssssssssssssssssssssssssssssldo.....................', 33: '...................olmssssssssssssssssssssssssssssssssssssssmdo.....................', 34: '...................olmAAAAAAAAAAEEAAAAAAAAAAAAAAEEAAAAAAAAAAmdo.....................', 35: '...............ooooolmAAAAAAAAAAEEAAAAAAAAAAAAAAEEAAAAAAAAAAmdooooo.................', 36: '...............osdllmmmmmmmmssssssssssssllddssssssssssssmmmmmmlldso.................', 37: '...............oosdmmmmmmmmmssssssssssssllddssssssssssssmmmmmmmdsoo.................', 38: '................oosdmmmmmmmmmmEEEEEEEEmmllddmmEEEEEEEEmmmmmmmmdsoo..................', 39: '.................oosdmmmmmmmmmEEEEEEEEmmllddmmEEEEEEEEmmmmmmmdsoo...................', 40: '..................oosdmmmmmmmmEEEEEEEEmmllddmmEEEEEEEEmmmmmmdsoo....................', 41: '...................oosdmmmmmmmEEEEEEEEmmllddmmEEEEEEEEmmmmmdsoo.....................', 42: '....................oosdmmmmmmEEddssEEmmllddmmssddEEEEmmmmdsoo......................', 43: '.....................oosdmmmmmEEddssEEmmllddmmssddEEEEmmmdsoo.......................', 44: '......................oosdmmmmddssEEEEmmllddmmEEssddEEmmdsoo........................', 45: '.......................oosdmmmddssEEEEmmllddmmEEssddEEmdsoo.........................', 46: '........................oosdddssssssssssllddssssssssddssoo..........................', 47: '.........................oosddssssssssssllddssssssssddsoo...........................', 48: '..........................oossmmmmmmmmmmllddmmmmmmmmssoo............................', 49: '...........................oosmmmmmmmmmmllddmmmmmmmmsoo.............................', 50: '............................ooddAAAAAAAAAAAAAAAAAAddoo..............................', 51: '.............................ossAAAAAAAAAAAAAAAAAAsso...............................', 52: '.............................oooosddmmmmmmmmmmddsoooo...............................', 53: '................................oossmmmmmmmmmmssoo..................................', 54: '.................................ooossssssssssooo...................................', 55: '...................................osssssssssso.....................................', 56: '...................................oooooooooooo.....................................' }),
    chest: wornF({ 30: '..E.................................................................................', 34: '.......................................EE...........................................', 36: '...oooo....................................................................oooo.....', 37: '...oldo....................................................................oldo.....', 38: '.E.oldo....................................................................oldo..ooo', 39: '...oldoo..................................................................ooldo..old', 40: 'oo.olmdoo................................................................oolmdo.ools', 41: 'dooodmmdo................................................................olmmdoooldo', 42: 'ldoosmmdo................................................................olmmsoolmso', 43: 'ldooolmdoo..............................................................oolmdoooldoo', 44: 'dmdoolmmdo..............................................................olmmdoolmdo.', 45: 'smmdolmmdoo............................................................oolmmdolmmso.', 46: 'olmdodmmmdo............................................................olmmmdolmdoo.', 47: 'odmmlsmmmdo............................................................olmmmslmmdo..', 48: 'osmmdolmmdoo..........................................................oolmmdolmmsooo', 49: 'oolmmlmmmmdo..........................................................olmmmmlmmdoood', 50: '.odmmmmmmmdoo........................................................oolmmmmmmmdoood', 51: 'oosmmmmmmmmdo........................................................olmmmmmmmmsoold', 52: 'doolmmmmmmmdoo......................................................oolmmmmmmmdoolmd', 53: 'ldodmmmmmmmmdo......................................................olmmmmmmmmdolmds', 54: 'lmlsmmmmmmmmdoo....................................................oolmmmmmmmmslmmso', 55: 'dmdolmmmmmmmmdo....................................................olmmmmmmmmdolmdoo', 56: 'smmlmmmmmmmmmdoo..................................................oolmmmmmmmmmlmmso.', 57: 'odmmmmmmmmmmdddoooooooooooooooooo................oooooooooooooooooodddmmmmmmmmmmdoo.', 58: 'osmmmmmmmmmmsssolllllllllldoolAAo................oAAloolllllllllllosssmmmmmmmmmmso..', 59: 'oodmmmmmmmmdoooommmmmmmmmmmdooAAooooo........oooooAAoolmmmmmmmmmmmoooolmmmmmmmmdoo..', 60: '.osmmmmmmmmmdoAAAAAAAAAAAAmmdommAAldo........ollAAmmolmmAAAAAAAAAAAAolmmmmmmmmmsoooo', 61: 'ooodmmmmmmmmdooAAAAAAAAAAAmmdoomAAmdoooooooooolmAAmoolmmAAAAAAAAAAAoolmmmmmmmmdooods', 62: 'doosmmmmmmmmmdommmmmmmmmmmmmmdommmAAllldoollllAAmmmolmmmmmmmmmmmmmmolmmmmmmmmmsoolso', 63: 'ddoodmmmmmmdddoommmmmmmmmmmmmdommmAAmmoooooommAAmmmolmmmmmmmmmmmmmoodddmmmmmmdooldoo', 64: 'smdosmmmmmmssssossssssssssmmmdommmmmAoollldooAmmmmmolmmmssssssssssossssmmmmmmsolmso.', 65: 'odmdolmmmmdooooossssssssssmmmdommmmmoolmmmmdoommmmmolmmmssssssssssooooolmmmmdolmdoo.', 66: 'osmmlmmmmmmdoollllllllllllmmmdommmmmolmmmmmmdommmmmodmmmlllllllllllloolmmmmmmlmmso..', 67: 'oodmmmmmmmmmdollllllllllllmmmsommmmoolmmmmmmdoommmmosmmmllllllllllllolmmmmmmmmmdoo..', 68: '.osdmmmmmmmmdoommmmmmmmmmmmmdoommmoolmmmmmmmmdoommmoolmmmmmmmmmmmmmoolmmmmmmmmdso...', 69: '.oosmmmmmmddddoommmmmmmmmmmmdommmoolmmmmmmmmmmdoommmolmmmmmmmmmmmmooddddmmmmmmsoo...', 70: '..oodmmmmmsssssossssssssssmmdommoolmmmmmmmmmmmmdoommolmmssssssssssosssssmmmmmdoo....', 71: '...osmmmmdoooooossssssssssmmdomoolmmmmmmmmmmmmmmdoomodmmssssssssssoooooolmmmmso.....', 72: '...oodmmmmdoolllllllllllllmmsomosdmmmmmmmmmmmmmmdsomosmmllllllllllllloolmmmmdoo.....', 73: '....osmmmmmdoollllllllllllmdoomoosdmmmmmmmmmmmmdsoomoolmlllllllllllloolmmmmmso......', 74: '....oodmmmmmdoommmmmmmmmmmmdoAmmoosdmmmmmmmmmmdsoommmolmmmmmmmmmmmmoolmmmmmdoo......', 75: '.....osdddddddoommmmmmmmmmmdoAmmmoosdmmmmmmmmdsoommmmolmmmmmmmmmmmoodddddddso.......', 76: '.....oossssssssoddddddddddddoAmmmmoosmmmmmmmmsoommmmmoddddddddddddossssssssoo.......', 77: '......oooooooooossssssssssssoAmmmmmoodmmmmmmdoommmmmmossssssssssssoooooooooo........', 78: '.........ooooooooooooooooooooAmmmmmmosdmmmmdsommmmmmmoooooooooooooooooooo...........', 79: '.........................olmAAmmmmmmoosddddsoommmmmmmmAAmdo.........................', 80: '.........................olmmmmmmmmmmoossssoommmmmmmmmmmmdo.........................', 81: '.........................olmmmmmmmmmmmoooooommmmmmmmmmmmmdo.........................', 82: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 83: '.........................olmAAAAAAAAAAAAAAAAAAAAAAAAAAAAmdo.........................', 84: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 85: '.........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.........................', 86: '........................oolmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdoo........................', 87: '........................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo........................', 88: '........................osssssssssssssssssssssssssssssssssso........................', 89: '.......................oossssssssssssssssssssssssssssssssssoo.......................', 90: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 91: '.......................olmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmdo.......................', 92: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 93: '.......................oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo.......................', 94: '.......................oooooooooooooooooooooooooooooooooooooo.......................' }),
    legs: wornF({ 95: '.......................oooooooooooooooooooooooooooooooooooooo.......................', 96: '.......................odlAAAAAAAAAAAAldoodlAAAAAAAAAAAAAAldo.......................', 97: '.......................osdAAAAAAAAAAAAdsoosdAAAAAAAAAAAAAAdso.......................', 98: '.......................oosmmmmllmmmmmmsoooosmmmmmmllmmmmmmsoo.......................', 99: '........................oolmmmllmmmmmdoo..oolmmmmmllmmmmmdoo........................', 100: '........................oosssssssssssso...oossssssssssssssoo........................', 101: '......................ooolssssssssssssooooolssssssssssssssdooo......................', 102: '.....................oollmmmmmAAmmmmmmdoollmmmmmmmAAmmmmmmmldoo.....................', 103: '.....................olmmmmmmmAAmmmmmmmolmmmmmmmmmAAmmmmmmmmmdo.....................', 104: '.....................odmmmmmmmEEmmmmmmmodmmmmmmmmmEEmmmmmmmmmdo.....................', 105: '.....................osddmmmmmEEmmmmmddosddmmmmmmmEEmmmmmmmddso.....................', 106: '.....................oossdmmmmmmmmmmmssoossdmmmmmmmmmmmmmmdssoo.....................', 107: '......................ooosmmmmmmmmmmdoooooosmmmmmmmmmmmmmmsooo......................', 108: '........................oolmAAAAAAAAmdo...oolmAAAAAAAAAAmdoo........................', 109: '.........................olmAAAAAAAAmdo....olmAAAAAAAAAAmdo.........................', 110: '.........................oddddddddddddo....oddddddddddddddo.........................', 111: '.........................osssssssssssso....osssssssssssssso.........................', 112: '.........................oooooooooooooo....oooooooooooooooo.........................' }),
    gloves: wornF({ 77: '...............oooooooooooooo........................oooooooooooooo.................', 78: '..............ooAAAAAAAAAAAAoo......................ooAAAAAAAAAAAAoo................', 79: '.............oolAAAAAAAAAAAAdoo....................oolAAAAAAAAAAAAdoo...............', 80: '............oolmmmmmmmmmmmmmmdoo..................oolmmmmmmmmmmmmmmdoo..............', 81: '...........oolmmmmmmmmmmmmmmmmdoo................oolmmmmmmmmmmmmmmmmdoo.............', 82: '..........ooloooommoooommoooommdoo..............oolmmmmoooommoooommooooo............', 83: '.........oolmosdoomosdoomosdoommdoo............oolmmmmoolsomoolsomoolsooo...........', 84: '.........oddsooldooooldooooldoosddo............oddsssooldooooldooooldoodo...........', 85: '.........ossoolmmdoolmmdoolmmdoosso............ossssoolmmdoolmmdoolmmdooo...........', 86: '.........oooolmmmmllmmmmllmmmmdoooo............oooooolmmmmllmmmmllmmmmdoo...........', 87: '...........ooddddddddddddddddddddoo..............ooddddddddddddddddddddoo...........', 88: '...........osssssssssssssssssssssso..............osssssssssssssssssssssso...........', 89: '...........oooooooooooooooooooooooo..............oooooooooooooooooooooooo...........', 90: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 91: '..............olmmmmmmmmmmmmdo......................olmmmmmmmmmmmmdo................', 92: '..............odmmmmEEmmmmmmdo......................odmmmmEEmmmmmmdo................', 93: '..............osmmmmEEmmmmmmso......................osmmmmEEmmmmmmso................', 94: '..............oolmmmmmmmmmmdoo......................oolmmmmmmmmmmdoo................', 95: '...............olmmmmmmmmmmdo........................olmmmmmmmmmmdo.................', 96: '...............oddddddddddddo........................oddddddddddddo.................', 97: '...............osssssssssssso........................osssssssssssso.................', 98: '...............oooooooooooooo........................oooooooooooooo.................' }),
    boots: wornF({ 104: '...........oooo....................................................oooo.............', 105: '...........osdoo..................................................oolso.............', 106: '...........ooddoo................................................ooldoo.............', 107: '............osmdoo..............................................oolmso..............', 108: '............oolmdoo............................................oolmdoo..............', 109: '.............odmmdooo........................................ooolmmdo...............', 110: '.............osmmmldoo......................................oollmmmso...............', 111: '.............oolmmmmdoo....................................oolmmmmdoo...............', 112: '..............odmmmmmdoo..................................oolmmmmmdo................', 113: '..............osmmmmmmdoooooooooooooo........oooooooooooooolmmmmmmso................', 114: '..............oolmmmmmmdoooAAAAAAAAAoo......ooAAAAAAAAAooolmmmmmmdoo................', 115: '...............odmmmmmmmldooAAAAAAAAdoo....oolAAAAAAAAoollmmmmmmmdo.................', 116: '...............osmmmmmmmmmdoomEEmmmmmdo....olmmmmmEEmoolmmmmmmmmmso.................', 117: '...............oodddddddddddooEEmmmmmdo....olmmmmmEEoodddddddddddoo.................', 118: '................ossssssssssssosssssssso....ossssssssosssssssssssso..................', 119: '................oooooooooooooosssssssso....ossssssssoooooooooooooo..................', 120: '......................oolllllllllllllloo..oolllllllllllllloo........................', 121: '......................ollllllllllllllldo..ollllllllllllllldo........................', 122: '......................olmmmmmmmmmmmmmmdo..olmmmmmmmmmmmmmmdo........................', 123: '.....................oolmmmmmmmmmmmmmmdoooolmmmmmmmmmmmmmmdoo.......................', 124: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 125: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 126: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 127: '.....................olmmmmmmmmmmmmmmmmdoolmmmmmmmmmmmmmmmmdo.......................', 128: '.....................oddAAAAAAAAAAAAAAddooddAAAAAAAAAAAAAAddo.......................', 129: '.....................ossAAAAAAAAAAAAAAssoossAAAAAAAAAAAAAAsso.......................' }),
    shield: wornF({ 32: 'E...................................................................................', 38: '....................E...............................................................', 42: '............................................oooo....................................', 43: '...........................................oodso....................................', 44: '..........................................oolsoo....................................', 45: 'oo......................................oooldoo.....................................', 46: 'doo....................................oollmdo......................................', 47: 'ldoo..................................oolmmmso......................................', 48: 'lmdoo................................oolmmmdoo......................................', 49: 'lmmdooo............................ooolmmmmso.......................................', 50: 'lmmmldoo..........................oollmmmmdoo.......................................', 51: 'lmmmmmdoo........................oolmmmmmmdo........................................', 52: 'lmmmmmmdooo....................ooolmmmmmmmso........................................', 53: 'dmmmmmmmldoo..................oollmmmmmmmdoo........................................', 54: 'smmmmmmmmmdoo................oolmmmmmmmmmso.oooo....................................', 55: 'odmmmmmmmmmdoooooooooooooooooolmmmmmmmmmdoooodso....................................', 56: 'osmmmmmmmmmmdoooAAAAAAAAAAooolmmmmmmmmmmsooolsoo....................................', 57: 'oodddddddddddddooAAAAAAAAoodddddddddddddoooldoo.....................................', 58: 'dossssssssssssssommmllddmossssssssssssssollmdo......................................', 59: 'ldooooooooooooooommmllddmooooooooooooooolmmmso......................................', 60: 'lmdoo..olmmmmmmmmmmmllddmmmmmmmmmdo..oolmmmdoo......................................', 61: 'lmmdoooolmmmmmmmmmmmllddmmmmmmmmmdoooolmmmmso.......................................', 62: 'lmmmldoolmmmmmmmoooooooooommmmmmmdoollmmmmdoo.......................................', 63: 'lmmmmmdoommmmmmoollllllldoommmmmmoolmmmmmmdo........................................', 64: 'lmmmmmmdooommmoolmmmmmmmmdoommmooolmmmmmmmsooooo....................................', 65: 'dmmmmmmmldoomoolmmmmmmmmmmdoomoollmmmmmmmdooodso....................................', 66: 'smmmmmmmmmdooolmmmEEEEEEmmmdooolmmmmmmmmmsoolsoo....................................', 67: 'olmmmmmmmmmdoolmmmEEEEEEmmmdoolmmmmmmmmmdooldoo.....................................', 68: 'lmmmmmmmmmmmdooommEEEEEEmmooolmmmmmmmmmmmllmdo......................................', 69: 'lmmmdddddddddddoomEEEEEEmoodddddddddddmmmmmmso......................................', 70: 'lmmmssssssssssssomEEEEEEmossssssssssssmmmmmdoo......................................', 71: 'lmmdooooooooooooomEEEEEEmooooooooooooolmmmmso.......................................', 72: 'lmmmldoolmmmmmoosddddddddsoommmmmdoollmmmmdoo.......................................', 73: 'lmmmmmdoommmmmmoossssssssoommmmmmoolmmmmmmdo........................................', 74: 'lmmmmmmdooommmmmoooooooooommmmmooolmmmmmmmso........................................', 75: 'dmmmmmmmldoommmmmmmmllddmmmmmmoollmmmmmmmdoo........................................', 76: 'smmmmmmmmmdoommmmmmmllddmmmmmoolmmmmmmmmmso.........................................', 77: 'odmmmmmmmmmdoommmmmmllddmmmmoolmmmmmmmmmdoo.........................................', 78: 'osmmmmmmmmmmdooommmmllddmmooolmmmmmmmmmmso..........................................', 79: 'oodddddddddddddoommmllddmoodddddddddddddoo..........................................', 80: '.ossssssssssssssommmllddmosssssssssssssso...........................................', 81: '.oooooooooooooooommmllddmoooooooooooooooo...........................................', 82: '........osmmmmmmmmmmllddmmmmmmmmso..................................................', 83: '........oodmmmmmmmmmllddmmmmmmmdoo..................................................', 84: '.........osdmmmmmmmmllddmmmmmmdso...................................................', 85: '.........oosdmmmmmmmllddmmmmmdsoo...................................................', 86: '..........oosdmmmmmmmmmmmmmmdsoo....................................................', 87: '...........oosddmmmmmmmmmmddsoo.....................................................', 88: '............oossdddmmmmdddssoo......................................................', 89: '.............ooosssmmmmsssooo.......................................................', 90: '...............ooooddddoooo.........................................................', 91: '..................osssso............................................................', 92: '..................oooooo............................................................' }),
  },
}

/** Which set of worn art a build uses. */
/** The set a piece belongs to picks its shape. */
export const SET_PROFILE = {
  leather: 'rough',
  iron: 'plate',
  bone: 'spiked',
  verdant: 'spiked',
  gilded: 'regal',
}

const WORN_BUILDS = { male: WORN_MALE, female: WORN_FEMALE }

/** The beta gift is not part of a set, so it borrows the full harness. */
const FOUNDER_OVERLAY = {
  founderChest: worn({ 28: '.............llAAAAAAAAAAAAAAAll............', 29: '............lllssssssssssssssslll...........', 30: '............dmmAmmmmmmmmmmmmmAmmmd..........', 31: '..........dmmm.AmmmmmmmmmmmmmAmmmd..........', 32: '.........dmm...AAmmmmmmmmmmmAA..mmd.........', 33: '.........dm....AmAmmmmmmmmmAmA...md.........', 34: '.........d.....AmmAmmmmmmmAmmA....d.........', 35: '...............AmmmAmmssmAmmmA..............', 36: '...............AmmmmAmssAmmmmA..............', 37: '...............AmmmmmAssmmmmmA..............', 38: '...............AAmmmmmAmmmmmAA..............', 39: '...............AmAmmmmmmmmmAmA..............', 40: '...............AmmAmmmmmmmAmmA..............', 41: '...............AmmmAmmmmmAmmmA..............', 42: '...............sssssssssssssss..............', 43: '...............AAAAAAAAAAAAAAA..............', 44: '...............sssssssssssssss..............' }),
}

export function wornOverlay(build, item, slot) {
  if (!item) return null
  if (item.set === 'founder') return slot === 'chest' ? FOUNDER_OVERLAY.founderChest : null
  const shapes = (WORN_BUILDS[build] ?? WORN_MALE)[SET_PROFILE[item.set] ?? 'plate']
  return shapes?.[item.kind === 'shield' ? 'shield' : slot] ?? null
}



// The map, as an object rather than as a place: a rolled chart with a compass
// sitting on the corner of it. The header shows this instead of a shrunk-down
// Sydney, which at 32 pixels was a smudge of green.
export const MAP_ICON = {
  w: 24,
  h: 24,
  palette: { o: '#0d0b12', p: '#f7dc9a', P: '#efcb7d', r: '#e6a860', n: '#9c6b33', g: '#4c9c30', G: '#38761f', b: '#0e84cc', B: '#0a5f99', w: '#f2f2f2', k: '#3a3a3a', a: '#a8a8a8', x: '#e85018' },
  grid: [
    '...................ooo..',
    '.ooo..............wwkww.',
    'opppo............wkkxkwo',
    'opppo............wkkwkko',
    'opppoooooooooooooowkwkwo',
    'opppoGggggggggppraawwwao',
    'oppporgggggggppppraaanoo',
    'oppporggggggpggppproooro',
    'oppporppkgpppgggpppbBBro',
    'oppporppnnppppggpbbbbpro',
    'oppporppnoppppppbbbpppro',
    'oppporpppppbbbbbbbppppro',
    'oppporpppbbbbbbbbbnnkpro',
    'oppporbbbbppppbbbbbpppro',
    'opppokbbppppppppbbbbbpro',
    'opppokbppppgggpppppbbbro',
    'opooorpppggggggggppppbbo',
    'ookkorppggggggggggppppbo',
    'oonnrrpggggggggggggpppro',
    '.opppppppppppppppppppppo',
    '..oooooooooooooooooooopo',
    '...................onkpo',
    '...................oopro',
    '....................ooo.',
  ],
}


// The blade that lies across the title card, hilt on the left and the point
// running out past the plaque on the right.
export const TITLE_SWORD = {
  w: 52,
  h: 11,
  palette: { o: '#241408', g: '#f0c15a', G: '#b07d1e', h: '#7a4526', H: '#4f2b16', s: '#dfe6f0', w: '#ffffff', S: '#9aa8bd' },
  grid: [
    '...........ogo......................................',
    '..oo......ogggo.....................................',
    '.oggo.....ogggo.....................................',
    'oggggoooooogggoooooooooooooooooooooooooooooooo......',
    'ogggghhhhhhgggwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwoooo..',
    'ogggghhhhhhgggsssssssssssssssssssssssssssssssssssso.',
    'oGGGGHHHHHHGGGSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSoooo..',
    'oGGGGooooooGGGoooooooooooooooooooooooooooooooo......',
    '.oGGo.....oGGGo.....................................',
    '..oo......oGGGo.....................................',
    '...........oGo......................................',
  ],
}

/** Which grids a build uses, bare and dressed. Each build wears its own hair,
 *  so there is no length to key on and nothing else in here. */
const HERO_BODIES = {
  male: { bare: () => HERO_BASE, clothed: () => HERO_GRID },
  female: { bare: () => HERO_BASE_F, clothed: () => HERO_F },
}

export const AVATAR_BODIES = [
  { id: 'male', label: 'MALE' },
  { id: 'female', label: 'FEMALE' },
]

const gridFor = (body, dress) => (HERO_BODIES[body] ?? HERO_BODIES.male)[dress]()

/**
 * The bare body. Armour is drawn onto this rather than over a clothed sprite,
 * which is what stops garments showing through at the edges.
 */
export function heroSprite(skin = SKIN_BASE, hair = HAIR_BASE, shirt = TUNIC, body = 'male') {
  const grid = gridFor(body, 'bare')
  return { w: grid[0].length, h: grid.length, palette: heroPalette(skin, hair, shirt), grid }
}

/** The fully dressed build, for anywhere that wants the character as drawn. */
export function heroClothed(skin = SKIN_BASE, hair = HAIR_BASE, shirt = TUNIC, body = 'male') {
  const grid = gridFor(body, 'clothed')
  return { w: grid[0].length, h: grid.length, palette: heroPalette(skin, hair, shirt), grid }
}

// Where the shoulders are on both builds. The head occupies the top of the
// hero art and the neck lands on the same row either way, so one number cuts a
// bust out of both — hair to collarbone, nothing below it.
const BUST_ROWS = 31

/**
 * The player's face, for the profile picture.
 *
 * This used to be a separate twelve-pixel drawing that knew nothing about the
 * character: same blob whichever body, hair length or skin you picked, with a
 * flat block of colour for the shoulders. It is now the top of the same art
 * the loadout screen shows full length, so a purple-haired woman in the
 * character sheet is a purple-haired woman in the corner of the header.
 */
/** The blank columns the armour reaches into. The body never uses them. */
export const FRAME_PAD = 6

export function heroBust(skin, hair, shirt, body = 'male') {
  const full = heroClothed(skin, hair, shirt, body)
  // Crop the armour margin back off: a profile picture wants the head filling
  // the frame, not a head with six empty columns of shoulder room either side.
  const grid = full.grid.slice(0, BUST_ROWS).map((row) => row.slice(FRAME_PAD, full.w - FRAME_PAD))
  return { w: full.w - FRAME_PAD * 2, h: BUST_ROWS, palette: full.palette, grid }
}

/** The base character's tunic. Onboarding does not offer a shirt colour, so
 *  this is what every hero wears until gear covers it. */
export const TUNIC = '#ac8d5c'
export const SKIN_BASE = '#f0b87b'
export const HAIR_BASE = '#6d3c1c'

export const AVATAR_SKINS = [SKIN_BASE, '#f2cfa0', '#e8b48a', '#c68642', '#8d5524', '#5c3317', '#ffdbac']
export const AVATAR_HAIR = [HAIR_BASE, '#2b1a10', '#7c3aed', '#22d3ee', '#f43f5e', '#fbbf24', '#f2ecff', '#4ade80']
