// src/components/room/MemberList.jsx
export default function MemberList({ members, roomId }) {
  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/editor/${roomId}`)
      .then(() => alert('Room link copied!'))
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg h-full">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs uppercase tracking-wider">Members</span>
        <span className="text-gray-600 text-xs">{members.length} online</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium">
              {member[0]?.toUpperCase()}
            </div>
            <span className="text-gray-300 text-sm">{member}</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>
        ))}
      </div>

      <button
        onClick={copyLink}
        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 rounded-lg transition-colors"
      >
        Copy Room Link
      </button>
    </div>
  )
}