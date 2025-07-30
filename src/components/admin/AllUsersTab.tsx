import { motion } from "framer-motion";
import FilterSelect from "~/components/ui/FilterSelect";
import StatusBadge from "~/components/ui/StatusBadge";
import ExpandableCard from "~/components/ui/ExpandableCard";
import CopyButton from "~/components/ui/CopyButton";
import { cardVariants, containerVariants } from "~/constants/animations";
import type { AllUsersTabProps } from "~/types";

const AllUsersTab = ({
  allUsers,
  userRoleFilter,
  setUserRoleFilter,
  userStatusFilter,
  setUserStatusFilter,
  roles,
  statusOptions,
  filterUsers,
  expandedUserId,
  toggleExpand,
  copyToClipboard,
  generateBulkList,
}: AllUsersTabProps) => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] text-center mb-8 drop-shadow-sm">
        All Users
      </h2>
      <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-6">
        <FilterSelect
          id="user-role-filter"
          label="Filter by Role"
          value={userRoleFilter}
          onChange={setUserRoleFilter}
          options={roles}
          ariaLabel="Filter users by role"
        />
        <FilterSelect
          id="user-status-filter"
          label="Filter by Status"
          value={userStatusFilter}
          onChange={setUserStatusFilter}
          options={statusOptions}
          ariaLabel="Filter users by status"
        />
      </div>
    </div>
    <section className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <CopyButton
          onClick={() => copyToClipboard(generateBulkList("email"))}
          variant="primary"
          title="Copy all filtered user emails"
          ariaLabel="Copy all filtered user emails to clipboard"
        >
          Copy Emails
        </CopyButton>
        <CopyButton
          onClick={() => copyToClipboard(generateBulkList("phone"))}
          variant="secondary"
          title="Copy all filtered user phone numbers"
          ariaLabel="Copy all filtered user phone numbers to clipboard"
        >
          Copy Phone Numbers
        </CopyButton>
      </div>
      <motion.section
        className="space-y-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filterUsers(allUsers, userRoleFilter, userStatusFilter).length === 0 ? (
          <motion.div className="text-center py-12" variants={cardVariants}>
            <p className="text-[#c27d50] text-lg font-medium">No users found.</p>
          </motion.div>
        ) : (
          filterUsers(allUsers, userRoleFilter, userStatusFilter).map((user) => (
            <ExpandableCard
              key={user.id}
              id={user.id}
              isExpanded={expandedUserId === user.id}
              onToggle={toggleExpand}
              expandedContent={
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
                        <span className="font-semibold">Student Email:</span> {user.student_email}
                      </p>
                      <p>
                        <span className="font-semibold">Student Phone:</span> {user.student_phone}
                      </p>
                      <p>
                        <span className="font-semibold">Student Name:</span> {user.student_name}
                      </p>
                    </>
                  )}
                </div>
              }
            >
              <div className="font-extrabold text-xl text-[#6b7547] mb-2">{user.full_name}</div>
              <div className="text-sm text-[#c27d50] space-y-1 font-medium">
                <p>Email: {user.email}</p>
                <p>Phone: {user.phone}</p>
                <p>Role: {user.role}</p>
                <p>
                  Status: <StatusBadge status={user.status} />
                </p>
                <p>Lead ID: {user.lead_id}</p>
              </div>
            </ExpandableCard>
          ))
        )}
      </motion.section>
    </section>
  </>
);

export default AllUsersTab;
