import { STATUS_STYLES } from '../../config/constants'

export default function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[status] || STATUS_STYLES.IDLE}`}>
      {status}
    </span>
  )
}