import PixelSprite from './PixelSprite'
import { ICONS } from '../game/icons'

export default function Icon({ name, size = 12, color = 'currentColor', className, style }) {
  const sprite = ICONS[name]
  if (!sprite) return null
  return <PixelSprite sprite={sprite} size={size} accent={color} className={className} style={style} />
}
