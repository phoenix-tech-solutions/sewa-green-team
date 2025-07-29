import { ChevronDown, ChevronUp } from "lucide-react";
import type { PendingUsersTabProps } from "~/types";

const PendingUsersTab = ({
  pendingUsers,
  pendingRoleFilter,
  setPendingRoleFilter,
  pendingStatusFilter,
  setPendingStatusFilter,
  roles,
  statusOptions,
  filterUsers,
  expandedUserId,
  toggleExpand,
  updateUserStatus,
}: PendingUsersTabProps) => (
  <>
    <div className="max-w-md mx-auto mb-6 flex flex-wrap justify-center gap-6">
      <div className="flex flex-col items-start gap-1">
        <label htmlFor="pending-role-filter" className="font-semibold text-gray-700">
          Filter by Role:
        </label>
        <select
          id="pending-role-filter"
          value={pendingRoleFilter}
          onChange={(e) => setPendingRoleFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 w-40"
          aria-label="Filter pending users by role"
        >
          {roles.map((r: string) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col items-start gap-1">
        <label htmlFor="pending-status-filter" className="font-semibold text-gray-700">
          Filter by Status:
        </label>
        <select
          id="pending-status-filter"
          value={pendingStatusFilter}
          onChange={(e) => setPendingStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 w-40"
          aria-label="Filter pending users by status"
        >
          {statusOptions.map((s: string) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
    <section className="space-y-6 max-w-4xl mx-auto">
      {filterUsers(pendingUsers, pendingRoleFilter, pendingStatusFilter).length === 0 ? (
        <p className="text-center text-gray-600">No pending users 🎉</p>
      ) : (
        filterUsers(pendingUsers, pendingRoleFilter, pendingStatusFilter).map((user) => (
          <div key={user.id} className="p-6 bg-white border rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-lg">{user.full_name}</div>
                <div className="text-sm text-gray-600">
                  <p>Email: {user.email}</p>
                  <p>Phone: {user.phone}</p>
                  <p>Role: {user.role}</p>
                  <p>Lead ID: {user.lead_id}</p>
                </div>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                  {user.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand(user.id)}
                className="text-[#6b725a]"
                aria-label={
                  expandedUserId === user.id ? "Collapse user details" : "Expand user details"
                }
                title={expandedUserId === user.id ? "Collapse user details" : "Expand user details"}
              >
                {expandedUserId === user.id ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
            {expandedUserId === user.id && (
              <div className="mt-4 text-sm text-gray-700 space-y-2">
                {user.role === "STUDENT" && (
                  <>
                    <p>
                      Parent 1: {user.parent_1_name} ({user.parent_1_email}, {user.parent_1_phone})
                    </p>
                    <p>
                      Parent 2: {user.parent_2_name} ({user.parent_2_email}, {user.parent_2_phone})
                    </p>
                  </>
                )}
                {user.role === "PARENT" && (
                  <>
                    <p>Student Name: {user.student_name}</p>
                    <p>Student Email: {user.student_email}</p>
                    <p>Student Phone: {user.student_phone}</p>
                  </>
                )}
              </div>
            )}
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => updateUserStatus(user.id, "APPROVED")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
                aria-label={`Approve user ${user.full_name}`}
                title={`Approve user ${user.full_name}`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => updateUserStatus(user.id, "REJECTED")}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium"
                aria-label={`Reject user ${user.full_name}`}
                title={`Reject user ${user.full_name}`}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  </>
);

export default PendingUsersTab;
