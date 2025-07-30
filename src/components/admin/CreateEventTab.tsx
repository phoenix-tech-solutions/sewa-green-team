import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "~/lib/supabase";
import type { CreateEventTabProps } from "~/types";

// Animation variants
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

const CreateEventTab = ({
  eventForm,
  handleEventChange,
  saveEvent,
  setEventForm,
}: CreateEventTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Fetch current image URL when editing an event
  useEffect(() => {
    const fetchCurrentImage = async () => {
      if (eventForm.image_id) {
        try {
          // Get the file info from storage
          const { data: files, error } = await supabase.storage
            .from("events")
            .list("images", { limit: 1000 });

          if (error) throw error;

          // Find the file with matching ID
          const imageFile = files?.find((file) => file.id === eventForm.image_id);

          if (imageFile) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("events").getPublicUrl(`images/${imageFile.name}`);
            setCurrentImageUrl(publicUrl);
          } else {
            setCurrentImageUrl(null);
          }
        } catch (error) {
          console.error("Error fetching current image:", error);
          setCurrentImageUrl(null);
        }
      } else {
        setCurrentImageUrl(null);
      }
    };

    fetchCurrentImage();
  }, [eventForm.image_id]);

  return (
    <section>
      <motion.div
        className="max-w-2xl mx-auto"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] text-center mb-8 drop-shadow-sm"
          variants={fieldVariants}
        >
          {eventForm.id ? "Edit Event" : "Create New Event"}
        </motion.h2>
        <motion.form
          onSubmit={(e) =>
            saveEvent(e, fileInputRef.current?.files?.[0], imageInputRef.current?.files?.[0])
          }
          className="space-y-6"
        >
          <div>
            <label htmlFor="event-title" className="block mb-2 font-semibold text-[#6b7547]">
              Event Title <span className="text-[#c27d50]">*</span>
            </label>
            <input
              id="event-title"
              name="title"
              value={eventForm.title}
              onChange={handleEventChange}
              placeholder="Event Title"
              required
              className="w-full p-4 rounded-xl border border-[#cdd1bc] focus:ring-2 focus:ring-[#8a9663] transition duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-[#6b7547] font-medium"
              aria-label="Event title"
            />
          </div>
          <div>
            <label htmlFor="event-description" className="block mb-2 font-semibold text-[#6b7547]">
              Event Description <span className="text-[#c27d50]">*</span>
            </label>
            <textarea
              id="event-description"
              name="description"
              value={eventForm.description}
              onChange={handleEventChange}
              placeholder="Event Description"
              required
              rows={4}
              className="w-full p-4 rounded-xl border border-[#cdd1bc] focus:ring-2 focus:ring-[#8a9663] transition duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-[#6b7547] font-medium resize-none"
              aria-label="Event description"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="event-date" className="block mb-2 font-semibold text-[#6b7547]">
                Event Date <span className="text-[#c27d50]">*</span>
              </label>
              <input
                id="event-date"
                type="date"
                name="date"
                value={eventForm.date}
                onChange={handleEventChange}
                required
                className="w-full p-4 rounded-xl border border-[#cdd1bc] focus:ring-2 focus:ring-[#8a9663] transition duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-[#6b7547] font-medium"
                aria-label="Event date"
              />
            </div>
            <div>
              <label htmlFor="event-time" className="block mb-2 font-semibold text-[#6b7547]">
                Event Time <span className="text-[#c27d50]">*</span>
              </label>
              <input
                id="event-time"
                type="time"
                name="time"
                value={eventForm.time}
                onChange={handleEventChange}
                required
                className="w-full p-4 rounded-xl border border-[#cdd1bc] focus:ring-2 focus:ring-[#8a9663] transition duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-[#6b7547] font-medium"
                aria-label="Event time"
              />
            </div>
          </div>
          <div>
            <label htmlFor="event-location" className="block mb-2 font-semibold text-[#6b7547]">
              Location <span className="text-[#c27d50]">*</span>
            </label>
            <input
              id="event-location"
              name="location"
              value={eventForm.location}
              onChange={handleEventChange}
              placeholder="Location"
              required
              className="w-full p-4 rounded-xl border border-[#cdd1bc] focus:ring-2 focus:ring-[#8a9663] transition duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-[#6b7547] font-medium"
              aria-label="Event location"
            />
          </div>
          <div>
            <label htmlFor="event-image" className="block mb-2 font-semibold text-[#6b7547]">
              Event Image (Optional)
            </label>
            <input
              id="event-image"
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="formInput"
              aria-label="Upload event image"
              title="Upload an image for the event"
            />
            {currentImageUrl && (
              <div className="mt-2">
                <p className="text-xs mb-1">Current image:</p>
                <img
                  src={currentImageUrl}
                  alt="Event preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="waiver_required"
              checked={eventForm.waiver_required}
              onChange={handleEventChange}
            />
            Waiver Required?
          </label>
          {eventForm.waiver_required && (
            <div>
              <label htmlFor="waiver-file" className="block mb-1 font-semibold">
                Upload Waiver PDF <span className="text-red-600">*</span>
              </label>
              <input
                id="waiver-file"
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                className="formInput"
                required={!eventForm.waiver_url}
                aria-label="Upload waiver PDF file"
                title="Upload a PDF waiver file for the event"
              />
              {eventForm.waiver_url && eventForm.date >= new Date().toISOString().split("T")[0] && (
                <p className="text-xs mt-1">
                  Current:{" "}
                  <a
                    href={eventForm.waiver_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-700"
                  >
                    Download Existing Waiver
                  </a>
                </p>
              )}
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-[#8a9663] hover:bg-[#7a8757] text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {eventForm.id ? "Update Event" : "Create Event"}
            </button>
            {eventForm.id && (
              <button
                type="button"
                onClick={() =>
                  setEventForm({
                    id: "",
                    title: "",
                    description: "",
                    date: "",
                    time: "",
                    location: "",
                    waiver_required: false,
                    waiver_url: "",
                    image_id: "",
                  })
                }
                className="bg-gradient-to-r from-[#f4f3ec] to-[#e6e8d5] text-[#6b7547] border border-[#cdd1bc] hover:bg-gradient-to-r hover:from-[#e6e8d5] hover:to-[#d4d8c1] rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </motion.form>
      </motion.div>
    </section>
  );
};

export default CreateEventTab;
