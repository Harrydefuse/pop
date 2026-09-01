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
const worn = (rows) => {
  const grid = Array.from({ length: HERO_GRID.length }, () => '.'.repeat(HERO_GRID[0].length))
  for (const [y, cells] of Object.entries(rows)) grid[y] = cells
  return { w: HERO_GRID[0].length, h: HERO_GRID.length, grid }
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
    helm: worn({ 5: '...............ooooooooooooooo..............', 6: '..............oolllllllllllldoo.............', 7: '.............oolmmmmmmmmmmmmmdoo............', 8: '.............olmmmmmmmmmmmmmmmdo............', 9: '............oolllllmmmmmmmmmmmdoo...........', 10: '............olmmllllmmmmmmmmmmmdo...........', 11: '...........oolmmmllllmmmmmmmmmmdoo..........', 12: '...........olmmmmmllllmmmmmmmmmmdo..........', 13: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 14: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 15: '..........oolmmmmmmmmmmmmmmmmmmmdoo.........', 16: '..........odsssssssssssssssssssssdo.........', 17: '..........ossdsssdsssdsssdsssdsssso.........', 18: '..........ooooooooooooooooooooooooo.........' }),
    chest: worn({ 28: '........ooooooooooooooooooooooooooooo.......', 29: '.......oolldoolllllllllllllllldoolldoo......', 30: '......oolmmmdoosssssssssssssssoolmmmdoo.....', 31: '.....oolmmmmmdoommmmmmmmmmmmmoolmmmmmdoo....', 32: '.....olmmmmmmmdommmmmmmmmmmmmolmmmmmmmdo....', 33: '.....odmsssssmdommmdmmsmmdmmmodmsssssmdo....', 34: '.....osdmmmmmdsommmmmmsmmmmmmosdmmmmmdso....', 35: '.....oosdmmmdsoommmmmmmmmmmmmoosdmmmdsoo....', 36: '......oosdddsoolmmmdmmsmmdmmmdoosdddsoo.....', 37: '.......oosssooolmmmmmmsmmmmmmdooosssoo......', 38: '........ooooo.olmmmmmmmmmmmmmdo.ooooo.......', 39: '..............osssssslllsssssso.............', 40: '..............oddddddlllddddddo.............', 41: '..............olmmmmmmmmmmmmmdo.............', 42: '.............oolmmmmmmmmmmmmmdoo............', 43: '.............odsssssssssssssssdo............', 44: '.............ossssssssssssssssso............', 45: '.............ooooooooooooooooooo............' }),
    legs: worn({ 45: '............ooooooooooooooooooooo...........', 46: '............oslllllllsoslllllllso...........', 47: '............oosssssssooosssssssoo...........', 48: '............oolmmmmmdooolmmmmmdoo...........', 49: '............osmmmmmmmsosmmmmmmmso...........', 50: '............oolmmmmmdooolmmmmmdoo...........', 51: '.............odsssssdo.odsssssdo............', 52: '.............ossssssso.ossssssso............', 53: '.............ooooooooo.ooooooooo............' }),
    gloves: worn({ 38: '........ooooooo...............ooooooo.......', 39: '.......oolllldoo.............oolllldoo......', 40: '.......olmmmmmdo.............olmmmmmdo......', 41: '......oosssssssoo...........oosssssssoo.....', 42: '......osmmmmmmmso...........osmmmmmmmso.....', 43: '......oodmmmmmdoo...........oodmmmmmdoo.....', 44: '.......osdddddso.............osdddddso......', 45: '.......oosssssoo.............oosssssoo......', 46: '........ooooooo...............ooooooo.......' }),
    boots: worn({ 53: '.............oooooooo...oooooooo............', 54: '............oollllldoo.oollllldoo...........', 55: '............olssssssdo.olssssssdo...........', 56: '...........oolmmmmmmdooolmmmmmmdoo..........', 57: '...........oddddddddddoddddddddddo..........', 58: '...........ossssssssssosssssssssso..........' }),
    shield: worn({ 27: '.........ooo................................', 28: '......oooodoooo.............................', 29: '.....oolllmlldoo............................', 30: '....oolmmmmmmmdoo...........................', 31: '....olmmmmmmmmmdo...........................', 32: '...oolmmmmmmmmmdoo..........................', 33: '...olmmmmmmmmmmmdo..........................', 34: '...olmmmmlllmmmmdo..........................', 35: '...olmmmmlllmmmmdo..........................', 36: '...olmsssldlsssmdo..........................', 37: '...olmmmmlllmmmmdo..........................', 38: '...odmmmmlllmmmmdo..........................', 39: '...osmmmmmmmmmmmso..........................', 40: '...oodmmmmmmmmmdoo..........................', 41: '....osdmmmmmmmdso...........................', 42: '....oosdddmdddsoo...........................', 43: '.....oosssdsssoo............................', 44: '......oooosoooo.............................', 45: '.........ooo................................' }),
  },
  plate: {
    helm: worn({ 3: '....................ooooo...................', 4: '...................oolldoo..................', 5: '..................oolmmmdoo.................', 6: '................oooolmmmdoooo...............', 7: '..............oooloodddddoodooo.............', 8: '.............oollmosssssssomldoo............', 9: '.............ollllooooooooommmdo............', 10: '............oolllllmmmmmmmmmmmdoo...........', 11: '............olmmllllmmmmmmmmmmmdo...........', 12: '...........oolmmmmmmmmmmmmmmmmmdoo..........', 13: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 14: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 15: '..........oolmmmmmmmmmmmmmmmmmmmdoo.........', 16: '..........olsssssssssssssssssssssdo.........', 17: '.........oolAAAAAAAAAAAAAAAAAAAAAdoo........', 18: '.........osmmmmdooooolldooooolmmmmso........', 19: '.........oodmmmdo...olldo...olmmmdoo........', 20: '..........osmmmdo...olldo...olmmmso.........', 21: '..........oodmmdooooolldooooolmmdoo.........', 22: '...........osmdddddddddddddddddmso..........', 23: '...........oodmlllllllllllllllmdoo..........', 24: '............osddddmmmmldmmmddddso...........', 25: '............oossssAAAAAAAAAssssoo...........', 26: '.............ooooossdddddssooooo............', 27: '.................ooosssssooo................', 28: '...................ooooooo..................' }),
    chest: worn({ 28: '.......oooooooooooo.......oooooooooooo......', 29: '......oolllldoollAooo...oooAlloolllldoo.....', 30: '......olAAAAAdommmAdooooolAmmmolAAAAAdo.....', 31: '.....oolmmmmmdoommmAldollAmmmoolmmmmmdoo....', 32: '.....olmsssssmdommmmAmlmAmmmmolmsssssmdo....', 33: '.....odmlllllmdommmmmmldmmmmmodmlllllmdo....', 34: '.....osmmmmmmmsoAmmmmmldmmmmAosmmmmmmmso....', 35: '.....oodsssssdoommmmmmldmmmmmoodsssssdoo....', 36: '......oslllllsolAmmmmmldmmmmAdoslllllso.....', 37: '......oosssssoolmmmmmmldmmmmmdoosssssoo.....', 38: '.......oooooooolmmmmmmldmmmmmdoooooooo......', 39: '..............olmmmmmmldmmmmmdo.............', 40: '..............olAAAAAAAAAAAAAdo.............', 41: '..............olmmmmmmmmmmmmmdo.............', 42: '.............oolmmmmmmmmmmmmmdoo............', 43: '.............ossssssssssssssssso............', 44: '.............oAAAAAAAAAAAAAAAAAo............', 45: '.............ooooooooooooooooooo............' }),
    legs: worn({ 45: '............ooooooooooooooooooooo...........', 46: '............osAAAAAAAsosAAAAAAAso...........', 47: '............oosssssssooosssssssoo...........', 48: '...........oolmmmmmmmoolmmmmmmmdoo..........', 49: '...........osdmmmmmmmosdmmmmmmmdso..........', 50: '...........oosmmmmmmmoosmmmmmmmsoo..........', 51: '............oodAAAAAdooodAAAAAdoo...........', 52: '.............ossssssso.ossssssso............', 53: '.............ooooooooo.ooooooooo............' }),
    gloves: worn({ 38: '........ooooooo...............ooooooo.......', 39: '.......ooAAAAAoo.............ooAAAAAoo......', 40: '.......olmmmmmdo.............olmmmmmdo......', 41: '......oolmmmmmdoo...........oolmmmmmdoo.....', 42: '......ossssssssso...........ossssssssso.....', 43: '......oodmmmmmdoo...........oodmmmmmdoo.....', 44: '.......osdddddso.............osdddddso......', 45: '.......oosssssoo.............oosssssoo......', 46: '........ooooooo...............ooooooo.......' }),
    boots: worn({ 53: '.............oooooooo...oooooooo............', 54: '............ooAAAAAAoo.ooAAAAAAoo...........', 55: '............olmmmmmmdo.olmmmmmmdo...........', 56: '...........oossssssssooossssssssoo..........', 57: '...........odlllllllldodlllllllldo..........', 58: '...........osAAAAAAAAsosAAAAAAAAso..........' }),
    shield: worn({ 27: '...ooooooooooooooo..........................', 28: '...olAAAAAAAAAAAdo..........................', 29: '...olmmmmmldmmmmdo..........................', 30: '...olmmmmooommmmdo..........................', 31: '...olmmooodooommdo..........................', 32: '...olmoollmldoomdo..........................', 33: '...olmolmmmmmdomdo..........................', 34: '...olmodmmAmmdomdo..........................', 35: '...olmosddmddsomdo..........................', 36: '...olmoossdssoomdo..........................', 37: '...olmmooosooommdo..........................', 38: '...olmmmmooommmmdo..........................', 39: '...odmmmmmldmmmmdo..........................', 40: '...osmmmmmldmmmmso..........................', 41: '...oodmmmmldmmmdoo..........................', 42: '....osdmmmldmmdso...........................', 43: '....oosddmmmddsoo...........................', 44: '.....oossdddssoo............................', 45: '......ooosssooo.............................', 46: '........ooooo...............................' }),
  },
  spiked: {
    helm: worn({ 1: '...ooo.................................ooo..', 2: '...osoo.............ooooo.............ooso..', 3: '...oodooo...........olldo...........ooodoo..', 4: '....osddoo.........oolmdoo.........ooldso...', 5: '....oosmdoo.......oolmmmdoo.......oolmsoo...', 6: '.....oolmdoo....oooolmmmdoooo....oolmdoo....', 7: '.....osdmmdoo.ooolodddddddodooo.oolmmdso....', 8: '.....oosmmmdooollmosssssssomldooolmmmsoo....', 9: '......oodmmmdollllooooooooommooolmmmdoo.....', 10: '.......osddddddllllmmmmmmmmmooddddddso......', 11: '.......oosssssssllllmmmmmmmmosssssssoo......', 12: '........ooooooooommmmmmmmmmmooooooooo.......', 13: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 14: '...........olmmmmmmmmmmmmmmmmmmmdo..........', 15: '..........oolmmmmmmmmmAmmmmmmmmmdoo.........', 16: '..........olsssssssssssssssssssssdo.........', 17: '.........oolAAAAAAAAAAAAAAAAAAAAAdoo........', 18: '.........osmmmmdooooolldooooolmmmmso........', 19: '.........oodmmmdo...olldo...olmmmdoo........', 20: '..........osmmmdo...olldo...olmmmso.........', 21: '..........oodmmdooooolldooooolmmdoo.........', 22: '...........osmdddddddddddddddddmso..........', 23: '...........oodmlllllllllllllllmdoo..........', 24: '............osddddmmmmldmmmddddso...........', 25: '............oossssAAAAAAAAAssssoo...........', 26: '.............ooooossdddddssooooo............', 27: '.................ooosssssooo................', 28: '...................ooooooo..................' }),
    chest: worn({ 21: '...ooo.................................ooo..', 22: '.ooosoo...............................oosooo', 23: '.osoodo...............................odooso', 24: '.oododoo.............................oododoo', 25: '..oslmdoo...........................oolmlso.', 26: '.ooolmmdo...........................olmmdooo', 27: '.osdmmmdo...........................olmmmdso', 28: '.oosmmmdooooooooooo.......ooooooooooolmmmsoo', 29: '..oolmmmdooldoollAooo...oooAlloolloodmmmdoo.', 30: '..osdmmmssoAAdommmAdooooolAmmmolAAossmmmdso.', 31: '..oosmmdooommdoommddddmddddmmoolmmooolmmsoo.', 32: '...oolmmssossmdommdddmmmdddmmolmssossmmdoo..', 33: '....odddooollmdommddmmlmmddmmodmllooodddo...', 34: '....osssssommmsoAodmmlAlmmdoAosmmmossssso...', 35: '....ooooooossdoomommlAAAlmmomoodssooooooo...', 36: '......oslllllsolAodmmlAlmmdoAdoslllllso.....', 37: '......oosssssoolmmddmmlmmddmmdoosssssoo.....', 38: '.......oooooooolmmdddmmmdddmmdoooooooo......', 39: '..............olmmddddmddddmmdo.............', 40: '..............olAAAAAoooAAAAAdo.............', 41: '..............olmmmmmmmmmmmmmdo.............', 42: '.............oolmmmmmmmmmmmmmdoo............', 43: '.............ossssssssssssssssso............', 44: '.............oAAAAAAAAAAAAAAAAAo............', 45: '.............ooooooooooooooooooo............' }),
    legs: worn({ 41: '................ooo.......ooo...............', 42: '................odo.......odo...............', 43: '...............oodoo.....oodoo..............', 44: '..............oolmdoo...oolmdoo.............', 45: '............ooodddddooooodddddooo...........', 46: '............ososssssosososssssoso...........', 47: '............ooooooooooooooooooooo...........', 48: '...........oolmmmmmmmoolmmmmmmmdoo..........', 49: '...........osdmmmmmmmosdmmmmmmmdso..........', 50: '...........oosmmmmmmmoosmmmmmmmsoo..........', 51: '............oodAAAAAdooodAAAAAdoo...........', 52: '.............ossssssso.ossssssso............', 53: '.............ooooooooo.ooooooooo............' }),
    gloves: worn({ 38: '.......ooooooooo..............oooooooooo....', 39: '.......odoodoodooo...........ooodoodoodo....', 40: '......oodddddddddoo.........oodddddddddoo...', 41: '......ossssssssssso.........ossssssssssso...', 42: '......ooooooooooooo.........ooooooooooooo...', 43: '......oodmmmmmdoo...........oodmmmmmdoo.....', 44: '.......osdddddso.............osdddddso......', 45: '.......oosssssoo.............oosssssoo......', 46: '........ooooooo...............ooooooo.......' }),
    boots: worn({ 53: '.............oooooooo...oooooooo............', 54: '............ooAAAAAAoo.ooAAAAAAoo...........', 55: '............olmmmmmmdo.olmmmmmmdo...........', 56: '.........ooooooosssssooosssssooooooo........', 57: '.........odddssollllldodlllllossdddo........', 58: '.........osssoooAAAAAsosAAAAAooossso........' }),
    shield: worn({ 24: 'oo.................ooo......................', 25: 'soo...............ooso......................', 26: 'odooo...........ooodoo......................', 27: 'olldooooooooooooolldoo......................', 28: 'sdmmdooAAAAAAAoolmmdso......................', 29: 'osddddoommldmooddddsoo......................', 30: 'oosssssomooomosssssooo......................', 31: 'sooooooooodoooooooooso......................', 32: 'odooomoollmldoomooodoo......................', 33: 'olldooolmmmmmdooolldoo......................', 34: 'sdmmdoodmmAmmdoolmmdso......................', 35: 'osddddooddmddooddddsoo......................', 36: 'sosssssossdssosssssoso......................', 37: 'odoooooooosoooooooodoo......................', 38: 'olldoommmooommmoolldoo......................', 39: 'sdmmdoommmldmmoolmmdso......................', 40: 'osddddoommldmooddddsoo......................', 41: 'oosssssommldmosssssoo.......................', 42: '.ooooooommldmooooooo........................', 43: '....oosddmmmddsoo...........................', 44: '.....oossdddssoo............................', 45: '......ooosssooo.............................', 46: '........ooooo...............................' }),
  },
  regal: {
    helm: worn({ 0: '.....................ooo....................', 1: '.....................odo....................', 2: '.ooo................oodoo................ooo', 3: '.odo...........ooo..olmdo..ooo...........odo', 4: '.odooo.........odo..olmdo..odo.........ooodo', 5: '.osddEo.......oodoooolmdoooodoo.......ooldso', 6: '.oosmdoo..ooo.olmdoolmmmdoolmdo.ooo..oolmsoo', 7: '..oodmdoooodo.olmdoolmmmdoolmdo.odoooolmdoo.', 8: '...osdmldoodooolldddddddddddddooodoollmdso..', 9: '...oosdmmdolldllllssssssssssssolldolmmdsoo..', 10: '....oosmmmlmmmdllllooooooooooodmmmlmmmsoo...', 11: '.....oodmmmmmmssllllmmmmmmmmossmmmmmmdoo....', 12: '......osddddddooommmmmmmmmmmoooddddddso.....', 13: '......oosssssssommmmmmmmmmmmmosssssssoo.....', 14: '.......ooooooooommmmmmmmmmmmmooooooooo......', 15: '..........oolmmmmmmmmmEmmmmmmmmmdoo.........', 16: '..........olsssssssssssssssssssssdo.........', 17: '.........oolAAAAAAEAAAAAAAEAAAAAAdoo........', 18: '.........osdmmmssssssmldssssssmmmdso........', 19: '.........oosdmmmEEEEmmldmEEEEmmmdsoo........', 20: '..........oosdmmEEEEmmldmEEEEmmdsoo.........', 21: '.......E...oosdmEEdsmmldmsdEEmdsoo..........', 22: '............oosssdsssmldsssdsssoo...........', 23: '.............oosdsmmmmldmmmsdsoo............', 24: '..............oosdmmmmldmmmdsoo.............', 25: '...............oosAAAAAAAAAsoo..............', 26: '................oossdddddssoo...............', 27: '.................ooosssssooo................', 28: '...................ooooooo..................' }),
    chest: worn({ 18: '...ooo.................................ooo..', 19: 'oooodo.................................odooo', 20: 'osoosoo...............................oosoos', 21: 'oodoodo...............................odoodo', 22: '.osoodoo.............................oodooso', 23: '.oolsmdoo...........................oolmsdoo', 24: 'ooodolmdo...........................olmdodoo', 25: 'ododlmmdo...........................olmmldod', 26: 'ososmmmdo...........................olmmmsos', 27: 'oosolmmdoo.........................oolmmdoso', 28: '.oolmmmmdoooooooooo.......oooooooooodmmmmdoo', 29: '.osmmmmmssoldoollAooo...oooAlloollossmmmmmso', 30: '.oEdmmmdoooAAdommmAdooooolAmmmolAAooolmmmdoo', 31: '.odsdmmmdoommdoommddddmddddmmoolmmoodmmmdsdo', 32: '.ososmmmssossmdommdddmmmdddmmolmssossmmmsoso', 33: '.oodolmdooollmdommddmmlmmddmmodmllooolmdodEo', 34: '..oslmmdooommmsoAodmmlElmmdoAosmmmooodmmlso.', 35: '..oodmmsssossdooAommlEEElmmoAoodssosssmmdoo.', 36: '...osmdoooollsolEodmmlElmmdoEdoslloooolmso..', 37: '.E.oodddooossoolAmddmmlmmddmAdoossooodddoo..', 38: '....osssssooooolAmdddmmmdddmAdooooossssso...', 39: '....ooooooo...olmmddddmddddmmdo...ooooooo...', 40: '..............olAAAAAoooAAAAAdo.............', 41: '..............olmmmmmmmmmmmmmdo.............', 42: '.............oolmmmmmmmmmmmmmdoo............', 43: '.............ossssssssssssssssso............', 44: '.............oAAAAAAAAAAAAAAAAAo............', 45: '.........E...ooooooooooooooooooo............' }),
    legs: worn({ 45: '............ooooooooooooooooooooo...........', 46: '............osAAAAAAAsosAAAAAAAso...........', 47: '............oosssssssooosssssssoo...........', 48: '...........oolmmmAmmmoolmmmAmmmdoo..........', 49: '...........osdmmmEmmmosdmmmEmmmdso..........', 50: '...........oosmmmmmmmoosmmmmmmmsoo..........', 51: '............oodAAAAAdooodAAAAAdoo...........', 52: '.............ossssssso.ossssssso............', 53: '.............ooooooooo.ooooooooo............' }),
    gloves: worn({ 38: '.......ooooooooo..............oooooooooo....', 39: '.......odoodoodooo...........ooodoodoodo....', 40: '......oodddddddddoo.........oodddddddddoo...', 41: '.....oossssssssssso........oossssssssssso...', 42: '.....oooooooooooooo........oooooooooooooo...', 43: '.....ooodmmEmmdooo.........ooodmmEmmdooo....', 44: '.......osdddddso.............osdddddso......', 45: '.......oosssssoo.............oosssssoo......', 46: '........ooooooo...............ooooooo.......' }),
    boots: worn({ 49: '.......ooo.........................ooo......', 50: '.......odo.........................odo......', 51: '.......odooo.....................ooodo......', 52: '.......osldoo...................oollso......', 53: '.......oolmdooooooooo...ooooooooolmdoo......', 54: '.......osdmmdooAAAAAoo.ooAAAAAoolmmdso......', 55: '.......oosddddooEmmmdo.olmmEmooddddsoo......', 56: '........oosssssosssssooosssssosssssoo.......', 57: '.........ooooooollllldodlllllooooooo........', 58: '...........osAAAAAAAAsosAAAAAAAAso..........' }),
    shield: worn({ 21: '.....................ooo....................', 22: '....................ooso....................', 23: 'ooo...............ooodoo....................', 24: 'ldoo.............oollso.....................', 25: 'lmdoo...........oolmdoo.....................', 26: 'lmmdoo.........oolmmmso.....................', 27: 'dmmmdooooooooooolmmmdooo....................', 28: 'smdddddooAAAoodddddmsoso....................', 29: 'olssssssomldossssssdodoo....................', 30: 'ldooooooooooooooooollso.....................', 31: 'lmdoommooodooommoolmdoo.....................', 32: 'lmmdoooollmldoooolmmmsoo....................', 33: 'lmmmdooomEEEmooolmmmdoso....................', 34: 'lmmddddooEEEooddddmmmdoo....................', 35: 'lmmsssssoEEEosssssmmmso.....................', 36: 'lmdoooooosdsoooooolmdoo.....................', 37: 'lmmdoomooosooomoolmmmso.....................', 38: 'dmmmdooomooomooolmmmdoo.....................', 39: 'sddddddoomldooddddddso......................', 40: 'osssssssomldosssssssoo......................', 41: 'ooooooooomldooooooooo.......................', 42: '....osdmmmldmmdso...........................', 43: '....oosddmmmddsoo...........................', 44: '.....oossdddssoo............................', 45: '......ooosssooo.............................', 46: '........ooooo...............................' }),
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
  const grid = Array.from({ length: HERO_F.length }, () => '.'.repeat(HERO_F[0].length))
  for (const [y, cells] of Object.entries(rows)) grid[y] = cells
  return { w: HERO_F[0].length, h: HERO_F.length, grid }
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
    helm: wornF({ 5: '..............ooooooooooooo...............', 6: '.............oolllllllllldoo..............', 7: '............oolmmmmmmmmmmmdoo.............', 8: '...........oolmmmmmmmmmmmmmdoo............', 9: '...........olllllmmmmmmmmmmmdo............', 10: '...........olmllllmmmmmmmmmmdo............', 11: '..........oolmmllllmmmmmmmmmdoo...........', 12: '..........olmmmmllllmmmmmmmmmdo...........', 13: '..........olmmmmmmmmmmmmmmmmmdo...........', 14: '..........olmmmmmmmmmmmmmmmmmdo...........', 15: '.........oolmmmmmmmmmmmmmmmmmdoo..........', 16: '.........odsssssssssssssssssssdo..........', 17: '.........ossdsssdsssdsssdsssdsso..........', 18: '.........ooooooooooooooooooooooo..........' }),
    chest: wornF({ 28: '.......ooooooooooooooooooooooooooo........', 29: '......oolldoollllllllllllllloolldoo.......', 30: '.....oolmmmdoosssssssssssssoolmmmdoo......', 31: '....oolmmmmmdoommmmmmmmmmmoolmmmmmdoo.....', 32: '....olmmmmmmmdommmmmmmmmmmolmmmmmmmdo.....', 33: '....odmsssssmdommdmmsmmdmmodmsssssmdo.....', 34: '....osdmmmmmdsommmmmsmmmmmosdmmmmmdso.....', 35: '....oosdmmmdsoommmmmmmmmmmoosdmmmdsoo.....', 36: '.....oosdddsoommmdmmsmmdmmmoosdddsoo......', 37: '......oosssoolmmmmmmsmmmmmmmoosssoo.......', 38: '.......oooooolmmmmmmmmmmmmmmdooooo........', 39: '............olmmmmmmmmmmmmmmdo............', 40: '............osssssslllssssssso............', 41: '............oddddddllldddddddo............', 42: '............olmmmmmmmmmmmmmmdo............', 43: '...........oolmmmmmmmmmmmmmmdo............', 44: '...........olssssssssssssssssoo...........', 45: '...........oddddddddddddddddddo...........', 46: '...........osssssssssssssssssso...........', 47: '...........oooooooooooooooooooo...........' }),
    legs: wornF({ 47: '...........oooooooooooooooooooo...........', 48: '...........odllllllsoslllllllso...........', 49: '...........osmmmmmdooolmmmmmdoo...........', 50: '...........oosssssso.ossssssso............', 51: '...........olmmmmmdooolmmmmmdoo...........', 52: '...........odmmmmmdoosmmmmmmmso...........', 53: '...........osmmmmmdooolmmmmmdoo...........', 54: '...........oodssssdo.odsssssdo............', 55: '............osssssso.ossssssso............', 56: '............oooooooo.ooooooooo............' }),
    gloves: wornF({ 38: '.......oooooooo...........oooooooo........', 39: '......oollllldoo.........oollllldoo.......', 40: '......olmmmmmmdo.........olmmmmmmdo.......', 41: '.....oossssssssoo.......oossssssssoo......', 42: '.....osmmmmmmmmso.......osmmmmmmmmso......', 43: '.....oolmmmmmmdoo.......oolmmmmmmdoo......', 44: '......odmmmmmmdo.........odmmmmmmdo.......', 45: '......osmmmmmmso.........osmmmmmmso.......', 46: '......oolmmmmdoo.........oolmmmmdoo.......', 47: '.......oddddddo...........oddddddo........', 48: '.......osssssso...........osssssso........', 49: '.......oooooooo...........oooooooo........' }),
    boots: wornF({ 56: '............ooooooo...ooooooo.............', 57: '...........oolllldoo.oolllldoo............', 58: '...........olsssssdo.olsssssdo............', 59: '...........olmmmmmdo.olmmmmmdo............', 60: '...........olmmmmmdo.olmmmmmdo............', 61: '..........oolmmmmmdooolmmmmmdoo...........', 62: '..........olmmmmmmmdolmmmmmmmdo...........', 63: '..........odddddddddodddddddddo...........', 64: '..........osssssssssossssssssso...........' }),
    shield: wornF({ 27: '.........ooo..............................', 28: '......oooodoooo...........................', 29: '.....oolllmlldoo..........................', 30: '....oolmmmmmmmdoo.........................', 31: '....olmmmmmmmmmdo.........................', 32: '...oolmmmmmmmmmdoo........................', 33: '...olmmmmmmmmmmmdo........................', 34: '...olmmmmlllmmmmdo........................', 35: '...olmmmmlllmmmmdo........................', 36: '...olmsssldlsssmdo........................', 37: '...olmmmmlllmmmmdo........................', 38: '...odmmmmlllmmmmdo........................', 39: '...osmmmmmmmmmmmso........................', 40: '...oodmmmmmmmmmdoo........................', 41: '....osdmmmmmmmdso.........................', 42: '....oosdddmdddsoo.........................', 43: '.....oosssdsssoo..........................', 44: '......oooosoooo...........................', 45: '.........ooo..............................' }),
  },
  plate: {
    helm: wornF({ 3: '..................ooooo...................', 4: '.................oolldoo..................', 5: '................oolmmmdoo.................', 6: '..............oooolmmmdoooo...............', 7: '.............ooloodddddoodoo..............', 8: '............oolmosssssssomdoo.............', 9: '...........oolllooooooooommdoo............', 10: '...........olllllmmmmmmmmmmmdo............', 11: '..........oolmllllmmmmmmmmmmdoo...........', 12: '..........olmmmmmmmmmmmmmmmmmdo...........', 13: '..........olmmmmmmmmmmmmmmmmmdo...........', 14: '..........olmmmmmmmmmmmmmmmmmdo...........', 15: '.........oolmmmmmmmmmmmmmmmmmdoo..........', 16: '.........olsssssssssssssssssssdo..........', 17: '.......ooolAAAAAAAAAAAAAAAAAAAdooo........', 18: '.......oslmmmdooooolldooooolmmmlso........', 19: '.......oodmmmdo...olldo...olmmmdoo........', 20: '........osmmmdo...olldo...olmmmso.........', 21: '........oodmmdooooolldooooolmmdoo.........', 22: '.........osmdddddddddddddddddmso..........', 23: '.........oodmlllllllllllllllmdoo..........', 24: '..........osddddmmmmldmmmddddso...........', 25: '..........oossssAAAAAAAAAssssoo...........', 26: '...........ooooossdddddssooooo............', 27: '...............ooosssssooo................', 28: '.................ooooooo..................' }),
    chest: wornF({ 28: '......ooooooooooo.......ooooooooooo.......', 29: '.....oolllldoolAooo...oooAloolllldoo......', 30: '.....olAAAAAdommAdooooolAmmolAAAAAdo......', 31: '....oolmmmmmdoommAldollAmmoolmmmmmdoo.....', 32: '....olmsssssmdommmAmlmAmmmolmsssssmdo.....', 33: '....odmlllllmdommmmmldmmmmodmlllllmdo.....', 34: '....osmmmmmmmsommmmmldmmmmosmmmmmmmso.....', 35: '....oodsssssdoommmmmldmmmmoodsssssdoo.....', 36: '.....oslllllsommmmmmldmmmmmoslllllso......', 37: '.....oosssssooAmmmmmldmmmmmoosssssoo......', 38: '......ooooooolmmmmmmldmmmmmmooooooo.......', 39: '............olmmmmmmldmmmmmmdo............', 40: '............olmmmmmmldmmmmmmdo............', 41: '............olAAAAAAAAAAAAAAdo............', 42: '............olmmmmmmmmmmmmmmdo............', 43: '...........oolmmmmmmmmmmmmmmdo............', 44: '...........osssssssssssssssssoo...........', 45: '...........oddddddddddddddddddo...........', 46: '...........oAAAAAAAAAAAAAAAAAAo...........', 47: '...........oooooooooooooooooooo...........' }),
    legs: wornF({ 47: '...........oooooooooooooooooooo...........', 48: '...........odAAAAAAsosAAAAAAAso...........', 49: '...........osmmlmmdooolmmlmmdoo...........', 50: '...........oossssssooosssssssoo...........', 51: '..........oolmmmmmdoolmmmmmmmdoo..........', 52: '..........osdmmmmmmosdmmmmmmmdso..........', 53: '..........oosmmmmmdoosmmmmmmmsoo..........', 54: '...........oodAAAAdooodAAAAAdoo...........', 55: '............osssssso.ossssssso............', 56: '............oooooooo.ooooooooo............' }),
    gloves: wornF({ 38: '.......oooooooo...........oooooooo........', 39: '......ooAAAAAAoo.........ooAAAAAAoo.......', 40: '......olmmmmmmdo.........olmmmmmmdo.......', 41: '.....oolmmmmmmdoo.......oolmmmmmmdoo......', 42: '.....osssssssssso.......osssssssssso......', 43: '.....oolmmmmmmdoo.......oolmmmmmmdoo......', 44: '......odmmmmmmdo.........odmmmmmmdo.......', 45: '......osmmmmmmso.........osmmmmmmso.......', 46: '......oolmmmmdoo.........oolmmmmdoo.......', 47: '.......oddddddo...........oddddddo........', 48: '.......osssssso...........osssssso........', 49: '.......oooooooo...........oooooooo........' }),
    boots: wornF({ 56: '............ooooooo...ooooooo.............', 57: '...........ooAAAAAoo.ooAAAAAoo............', 58: '...........olmmmmmdo.olmmmmmdo............', 59: '...........ossssssso.ossssssso............', 60: '...........olllllllo.olllllllo............', 61: '..........oolmmmmmdooolmmmmmdoo...........', 62: '..........olmmmmmmmdolmmmmmmmdo...........', 63: '..........odddddddddodddddddddo...........', 64: '..........osAAAAAAAsosAAAAAAAso...........' }),
    shield: wornF({ 27: '...ooooooooooooooo........................', 28: '...olAAAAAAAAAAAdo........................', 29: '...olmmmmmldmmmmdo........................', 30: '...olmmmmooommmmdo........................', 31: '...olmmooodooommdo........................', 32: '...olmoollmldoomdo........................', 33: '...olmolmmmmmdomdo........................', 34: '...olmodmmAmmdomdo........................', 35: '...olmosddmddsomdo........................', 36: '...olmoossdssoomdo........................', 37: '...olmmooosooommdo........................', 38: '...olmmmmooommmmdo........................', 39: '...odmmmmmldmmmmdo........................', 40: '...osmmmmmldmmmmso........................', 41: '...oodmmmmldmmmdoo........................', 42: '....osdmmmldmmdso.........................', 43: '....oosddmmmddsoo.........................', 44: '.....oossdddssoo..........................', 45: '......ooosssooo...........................', 46: '........ooooo.............................' }),
  },
  spiked: {
    helm: wornF({ 1: '..ooo...............................ooo...', 2: '..osoo............ooooo............ooso...', 3: '..oodooo..........olldo..........ooodoo...', 4: '...osldoo........oolmdoo........oollso....', 5: '...oolmdo.......oolmmmdoo.......olmdoo....', 6: '....odmdooo...oooolmmmdoooo...ooolmdo.....', 7: '....osdmldoo.oolodddddddodoo.oollmdso.....', 8: '....oosmmmdooolmosssssssomdooolmmmsoo.....', 9: '.....oodmmmdolllooooooooomooolmmmdoo......', 10: '......osdddddllllmmmmmmmmooddddddso.......', 11: '......oossssssllllmmmmmmmosssssssoo.......', 12: '.......ooooooooommmmmmmmmooooooooo........', 13: '..........olmmmmmmmmmmmmmmmmmdo...........', 14: '..........olmmmmmmmmmmmmmmmmmdo...........', 15: '.........oolmmmmmmmmAmmmmmmmmdoo..........', 16: '.........olsssssssssssssssssssdo..........', 17: '.......ooolAAAAAAAAAAAAAAAAAAAdooo........', 18: '.......oslmmmdooooolldooooolmmmlso........', 19: '.......oodmmmdo...olldo...olmmmdoo........', 20: '........osmmmdo...olldo...olmmmso.........', 21: '........oodmmdooooolldooooolmmdoo.........', 22: '.........osmdddddddddddddddddmso..........', 23: '.........oodmlllllllllllllllmdoo..........', 24: '..........osddddmmmmldmmmddddso...........', 25: '..........oossssAAAAAAAAAssssoo...........', 26: '...........ooooossdddddssooooo............', 27: '...............ooosssssooo................', 28: '.................ooooooo..................' }),
    chest: wornF({ 21: '..ooo...............................ooo...', 22: 'ooosoo.............................oosooo.', 23: 'osoodo.............................odooso.', 24: 'oododoo...........................oododoo.', 25: '.oslmdoo.........................oolmlso..', 26: 'ooolmmdo.........................olmmdooo.', 27: 'osdmmmdo.........................olmmmdso.', 28: 'oosmmmdoooooooooo.......oooooooooolmmmsoo.', 29: '.oolmmmdooldoolAooo...oooAloolloodmmmdoo..', 30: '.osdmmmssoAAdommAdooooolAmmolAAossmmmdso..', 31: '.oosmmdooommdoommAlooolAmmoolmmooolmmsoo..', 32: '..oolmmssossmdomddddmddddmolmssossmmdoo...', 33: '...odddooollmdomdddmmmdddmodmllooodddo....', 34: '...osssssommmsomddmmlmmddmosmmmossssso....', 35: '...ooooooossdooodmmlAlmmdooodssooooooo....', 36: '.....oslllllsomommlAAAlmmomoslllllso......', 37: '.....oosssssooAodmmlAlmmdomoosssssoo......', 38: '......ooooooolmmddmmlmmddmmmooooooo.......', 39: '............olmmdddmmmdddmmmdo............', 40: '............olmmddddmddddmmmdo............', 41: '............olAAAAAoooAAAAAAdo............', 42: '............olmmmmmmmmmmmmmmdo............', 43: '...........oolmmmmmmmmmmmmmmdo............', 44: '...........osssssssssssssssssoo...........', 45: '...........oddddddddddddddddddo...........', 46: '...........oAAAAAAAAAAAAAAAAAAo...........', 47: '...........oooooooooooooooooooo...........' }),
    legs: wornF({ 44: '..............ooo.......ooo...............', 45: '..............odo.......odo...............', 46: '.............oodoo.....oodoo..............', 47: '...........ooolmdooooooolmdoooo...........', 48: '...........oodddddososodddddoso...........', 49: '...........oosssssooooosssssooo...........', 50: '...........oooooooooooooooooooo...........', 51: '..........oolmmmmmdoolmmmmmmmdoo..........', 52: '..........osdmmmmmmosdmmmmmmmdso..........', 53: '..........oosmmmmmdoosmmmmmmmsoo..........', 54: '...........oodAAAAdooodAAAAAdoo...........', 55: '............osssssso.ossssssso............', 56: '............oooooooo.ooooooooo............' }),
    gloves: wornF({ 38: '.......oooooooo...........oooooooo........', 39: '......ooAAAAAAoo.........ooAAAAAAoo.......', 40: '......olmmmmmmdo.........olmmmmmmdo.......', 41: '.....oooooooooooo.......oolooooooooo......', 42: '.....oodoodoodooo.......oooodoodoodo......', 43: '.....oodddddddddoo......oodddddddddoo.....', 44: '.....ossssssssssso......ossssssssssso.....', 45: '.....ooooooooooooo......ooooooooooooo.....', 46: '......oolmmmmdoo.........oolmmmmdoo.......', 47: '.......oddddddo...........oddddddo........', 48: '.......osssssso...........osssssso........', 49: '.......oooooooo...........oooooooo........' }),
    boots: wornF({ 56: '............ooooooo...ooooooo.............', 57: '...........ooAAAAAoo.ooAAAAAoo............', 58: '...........olmmmmmdo.olmmmmmdo............', 59: '...........ossssssso.ossssssso............', 60: '...........olllllllo.olllllllo............', 61: '..........oolmmmmmdooolmmmmmdoo...........', 62: '........ooooooommmmdolmmmmooooooo.........', 63: '........odddssodddddodddddossdddo.........', 64: '........osssoooAAAAsosAAAAooossso.........' }),
    shield: wornF({ 24: 'oo.................ooo....................', 25: 'soo...............ooso....................', 26: 'odooo...........ooodoo....................', 27: 'olldooooooooooooolldoo....................', 28: 'sdmmdooAAAAAAAoolmmdso....................', 29: 'osddddoommldmooddddsoo....................', 30: 'oosssssomooomosssssooo....................', 31: 'sooooooooodoooooooooso....................', 32: 'odooomoollmldoomooodoo....................', 33: 'olldooolmmmmmdooolldoo....................', 34: 'sdmmdoodmmAmmdoolmmdso....................', 35: 'osddddooddmddooddddsoo....................', 36: 'sosssssossdssosssssoso....................', 37: 'odoooooooosoooooooodoo....................', 38: 'olldoommmooommmoolldoo....................', 39: 'sdmmdoommmldmmoolmmdso....................', 40: 'osddddoommldmooddddsoo....................', 41: 'oosssssommldmosssssoo.....................', 42: '.ooooooommldmooooooo......................', 43: '....oosddmmmddsoo.........................', 44: '.....oossdddssoo..........................', 45: '......ooosssooo...........................', 46: '........ooooo.............................' }),
  },
  regal: {
    helm: wornF({ 0: '...................ooo....................', 1: '...................odo....................', 2: 'oo................oodoo................ooo', 3: 'soo..........ooo..olmdo..ooo..........ooso', 4: 'odooo........odo..olmdo..odo........ooodoo', 5: 'osddEo......oodoooolmdoooodoo......ooldso.', 6: 'oosmdoo.ooo.olmdoolmmmdoolmdo.ooo.oolmsoo.', 7: '.oodmdooodo.olmdoolmmmdoolmdo.odooolmdoo..', 8: '..osdmldodooolldddddddddddddooodollmdso...', 9: '..oosdmmlmldolllssssssssssssollmlmmdsoo...', 10: '...oosmmmmmmdllllooooooooooolmmmmmmsoo....', 11: '....oodmmmmmmsllllmmmmmmmmosmmmmmmdoo.....', 12: '.....osddddddoommmmmmmmmmmooddddddso......', 13: '.....oosssssssommmmmmmmmmmosssssssoo......', 14: '......ooooooooommmmmmmmmmmooooooooo.......', 15: '.........oolmmmmmmmmEmmmmmmmmdoo..........', 16: '.........olsssssssssssssssssssdo..........', 17: '.......ooolAAAAAEAAAAAAAEAAAAAdooo........', 18: '.......osdmmmmssssssldssssssmmmdso........', 19: '.......oosdmmmmEEEEmldmEEEEmmmdsoo........', 20: '........oosdmmmEEEEmldmEEEEmmdsoo.........', 21: '......E..oosdmmEdsEmldmsdEEmdsoo..........', 22: '..........oosdmdsEEmldmEsdEdsoo...........', 23: '...........oosdsssssldssssdsoo............', 24: '............oosdmmmmldmmmdsoo.............', 25: '.............oosAAAAAAAAAsoo..............', 26: '..............oossdddddssoo...............', 27: '...............ooosssssooo................', 28: '.................ooooooo..................' }),
    chest: wornF({ 18: '..ooo...............................ooo...', 19: 'ooodo...............................odoooo', 20: 'soosoo.............................oosooso', 21: 'odoodo.............................odoodoo', 22: 'osoodoo...........................oodooso.', 23: 'oollmdo...........................olmldoo.', 24: 'oolmmdoo.........................oolmmdooo', 25: 'dodmmmdo.........................olmmmdodo', 26: 'sosmmmdo.........................olmmmsoso', 27: 'osolmmdoo.......................oolmmdosoo', 28: 'oolmmmmdooooooooo.......ooooooooodmmmmdoo.', 29: 'osmmmmmssoldoolAooo...oooAloollossmmmmmso.', 30: 'oodmmmdoooAAdommAdooooolAmmolAAooolmmmdoo.', 31: 'odsdmmmdoommdoommAlooolAmmoolmmoodmmmdsdo.', 32: 'ososmmmssossmdomddddmddddmolmssossmmmsoso.', 33: 'oodolmdooollmdomdddmmmdddmodmllooolmdodoo.', 34: '.oslmmdooommmsomddmmlmmddmosmmmooodmmlsEE.', 35: '.oodmmsssossdooodmmlElmmdooodssosssmmdoo..', 36: '..osmdoooollsoEommlEEElmmomoslloooolmso...', 37: '..oodddooossooAodmmlElmmdomoossooodddoo...', 38: '.E.osssssoooolAmddmmlmmddmmAoooossssso....', 39: '...ooooooo..olAmdddmmmdddmmAdo.ooooooo....', 40: '............olmmddddmddddmmmdo............', 41: '............olAAAAAoooAAAAAAdo............', 42: '............olmmmmmmmmmmmmmmdo............', 43: '...........oolmmmmmmmmmmmmmmdo............', 44: '...........osssssssssssssssssoo...........', 45: '...........oddddddddddddddddddo...........', 46: '...........oAAAAAAAAAAAAAAAAAAo...........', 47: '.......E...oooooooooooooooooooo...........' }),
    legs: wornF({ 47: '...........oooooooooooooooooooo...........', 48: '...........odAAAAAAsosAAAAAAAso...........', 49: '...........osmmlmmdooolmmlmmdoo...........', 50: '...........oossssssooosssssssoo...........', 51: '..........oolmmAmmdoolmmmAmmmdoo..........', 52: '..........osdmmEmmmosdmmmEmmmdso..........', 53: '..........oosmmmmmdoosmmmmmmmsoo..........', 54: '...........oodAAAAdooodAAAAAdoo...........', 55: '............osssssso.ossssssso............', 56: '............oooooooo.ooooooooo............' }),
    gloves: wornF({ 38: '.......oooooooo...........oooooooo........', 39: '......ooAAAAAAoo.........ooAAAAAAoo.......', 40: '.....oolmmmmmmdoo.......oolmmmmmmdoo......', 41: '....ooooooooooodoo.....oodmoooooooooo.....', 42: '....osodoodoodoooo.....osooodoodoodoo.....', 43: '....ooodddddddddoo.....ooodddddddddoo.....', 44: '.....ossssssssssso......ossssssssssso.....', 45: '.....ooooooooooooo......ooooooooooooo.....', 46: '......oolmEmmdoo.........oolmEmmdoo.......', 47: '.......oddddddo...........oddddddo........', 48: '.......osssssso...........osssssso........', 49: '.......oooooooo...........oooooooo........' }),
    boots: wornF({ 52: '.....ooo.........................ooo......', 53: '.....osoo.......................ooso......', 54: '.....oodooo...................ooodoo......', 55: '......osldoo.................oollso.......', 56: '......oolmdoooooooo...oooooooolmdoo.......', 57: '.......odmmldoAAAAoo.ooAAAAollmmdo........', 58: '.......osddddooEmmdo.olmmEooddddso........', 59: '.......oosssssosssso.ossssosssssoo........', 60: '........ooooooollllo.ollllooooooo.........', 61: '..........oolmmmmmdooolmmmmmdoo...........', 62: '..........olmmmmmmmdolmmmmmmmdo...........', 63: '..........odddddddddodddddddddo...........', 64: '..........osAAAAAAAsosAAAAAAAso...........' }),
    shield: wornF({ 21: '.....................ooo..................', 22: '....................ooso..................', 23: 'ooo...............ooodoo..................', 24: 'ldoo.............oollso...................', 25: 'lmdoo...........oolmdoo...................', 26: 'lmmdoo.........oolmmmso...................', 27: 'dmmmdooooooooooolmmmdooo..................', 28: 'smdddddooAAAoodddddmsoso..................', 29: 'olssssssomldossssssdodoo..................', 30: 'ldooooooooooooooooollso...................', 31: 'lmdoommooodooommoolmdoo...................', 32: 'lmmdoooollmldoooolmmmsoo..................', 33: 'lmmmdooomEEEmooolmmmdoso..................', 34: 'lmmddddooEEEooddddmmmdoo..................', 35: 'lmmsssssoEEEosssssmmmso...................', 36: 'lmdoooooosdsoooooolmdoo...................', 37: 'lmmdoomooosooomoolmmmso...................', 38: 'dmmmdooomooomooolmmmdoo...................', 39: 'sddddddoomldooddddddso....................', 40: 'osssssssomldosssssssoo....................', 41: 'ooooooooomldooooooooo.....................', 42: '....osdmmmldmmdso.........................', 43: '....oosddmmmddsoo.........................', 44: '.....oossdddssoo..........................', 45: '......ooosssooo...........................', 46: '........ooooo.............................' }),
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
