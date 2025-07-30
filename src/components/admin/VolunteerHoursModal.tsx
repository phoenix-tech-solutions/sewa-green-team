import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Save } from "lucide-react";
import Modal from "~/components/ui/Modal";
import { userCardVariants } from "~/constants/animations";
import type { VolunteerHoursModalProps } from "~/types";

const VolunteerHoursModal = ({
  isOpen,
  onClose,
  event,
  users,
  onSave,
  isLoading = false,
}: VolunteerHoursModalProps) => {
  const [hoursData, setHoursData] = useState<{ [userId: string]: number }>({});
  const [bulkHours, setBulkHours] = useState("");
  const [errors, setErrors] = useState<{ [userId: string]: string }>({});

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (isOpen && event) {
      setHoursData({});
      setBulkHours("");
      setErrors({});
    }
  }, [isOpen, event]);

  const handleHoursChange = (userId: string, value: string) => {
    const numValue = parseFloat(value);

    // Clear any existing error for this user
    setErrors((prev) => ({ ...prev, [userId]: "" }));

    if (value === "" || isNaN(numValue)) {
      setHoursData((prev) => ({ ...prev, [userId]: 0 }));
    } else if (numValue < 0) {
      setErrors((prev) => ({ ...prev, [userId]: "Hours cannot be negative" }));
    } else if (numValue > 24) {
      setErrors((prev) => ({ ...prev, [userId]: "Hours cannot exceed 24 per day" }));
    } else {
      setHoursData((prev) => ({ ...prev, [userId]: numValue }));
    }
  };

  const handleBulkSet = () => {
    const numValue = parseFloat(bulkHours);
    if (isNaN(numValue) || numValue < 0 || numValue > 24) {
      alert("Please enter a valid number of hours (0-24)");
      return;
    }

    const newData: { [userId: string]: number } = {};
    users.forEach((user) => {
      newData[user.id] = numValue;
    });
    setHoursData(newData);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all entries
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      alert("Please fix all errors before saving");
      return;
    }

    // Check if at least one user has hours > 0
    const hasValidHours = Object.values(hoursData).some((hours) => hours > 0);
    if (!hasValidHours) {
      alert("Please enter hours for at least one volunteer");
      return;
    }

    try {
      await onSave(hoursData);
    } catch (error) {
      console.error("Error saving volunteer hours:", error);
    }
  };

  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Volunteer Hours" size="xl">
      <div className="space-y-6">
        {/* Event Info */}
        <div className="bg-[#f4f3ec]/50 p-4 rounded-xl border border-[#cdd1bc]/30">
          <h4 className="font-bold text-[#6b7547] text-lg mb-2 flex items-center gap-2">
            <Clock size={20} />
            {event.title}
          </h4>
          <p className="text-[#c27d50] text-sm font-medium">
            {new Date(event.date).toLocaleDateString()}
            {event.time && ` at ${event.time}`}
          </p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto text-[#c27d50] mb-4" size={48} />
            <p className="text-[#c27d50] text-lg font-medium">
              No volunteers signed up for this event
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bulk Set Hours */}
            <div className="bg-[#f9f8f4] rounded-xl p-4 border border-[#cdd1bc]/50">
              <h4 className="font-semibold text-[#6b7547] mb-3">Quick Set Hours</h4>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={bulkHours}
                  onChange={(e) => setBulkHours(e.target.value)}
                  className="border border-[#cdd1bc] rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663]"
                  placeholder="0"
                />
                <span className="text-[#6b7547] font-medium">hours for all volunteers</span>
                <button
                  type="button"
                  onClick={handleBulkSet}
                  className="bg-[#8a9663] hover:bg-[#7a8757] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply to All
                </button>
              </div>
            </div>

            {/* Individual Hours */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#6b7547] flex items-center gap-2">
                <Users size={18} />
                Individual Hours ({users.length} volunteers)
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-3 border border-[#cdd1bc]/30 rounded-lg p-4">
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    className="flex items-center gap-4 p-3 bg-white rounded-lg border border-[#cdd1bc]/30"
                    variants={userCardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#6b7547]">{user.full_name}</div>
                      <div className="text-sm text-[#c27d50]">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={hoursData[user.id] || ""}
                        onChange={(e) => handleHoursChange(user.id, e.target.value)}
                        className={`border rounded-lg px-3 py-2 w-20 text-center focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663] ${
                          errors[user.id] ? "border-red-500" : "border-[#cdd1bc]"
                        }`}
                        placeholder="0"
                      />
                      <span className="text-[#6b7547] text-sm font-medium">hrs</span>
                    </div>
                    {errors[user.id] && (
                      <div className="text-red-500 text-xs">{errors[user.id]}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#cdd1bc]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-[#6b7547] border border-[#cdd1bc] rounded-lg hover:bg-[#f4f3ec] transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#8a9663] hover:bg-[#7a8757] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isLoading ? "Saving..." : "Save Hours"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default VolunteerHoursModal;
