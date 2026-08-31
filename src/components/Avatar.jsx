import PixelSprite from './PixelSprite'
import { heroBust } from '../game/sprites'

/**
 * The player as a profile picture: their own character from the shoulders up.
 *
 * The art fills the frame rather than sitting inside it with a margin — at
 * thirty-odd pixels there is not room for padding and a face both, and a face
 * is the whole point of the thing.
 */
export default function Avatar({ av = {}, size = 34, ring, className = '' }) {
  const sprite = heroBust(av.skin, av.hair, av.shirt, av.hairLength, av.body)
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
      <PixelSprite sprite={sprite} size={size - 2} />
    </div>
  )
}
