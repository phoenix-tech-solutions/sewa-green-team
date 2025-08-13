import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import type { PendingUsersTabProps } from "~/types";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

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
    <div className="max-w-2xl mx-auto mb-8 flex flex-wrap justify-center gap-6">
      <div className="flex flex-col items-start gap-2">
        <label htmlFor="pending-role-filter" className="font-semibold text-[#6b7547]">
          Filter by Role:
        </label>
        <select
          id="pending-role-filter"
          value={pendingRoleFilter}
          onChange={(e) => setPendingRoleFilter(e.target.value)}
          className="border border-[#cdd1bc] rounded-lg px-3 py-2 w-40 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663] text-[#6b7547] font-medium"
          aria-label="Filter pending users by role"
        >
          {roles.map((r: string) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col items-start gap-2">
        <label htmlFor="pending-status-filter" className="font-semibold text-[#6b7547]">
          Filter by Status:
        </label>
        <select
          id="pending-status-filter"
          value={pendingStatusFilter}
          onChange={(e) => setPendingStatusFilter(e.target.value)}
          className="border border-[#cdd1bc] rounded-lg px-3 py-2 w-40 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663] text-[#6b7547] font-medium"
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
    <motion.section
      className="space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {filterUsers(pendingUsers, pendingRoleFilter, pendingStatusFilter).length === 0 ? (
        <motion.div className="text-center py-12" variants={cardVariants}>
          <p className="text-[#c27d50] text-lg font-medium">No pending users 🎉</p>
        </motion.div>
      ) : (
        filterUsers(pendingUsers, pendingRoleFilter, pendingStatusFilter).map((user) => (
          <motion.div
            key={user.id}
            className="p-4 sm:p-6 bg-gradient-to-r from-white to-[#f9f8f4] border border-[#cdd1bc] rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-extrabold text-xl text-[#6b7547] mb-2">{user.full_name}</div>
                <div className="text-sm text-[#c27d50] space-y-1 font-medium">
                  <p>Email: {user.email}</p>
                  <p>Phone: {user.phone}</p>
                  <p>Role: {user.role}</p>
                  <p>Lead ID: {user.lead_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand(user.id)}
                className="text-[#8a9663] hover:text-[#6b7547] p-2 rounded-full hover:bg-white/50 transition-all duration-200"
                aria-label={
                  expandedUserId === user.id ? "Collapse user details" : "Expand user details"
                }
                title={expandedUserId === user.id ? "Collapse user details" : "Expand user details"}
              >
                {expandedUserId === user.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>
            {expandedUserId === user.id && (
              <div className="mt-6 p-4 bg-[#f4f3ec]/50 rounded-xl border border-[#cdd1bc]/30">
                <div className="text-sm text-[#6b7547] space-y-2 font-medium">
                  {user.role === "STUDENT" && (
                    <>
                      <p>
                        <span className="font-semibold">Parent 1:</span> {user.parent_1_name} (
                        {user.parent_1_email}, {user.parent_1_phone})
                      </p>
                      <p>
                        <span className="font-semibold">Parent 2:</span> {user.parent_2_name} (
                        {user.parent_2_email}, {user.parent_2_phone})
                      </p>
                    </>
                  )}
                  {user.role === "PARENT" && (
                    <>
                      <p>
                        <span className="font-semibold">Student Name:</span> {user.student_name}
                      </p>
                      <p>
                        <span className="font-semibold">Student Email:</span> {user.student_email}
                      </p>
                      <p>
                        <span className="font-semibold">Student Phone:</span> {user.student_phone}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => updateUserStatus(user.id, "APPROVED")}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#8a9663] hover:bg-[#7a8757] text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                aria-label={`Approve user ${user.full_name}`}
                title={`Approve user ${user.full_name}`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => updateUserStatus(user.id, "REJECTED")}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#c27d50] hover:bg-[#a46336] text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                aria-label={`Reject user ${user.full_name}`}
                title={`Reject user ${user.full_name}`}
              >
                Reject
              </button>
            </div>
          </motion.div>
        ))
      )}
    </motion.section>
  </>
);

export default PendingUsersTab;
