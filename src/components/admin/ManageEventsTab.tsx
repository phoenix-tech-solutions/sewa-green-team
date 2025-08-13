import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "~/lib/supabase";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import VolunteerHoursModal from "~/components/admin/VolunteerHoursModal";
import Modal from "~/components/ui/Modal";
import { cardVariants, containerVariants, userCardVariants } from "~/constants/animations";
import type { ManageEventsTabProps, Event, SignedUpUser, HoursUser } from "~/types";

const ManageEventsTab = ({ events, startEditEvent, deleteEvent }: ManageEventsTabProps) => {
  const [showModal, setShowModal] = useState(false);
  const [signedUpUsers, setSignedUpUsers] = useState<SignedUpUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Helper to check if event is in the past
  const isEventPast = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr + (timeStr ? "T" + timeStr : "T23:59"));
    return eventDate < new Date();
  };

  // Volunteer Hours Modal State
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursEvent, setHoursEvent] = useState<Event | null>(null);
  const [hoursUsers, setHoursUsers] = useState<HoursUser[]>([]);
  const [savingHours, setSavingHours] = useState(false);

  const formatDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr + (timeStr ? "T" + timeStr : ""));
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent(id);
    }
  };

  const [cleaning, setCleaning] = useState(false);

  const clearOldData = async () => {
    if (!window.confirm("Clean up expired event images?")) return;
    setCleaning(true);
    const { error } = await supabase.rpc("cleanup_expired_event_images_rpc");
    if (error) {
      alert("Failed to clean up: " + error.message);
    } else {
      alert("Successfully cleaned up expired event images!");
    }
    setCleaning(false);
  };

  const fetchSignedUpUsers = async (eventId: string) => {
    setLoadingUsers(true);
    setSignedUpUsers([]);
    setShowModal(true);

    try {
      const { data, error } = await supabase
        .from("event_signups")
        .select(
          `
          id,
          status,
          user_id,
          event_id,
          created_at,
          user:users (
            id,
            full_name,
            email,
            phone,
            role,
            status
          )
        `,
        )
        .eq("event_id", eventId);

      if (error) throw error;
      setSignedUpUsers((data as SignedUpUser[]) || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to load signed up users: " + errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  const removeSignup = async (signupId: string) => {
    if (!window.confirm("Remove this user from the event?")) return;
    const { error } = await supabase.from("event_signups").delete().eq("id", signupId);
    if (error) return alert(error.message);
    setSignedUpUsers((prev) => prev.filter((su) => su.id !== signupId));
  };

  const copyField = (field: "email" | "phone") => {
    const text = signedUpUsers
      .map((s) => s.user?.[field])
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(text);
    alert(`${field === "email" ? "Emails" : "Phone numbers"} copied!`);
  };

  // Open modal and fetch users for event
  const handleAddVolunteerHours = async (event: Event) => {
    setHoursEvent(event);
    setSavingHours(false);

    // Fetch users signed up for this event
    const { data } = await supabase
      .from("event_signups")
      .select("id, user_id, user:users(id, full_name, email)")
      .eq("event_id", event.id);
    setHoursUsers(
      data
        ?.map((s: { user: HoursUser | null }) => s.user)
        .filter((user): user is HoursUser => user !== null) || [],
    );

    setShowHoursModal(true);
  };

  // Save volunteer hours to Supabase
  const handleSaveVolunteerHours = async (hoursData: { [userId: string]: number }) => {
    if (!hoursEvent) return;

    setSavingHours(true);
    try {
      const inserts = Object.entries(hoursData)
        .filter(([, hours]) => hours > 0)
        .map(([userId, hours]) => ({
          event_id: hoursEvent.id,
          user_id: userId,
          hours,
        }));

      // Insert or upsert volunteer hours
      const { error } = await supabase
        .from("volunteer_hours")
        .upsert(inserts, { onConflict: "event_id,user_id" });
      if (error) throw error;

      setShowHoursModal(false);
      alert("Volunteer hours saved successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      alert("Error saving hours: " + errorMessage);
      throw err; // Re-throw to let the modal handle the error state
    } finally {
      setSavingHours(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] text-center drop-shadow-sm">
          Manage Events
        </h2>
      </div>
      <motion.section
        className="space-y-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {events.length === 0 ? (
          <motion.div className="text-center py-12" variants={cardVariants}>
            <p className="text-[#c27d50] text-lg font-medium">
              No events created yet. Use the <strong>Create Event</strong> tab to add new events.
            </p>
          </motion.div>
        ) : (
          events.map((event: Event) => (
            <motion.div
              key={event.id}
              className="p-4 sm:p-6 bg-gradient-to-r from-white to-[#f9f8f4] border border-[#cdd1bc] rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row sm:justify-between sm:items-center"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="mb-4 sm:mb-0">
                <div className="font-extrabold text-xl text-[#6b7547] mb-2">{event.title}</div>
                <div className="text-sm text-[#c27d50] space-y-1 font-medium">
                  <p>{formatDate(event.date, event.time || undefined)}</p>
                  <p>{event.location}</p>
                  {event.waiver_required && (
                    <p className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full w-fit">
                      Waiver Required
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => startEditEvent(event)}
                  className="px-3 sm:px-4 py-2 bg-[#8a9663] hover:bg-[#7a8757] rounded-full text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  aria-label={`Edit event ${event.title}`}
                  title={`Edit event ${event.title}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  className="px-3 sm:px-4 py-2 bg-[#c27d50] hover:bg-[#a46336] rounded-full text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  aria-label={`Delete event ${event.title}`}
                  title={`Delete event ${event.title}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => fetchSignedUpUsers(event.id)}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#f4f3ec] to-[#e6e8d5] text-[#6b7547] border border-[#cdd1bc] hover:bg-gradient-to-r hover:from-[#e6e8d5] hover:to-[#d4d8c1] rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  aria-label={`View users signed up for ${event.title}`}
                  title={`View users signed up for ${event.title}`}
                >
                  View Users
                </button>
                {isEventPast(event.date, event.time || undefined) && (
                  <button
                    type="button"
                    onClick={() => handleAddVolunteerHours(event)}
                    className="px-4 py-2 bg-[#8a9663] hover:bg-[#7a8757] rounded-full text-white font-semibold shadow-md hover:shadow-lg"
                    aria-label={`Add volunteer hours for ${event.title}`}
                    title={`Add volunteer hours for ${event.title}`}
                  >
                    Add Volunteer Hours
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.section>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Users Signed Up"
        size="xl"
      >
        {!loadingUsers && signedUpUsers.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              type="button"
              onClick={() => copyField("email")}
              className="bg-[#8a9663] hover:bg-[#7a8757] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors"
              aria-label="Copy all user emails to clipboard"
              title="Copy all user emails to clipboard"
            >
              <FaEnvelope /> Copy Emails
            </button>
            <button
              type="button"
              onClick={() => copyField("phone")}
              className="bg-[#8a9663] hover:bg-[#7a8757] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors"
              aria-label="Copy all user phone numbers to clipboard"
              title="Copy all user phone numbers to clipboard"
            >
              <FaPhone /> Copy Phones
            </button>
          </div>
        )}

        {loadingUsers ? (
          <div className="text-center py-8">
            <p className="text-[#c27d50] text-lg font-medium">Loading users...</p>
          </div>
        ) : signedUpUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#c27d50] text-lg font-medium italic">No users signed up yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {signedUpUsers.map((signup) => {
              const user = signup.user;
              if (!user) return null;
              return (
                <motion.div
                  key={signup.id}
                  className="p-4 rounded-xl bg-white/50 border border-[#cdd1bc]/30 shadow-sm"
                  variants={userCardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-lg font-bold text-[#6b7547]">
                        <FaUser className="text-[#8a9663]" /> {user.full_name}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-[#c27d50] font-medium">
                        <FaEnvelope className="text-[#8a9663]" /> {user.email}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-[#c27d50] font-medium">
                        <FaPhone className="text-[#8a9663]" /> {user.phone}
                      </p>
                      <p className="text-xs text-[#6b7547]/70 font-medium">
                        {user.role} — {user.status}
                      </p>
                      <p className="text-xs text-[#6b7547]/50">
                        Signed up on {formatDate(signup.created_at || "")}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 flex flex-col gap-2 items-start sm:items-end">
                      <button
                        type="button"
                        onClick={() => removeSignup(signup.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm rounded-full font-semibold transition-colors"
                        aria-label={`Remove ${user.full_name} from event`}
                        title={`Remove ${user.full_name} from event`}
                      >
                        Remove User
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Modal>
      <div className="w-full flex justify-center mt-4">
        <button
          type="button"
          onClick={clearOldData}
          disabled={cleaning}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-semibold"
          aria-label="Clean up old event images"
          title="Clean up old event images"
        >
          {cleaning ? "Cleaning..." : "Clean Old Images"}
        </button>
      </div>

      {/* Volunteer Hours Modal */}
      <VolunteerHoursModal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        event={hoursEvent}
        users={hoursUsers}
        onSave={handleSaveVolunteerHours}
        isLoading={savingHours}
      />
    </>
  );
};

export default ManageEventsTab;
