import CampaignSheet from '../components/CampaignSheet'

/**
 * The campaign, as a tab.
 *
 * It used to be a card on TODAY that opened a sheet, which buried the part of
 * the game that has an ending under the part that repeats every day. The sheet
 * was already the whole screen; this just stops making people find it.
 */
export default function Bosses() {
  return <CampaignSheet embedded />
}
