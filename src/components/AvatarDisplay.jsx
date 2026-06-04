import { getAvatarUrl } from '../lib/gameUtils'

export default function AvatarDisplay({ seed, size = 64, className = '' }) {
  const url = getAvatarUrl(seed)
  return (
    <img
      src={url}
      alt="אוואטר"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    />
  )
}
