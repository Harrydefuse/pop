import PixelSprite from './PixelSprite'
import { avatarSprite } from '../game/sprites'

export default function Avatar({ av = {}, size = 34, ring, className = '' }) {
  const sprite = avatarSprite(av.seed ?? 0, av.skin, av.hair, av.shirt ?? 'var(--color-neon)')
  return (
    <div
      className={`grid place-items-center shrink-0 border bg-panel-2 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: ring ?? 'var(--color-line-hot)',
        boxShadow: ring ? `0 0 12px -4px ${ring}` : undefined,
      }}
    >
      <PixelSprite sprite={sprite} size={size - 6} />
    </div>
  )
}
